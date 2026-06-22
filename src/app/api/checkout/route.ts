import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: "ID commande manquant" }, { status: 400 });
    }

    const cleanOrderId = String(orderId).trim();

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", cleanOrderId)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!order) {
      return Response.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const alreadyPaid =
      order.payment_status === "paid" ||
      order.payment_status === "PAID";

    if (alreadyPaid) {
      return Response.json(
        { error: "Cette commande est déjà payée." },
        { status: 400 }
      );
    }

    const amount = order.price_cents;

    if (!amount || amount <= 0) {
      return Response.json({ error: "Prix invalide" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Commande HelpFlow (${order.id})`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order.id,
      },
      success_url: `${origin}/payment/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/client/orders/${order.id}`,
    });

    await supabase
      .from("orders")
      .update({
        stripe_session_id: session.id,
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Erreur checkout:", err);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}