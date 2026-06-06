import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    console.log("✅ Paiement reçu:", orderId);

    if (orderId) {
      const otp = generateOtp();

     const { error } = await supabase
  .from("orders")
  .update({
    status: "PENDING",
    payment_status: "PAID",
    delivery_otp: otp,
    updated_at: new Date().toISOString(),
  })
  .eq("id", orderId);

if (error) {
  console.error("❌ Erreur DB:", error);
} else {
  console.log("✅ Commande mise à jour avec OTP !");
}
    }
  }

  return new NextResponse("OK", { status: 200 });
}