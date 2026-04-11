import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = String(body?.orderId ?? "").trim();
    const amountCents = Number(body?.amountCents ?? 0);

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId manquant" },
        { status: 400 }
      );
    }

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Paiement HelpFlow",
            },
            unit_amount: 100,
          },
          quantity: 1,
        },
      ],
      metadata: { orderId },
      success_url: `${siteUrl}/payment/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment/cancel?orderId=${orderId}`,
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_session_id: session.id,
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json(
        {
          error: "Erreur mise à jour commande",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    if (!session.url) {
      return NextResponse.json(
        { error: "URL Stripe manquante" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "checkout error" },
      { status: 500 }
    );
  }
}