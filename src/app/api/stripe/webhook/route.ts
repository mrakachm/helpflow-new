import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

const supabase = createClient(supabaseUrl, serviceRoleKey);

function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getSiteUrl(req: Request): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host");

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

async function processInitialPayment(
  req: Request,
  session: Stripe.Checkout.Session,
  orderId: string
): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id,payment_status,status,recipient_email,otp_code,delivery_otp"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    throw new Error(`Commande ${orderId} introuvable`);
  }

  const alreadyPaid =
    String(order.payment_status || "").toLowerCase() === "paid";

  if (alreadyPaid) {
    return;
  }

  const codePin =
    String(order.otp_code || order.delivery_otp || "").trim() ||
    generatePin();

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "PUBLISHED",
      otp_code: codePin,
      stripe_session_id: session.id,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (!order.recipient_email) {
    return;
  }

  const siteUrl = getSiteUrl(req);

  try {
    const emailResponse = await fetch(`${siteUrl}/api/send-otp-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: order.recipient_email,
        otp: codePin,
        orderId,
      }),
    });

    if (!emailResponse.ok) {
      const emailResult = await emailResponse.json().catch(() => ({}));

      console.error("Erreur envoi Code PIN :", emailResult);
    }
  } catch (emailError) {
    console.error("Erreur appel API email Code PIN :", emailError);
  }
}

async function processReturnPayment(
  session: Stripe.Checkout.Session,
  orderId: string
): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,status,return_payment_status,return_price_cents")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    throw new Error(`Commande ${orderId} introuvable`);
  }

  const alreadyPaid =
    String(order.return_payment_status || "").toLowerCase() === "paid";

  if (alreadyPaid) {
    return;
  }

  const amountPaid =
    session.amount_total || Number(order.return_price_cents || 0);

  if (amountPaid <= 0) {
    throw new Error("Montant du retour invalide");
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "RETURN_TO_SENDER",
      return_payment_status: "paid",
      return_price_cents: amountPaid,
      return_courier_earnings_cents: amountPaid,
      return_stripe_session_id: session.id,
      return_paid_at: now,
      updated_at: now,
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { error: "Signature Stripe manquante" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      stripeWebhookSecret!
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur Stripe inconnue";

    console.error("Signature webhook Stripe invalide :", message);

    return Response.json(
      { error: "Signature webhook invalide" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        return Response.json({ received: true });
      }

      const orderId = String(session.metadata?.orderId || "").trim();

      const paymentType = String(
        session.metadata?.paymentType || "INITIAL"
      )
        .trim()
        .toUpperCase();

      if (!orderId) {
        throw new Error("orderId absent des métadonnées Stripe");
      }

      if (paymentType === "RETURN") {
        await processReturnPayment(session, orderId);
      } else {
        await processInitialPayment(req, session, orderId);
      }
    }

    return Response.json({ received: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur traitement webhook Stripe";

    console.error("Erreur traitement webhook Stripe :", error);

    return Response.json({ error: message }, { status: 500 });
  }
}