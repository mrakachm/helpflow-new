import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOtpEmail } from "@/lib/email";

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
    console.error("❌ Webhook Stripe error:", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    console.log("✅ Paiement reçu:", orderId);

    if (!orderId) {
      return new NextResponse("OrderId manquant", { status: 400 });
    }

    const otp = generateOtp();

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update({
        status: "PENDING",
        payment_status: "PAID",
        delivery_otp: otp,
        delivery_otp_expires_at: new Date(
          Date.now() + 30 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, recipient_email, delivery_otp")
      .single();

    if (error) {
      console.error("❌ Erreur DB:", JSON.stringify(error, null, 2));

      return NextResponse.json(
        {
          error: "Erreur DB",
          details: error,
        },
        {
          status: 500,
        }
      );
    }

    console.log("✅ Commande mise à jour avec OTP:", updatedOrder);

    if (updatedOrder?.recipient_email) {
      try {
        await sendOtpEmail({
          to: updatedOrder.recipient_email,
          otp,
          orderId: updatedOrder.id,
        });

        console.log(
          "✅ Email OTP envoyé à:",
          updatedOrder.recipient_email
        );
      } catch (emailError) {
        console.error(
          "❌ Erreur envoi email OTP:",
          emailError
        );
      }
    } else {
      console.log(
        "⚠️ Aucun email receveur trouvé pour cette commande"
      );
    }
  }

  return new NextResponse("OK", { status: 200 });
}
