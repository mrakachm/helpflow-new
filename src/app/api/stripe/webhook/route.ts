import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendOtpEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

function generateOtp(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Signature Stripe manquante" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "STRIPE_WEBHOOK_SECRET manquant" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "Signature webhook invalide" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        return NextResponse.json(
          { error: "orderId manquant dans les metadata Stripe" },
          { status: 400 }
        );
      }

      const now = new Date();
      const nowIso = now.toISOString();
      const otp = generateOtp(6);
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: "Commande introuvable dans la base" },
          { status: 404 }
        );
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          paid_at: nowIso,
          delivery_otp: otp,
          delivery_otp_expires_at: expiresAt,
          delivery_otp_attempts: 0,
          delivery_otp_locked_until: null,
          updated_at: nowIso,
        })
        .eq("id", orderId);

      if (updateError) {
        return NextResponse.json(
          { error: "Échec mise à jour commande après paiement" },
          { status: 500 }
        );
      }
("ORDER EMAIL FIELD", order);
        try {
         await sendOtpEmail({
  to: receiverEmail,
  otp,
  orderId,
});
        } catch (emailError: any) {
          return NextResponse.json(
            {
              error:
                emailError?.message || "Paiement OK mais envoi OTP échoué",
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ received: true });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "webhook processing error" },
      { status: 500 }
    );
  }
}