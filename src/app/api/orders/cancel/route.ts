import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { orderId } = body;

  if (!orderId) return NextResponse.json({ error: "orderId manquant" }, { status: 400 });

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, status, payment_intent_id")
    .eq("id", orderId)
    .single();

  if (error || !order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  // Si déjà acceptée / en cours : on bloque (MVP)
  if (order.status === "ACCEPTED" || order.status === "PICKED_UP" || order.status === "DELIVERED") {
    return NextResponse.json({ error: "Commande non annulable (déjà prise)" }, { status: 400 });
  }

  // Si DRAFT : juste annuler en base
  if (order.status === "DRAFT") {
    await supabaseAdmin.from("orders").update({
      status: "CANCELED",
      canceled_at: new Date().toISOString(),
    }).eq("id", order.id);

    return NextResponse.json({ ok: true });
  }

  // Si PAID : refund Stripe
  if (order.status === "PAID" && order.payment_intent_id) {
    await stripe.refunds.create({ payment_intent: order.payment_intent_id });

    await supabaseAdmin.from("orders").update({
      status: "CANCELED",
      canceled_at: new Date().toISOString(),
    }).eq("id", order.id);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "État commande invalide" }, { status: 400 });
}