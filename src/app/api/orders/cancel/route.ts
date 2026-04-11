// src/app/api/orders/cancel/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = body?.orderId as string | undefined;

    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant" }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id,status,payment_intent_id")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Commande introuvable", message: error?.message },
        { status: 404 }
      );
    }

    // Si déjà prise, on bloque (exemple)
    if (
      order.status === "ACCEPTED" ||
      order.status === "PICKED_UP" ||
      order.status === "DELIVERING"
    ) {
      return NextResponse.json(
        { error: "Commande non annulable (déjà prise)" },
        { status: 400 }
      );
    }

    // Si DRAFT : annuler direct
    if (order.status === "DRAFT") {
      await supabaseAdmin
        .from("orders")
        .update({ status: "CANCELED", canceled_at: new Date().toISOString() })
        .eq("id", order.id);

      return NextResponse.json({ ok: true });
    }

    // Si PAID : refund Stripe si possible
    if (order.status === "PAID" && order.payment_intent_id) {
      await stripe.refunds.create({ payment_intent: order.payment_intent_id });

      await supabaseAdmin
        .from("orders")
        .update({ status: "CANCELED", canceled_at: new Date().toISOString() })
        .eq("id", order.id);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "État commande invalide", status: order.status },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erreur serveur", message: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}