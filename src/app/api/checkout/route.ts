import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = String(body?.orderId || "").trim();
    const paymentType =
      body?.paymentType === "RETURN" ? "RETURN" : "INITIAL";

    if (!orderId) {
      return Response.json(
        { error: "ID commande manquant" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!order) {
      return Response.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    let amount = 0;
    let productName = "";
    let successUrl = "";

    const origin =
      req.headers.get("origin") || "http://localhost:3000";

    // =========================
    // PAIEMENT INITIAL
    // =========================
    if (paymentType === "INITIAL") {
      const alreadyPaid =
        String(order.payment_status || "").toLowerCase() === "paid";

      if (alreadyPaid) {
        return Response.json(
          { error: "Cette commande est déjà payée." },
          { status: 400 }
        );
      }

      amount = Number(order.price_cents || 0);

      if (amount <= 0) {
        return Response.json(
          { error: "Prix de commande invalide." },
          { status: 400 }
        );
      }

      productName = `Livraison Jalin Livraison (${order.id})`;

      successUrl =
        `${origin}/payment/success` +
        `?orderId=${order.id}` +
        `&paymentType=INITIAL` +
        `&session_id={CHECKOUT_SESSION_ID}`;
    }

    // =========================
    // PAIEMENT DU RETOUR
    // =========================
    if (paymentType === "RETURN") {
      const allowedStatuses = [
        "RETURN_PAYMENT_PENDING",
        "RETURN_TO_SENDER",
      ];

      if (!allowedStatuses.includes(String(order.status || ""))) {
        return Response.json(
          {
            error:
              "Cette commande n'est pas en attente d'un paiement de retour.",
          },
          { status: 400 }
        );
      }

      const returnAlreadyPaid =
        String(order.return_payment_status || "").toLowerCase() === "paid";

      if (returnAlreadyPaid) {
        return Response.json(
          { error: "Le retour de cette commande est déjà payé." },
          { status: 400 }
        );
      }

      // 50 % du prix initial.
      amount = Math.round(Number(order.price_cents || 0) * 0.5);

      if (amount <= 0) {
        return Response.json(
          { error: "Prix du retour invalide." },
          { status: 400 }
        );
      }

      productName = `Retour à l'expéditeur Jalin Livraison (${order.id})`;

      successUrl =
        `${origin}/payment/success` +
        `?orderId=${order.id}` +
        `&paymentType=RETURN` +
        `&session_id={CHECKOUT_SESSION_ID}`;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      metadata: {
        orderId: order.id,
        paymentType,
      },

      success_url: successUrl,
      cancel_url: `${origin}/client/orders/${order.id}`,
    });

    // =========================
    // ENREGISTREMENT SESSION
    // =========================
    if (paymentType === "INITIAL") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          stripe_session_id: session.id,
          payment_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        return Response.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          return_price_cents: amount,
          return_stripe_session_id: session.id,
          return_payment_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        return Response.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    return Response.json({
      url: session.url,
      paymentType,
      amount,
    });
  } catch (err) {
    console.error("Erreur checkout HelpFlow:", err);

    return Response.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}