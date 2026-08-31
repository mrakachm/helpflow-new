import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendSms } from "@/lib/sms";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY manquante");
}

if (!stripeWebhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET manquante");
}

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes");
}

const stripe = new Stripe(stripeSecretKey);

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey
);

function generatePin(): string {
  return Math.floor(
    1000 + Math.random() * 9000
  ).toString();
}

function getSiteUrl(req: Request): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const forwardedHost =
    req.headers.get("x-forwarded-host");

  const host =
    forwardedHost ||
    req.headers.get("host");

  const forwardedProto =
    req.headers.get("x-forwarded-proto");

  const protocol =
    forwardedProto || "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

/* =========================================================
   PAIEMENT INITIAL
   ========================================================= */

async function processInitialPayment(
  req: Request,
  session: Stripe.Checkout.Session,
  orderId: string
): Promise<void> {
  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .select(
      `
      id,
      payment_status,
      status,
      recipient_email,
      receiver_phone,
      otp_code,
      delivery_otp
      `
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    throw new Error(
      `Commande ${orderId} introuvable`
    );
  }

  const alreadyPaid =
    String(
      order.payment_status || ""
    ).toLowerCase() === "paid";

  if (alreadyPaid) {
    return;
  }

  const codePin =
    String(
      order.otp_code ||
      order.delivery_otp ||
      ""
    ).trim() || generatePin();

  const now =
    new Date().toISOString();

  const { error: updateError } =
    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "PUBLISHED",

        // PIN de livraison pour le RECEVEUR
        otp_code: codePin,

        stripe_session_id: session.id,
        paid_at: now,
        updated_at: now,
      })
      .eq("id", orderId);

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  const siteUrl = getSiteUrl(req);

  // L'e-mail est facultatif : on l'envoie uniquement s'il est renseigné.
  if (order.recipient_email) {
    try {
      const emailResponse = await fetch(
        `${siteUrl}/api/send-otp-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: order.recipient_email,
            otp: codePin,
            orderId,
          }),
        }
      );

      if (!emailResponse.ok) {
        const emailResult = await emailResponse
          .json()
          .catch(() => ({}));

        console.error(
          "Erreur envoi Code PIN livraison :",
          emailResult
        );
      }
    } catch (emailError) {
      console.error(
        "Erreur appel API email Code PIN livraison :",
        emailError
      );
    }
  }

  // Le SMS est le moyen principal d'envoi du Code PIN au receveur.
  if (!order.receiver_phone) {
    console.error(
      `Code PIN généré pour ${orderId}, mais téléphone receveur introuvable`
    );
    return;
  }

  try {
    const smsResult = await sendSms(
      order.receiver_phone,
      `HelpFlow - Votre Code PIN de livraison est ${codePin}. Communiquez-le au livreur uniquement lors de la remise du colis.`
    );

    if (!smsResult.ok) {
      console.error(
        "Erreur envoi SMS Code PIN livraison :",
        smsResult.error
      );
    }
  } catch (smsError) {
    console.error(
      "Erreur appel SMS Code PIN livraison :",
      smsError
    );
  }
}

/* =========================================================
   RETROUVER L'EMAIL DE L'EXPÉDITEUR
   ========================================================= */

async function getSenderEmail(
  clientId: string | null
): Promise<string | null> {
  if (!clientId) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase.auth.admin.getUserById(
      clientId
    );

  if (error) {
    console.error(
      "Impossible de récupérer l'expéditeur :",
      error.message
    );

    return null;
  }

  return (
    data.user?.email || null
  );
}

/* =========================================================
   PAIEMENT DU RETOUR
   ========================================================= */

async function processReturnPayment(
  req: Request,
  session: Stripe.Checkout.Session,
  orderId: string
): Promise<void> {
  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .select(
      `
      id,
      client_id,
      status,
      return_payment_status,
      return_price_cents,
      return_pin_code
      `
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(
      orderError.message
    );
  }

  if (!order) {
    throw new Error(
      `Commande ${orderId} introuvable`
    );
  }

  const alreadyPaid =
    String(
      order.return_payment_status || ""
    ).toLowerCase() === "paid";

  /*
   * Important :
   * si Stripe renvoie le webhook,
   * on ne génère PAS un nouveau PIN.
   */
  if (alreadyPaid) {
    return;
  }

  const amountPaid =
    session.amount_total ||
    Number(
      order.return_price_cents || 0
    );

  if (amountPaid <= 0) {
    throw new Error(
      "Montant du retour invalide"
    );
  }

  /*
   * Deuxième PIN :
   * uniquement pour le retour
   * à l'expéditeur.
   */
  const returnPin =
    String(
      order.return_pin_code || ""
    ).trim() || generatePin();

  const now =
    new Date().toISOString();

  const {
    error: updateError,
  } = await supabase
    .from("orders")
    .update({
      /*
       * Le retour a été payé.
       * Le livreur peut maintenant
       * le rendre aujourd'hui
       * ou choisir un autre créneau.
       */
      status: "RETURN_WAITING_COURIER",

      return_payment_status: "paid",
      return_price_cents: amountPaid,

      /*
       * Pour l'instant :
       * tout le prix du retour
       * revient au livreur.
       */
      return_courier_earnings_cents:
        amountPaid,

      return_stripe_session_id:
        session.id,

      return_paid_at: now,

      /*
       * Deuxième PIN.
       * NE PAS réutiliser otp_code.
       */
      return_pin_code: returnPin,

      /*
       * Il n'a pas encore été vérifié.
       */
      return_pin_verified_at: null,

      updated_at: now,
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  /*
   * On récupère l'email
   * du CLIENT / EXPÉDITEUR
   * directement depuis Supabase Auth.
   *
   * Pas besoin d'ajouter sender_email
   * dans orders.
   */
  const senderEmail =
    await getSenderEmail(
      order.client_id
    );

  if (!senderEmail) {
    console.error(
      `PIN retour généré pour ${orderId}, mais email expéditeur introuvable`
    );

    return;
  }

  const siteUrl =
    getSiteUrl(req);

  try {
    const response =
      await fetch(
        `${siteUrl}/api/send-return-pin-email`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            to: senderEmail,
            pin: returnPin,
            orderId,
            amountCents:
              amountPaid,
          }),
        }
      );

    if (!response.ok) {
      const result =
        await response
          .json()
          .catch(() => ({}));

      console.error(
        "Erreur envoi PIN retour :",
        result
      );
    }
  } catch (emailError) {
    console.error(
      "Erreur appel email PIN retour :",
      emailError
    );
  }
}

/* =========================================================
   WEBHOOK STRIPE
   ========================================================= */

export async function POST(
  req: Request
) {
  const signature =
    req.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return Response.json(
      {
        error:
          "Signature Stripe manquante",
      },
      {
        status: 400,
      }
    );
  }

  let event: Stripe.Event;

  try {
    /*
     * IMPORTANT :
     * Stripe exige le corps brut
     * pour vérifier la signature.
     */
    const rawBody =
      await req.text();

    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret!
      );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur Stripe inconnue";

    console.error(
      "Signature webhook Stripe invalide :",
      message
    );

    return Response.json(
      {
        error:
          "Signature webhook invalide",
      },
      {
        status: 400,
      }
    );
  }

  try {
    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session =
        event.data
          .object as Stripe.Checkout.Session;

      /*
       * On ne traite qu'un paiement
       * réellement confirmé.
       */
      if (
        session.payment_status !==
        "paid"
      ) {
        return Response.json({
          received: true,
        });
      }

      /*
       * Ces métadonnées viennent
       * de /api/checkout
       * ou /api/checkout-return.
       */
      const orderId =
        String(
          session.metadata
            ?.orderId || ""
        ).trim();

      const paymentType =
        String(
          session.metadata
            ?.paymentType ||
            "INITIAL"
        )
          .trim()
          .toUpperCase();

      if (!orderId) {
        throw new Error(
          "orderId absent des métadonnées Stripe"
        );
      }

      /*
       * RETOUR
       */
      if (
        paymentType === "RETURN"
      ) {
        await processReturnPayment(
          req,
          session,
          orderId
        );
      }

      /*
       * PAIEMENT INITIAL
       */
      else {
        await processInitialPayment(
          req,
          session,
          orderId
        );
      }
    }

    return Response.json({
      received: true,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur traitement webhook Stripe";

    console.error(
      "Erreur traitement webhook Stripe :",
      error
    );

    return Response.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}