import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    console.log("CHECKOUT orderId:", orderId);

    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant" }, { status: 400 });
    }

    // 1) Lire la commande (anti-triche)
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, price_cents, platform_fee_cents")
      .eq("id", orderId)
      .single();

    console.log("SUPABASE order:", order);
    console.log("SUPABASE error:", error);

    if (error || !order) {
      return NextResponse.json(
        { error: "Supabase error", message: error?.message ?? "order null" },
        { status: 400 }
      );
    }

    // 2) Vérifs simples
    const unitAmount = Number(order.price_cents);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide", unitAmount },
        { status: 400 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 3) Créer session Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "HelpFlow - Livraison" },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: order.id },
      success_url: `${siteUrl}/client/orders?paid=1`,
      cancel_url: `${siteUrl}/client/new-order?canceled=1`,
    });

    // 4) Stocker stripe_session_id
    const { error: updError } = await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    if (updError) {
      return NextResponse.json(
        { error: "Supabase update error", message: updError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erreur serveur", message: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
