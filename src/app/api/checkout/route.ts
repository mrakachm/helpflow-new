import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Supabase server (IMPORTANT)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response("Missing orderId", { status: 400 });
    }

    // 🔍 1. Récupérer la commande
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return new Response("Order not found", { status: 404 });
    }

    const origin = req.headers.get("origin");

    // 💰 2. Créer session Stripe
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
            unit_amount: order.price_cents, // ✅ PRIX TOTAL
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
  } catch (err: any) {
    console.error("Stripe error:", err);
    return new Response("Internal error", { status: 500 });
  }
}