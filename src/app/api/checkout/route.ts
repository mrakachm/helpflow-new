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
      console.error("Erreur Supabase checkout:", error);
      return Response.json({ error: error.message }, { status: 100 });
    }

    if (!order) {
      return Response.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const alreadyPaid =
      order.statut === "payé" ||
      order.statut === "paid" ||
      order.status === "paid" ||
      order.status === "payé";

    if (alreadyPaid) {
      return Response.json(
        { error: "Cette commande est déjà payée. Impossible de repayer." },
        { status: 400 }
      );
    }

    const amount =
      order.price_cents ||
      order.prix_cents ||
      order["prix_cents"] ||
      order["prix proposé par le client_cents"] ||
      order["prix_proposé_par_le_client_cents"];

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
      success_url: `${origin}/payment/success?orderId=${order.id}`,
      cancel_url: `${origin}/client/orders/${order.id}`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Erreur checkout:", err);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}