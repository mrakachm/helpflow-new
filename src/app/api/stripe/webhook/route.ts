import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    return NextResponse.json({ error: "Signature Stripe absente" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const orderId = session?.metadata?.orderId;
    const paid = session?.payment_status === "paid";
    const paymentIntentId = session?.payment_intent;

    if (orderId && paid) {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "PAID",
          payment_intent_id: paymentIntentId ?? null,
        })
        .eq("id", orderId);
    }
  }

  return NextResponse.json({ received: true });
}
