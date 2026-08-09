import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY manquante");
}

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes");
}

const stripe = new Stripe(stripeSecretKey);

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return Response.json(
        { error: "ID commande manquant" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id,price_cents,status,return_payment_status,return_price_cents"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return Response.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      return Response.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const allowedStatuses = [
      "RETURN_PAYMENT_PENDING",
      "REFUSED_BY_RECIPIENT",
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

    const alreadyPaid =
      String(order.return_payment_status || "").toLowerCase() === "paid";

    if (alreadyPaid) {
      return Response.json(
        { error: "Le retour est déjà payé." },
        { status: 400 }
      );
    }

    const initialPrice = Number(order.price_cents || 0);

    if (initialPrice <= 0) {
      return Response.json(
        { error: "Prix initial invalide." },
        { status: 400 }
      );
    }

    const returnAmount = Math.round(initialPrice * 0.5);

    if (returnAmount <= 0) {
      return Response.json(
        { error: "Montant du retour invalide." },
        { status: 400 }
      );
    }

    const origin =
      req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Retour à l'expéditeur HelpFlow (${order.id})`,
            },
            unit_amount: returnAmount,
          },
          quantity: 1,
        },
      ],

      metadata: {
        orderId: order.id,
        paymentType: "RETURN",
      },

      success_url:
        `${origin}/payment/success` +
        `?orderId=${order.id}` +
        `&paymentType=RETURN` +
        `&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${origin}/client/orders/${order.id}`,
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        return_price_cents: returnAmount,
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

    return Response.json({
      url: session.url,
      amount: returnAmount,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur serveur";

    console.error("Erreur checkout retour :", error);

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}