import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type VerifyOtpBody = {
  orderId?: string;
  otp?: string;
};

type OrderRow = {
  id: string;
  status: string | null;
  delivery_otp: string | null;
  delivery_otp_expires_at: string | null;
  delivered_at: string | null;
  updated_at: string | null;
  courier_id: string | null;
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes dans .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyOtpBody;
    const orderId = String(body?.orderId || "").trim();
    const otp = String(body?.otp || "").trim();

    console.log("VERIFY OTP INPUT =>", { orderId, otp });

    if (!orderId || !otp) {
      return NextResponse.json(
        { error: "orderId ou otp manquant" },
        { status: 400 }
      );
    }

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        delivery_otp,
        delivery_otp_expires_at,
        delivered_at,
        updated_at,
        courier_id
      `)
      .eq("id", orderId)
      .maybeSingle<OrderRow>();

    console.log("VERIFY OTP ORDER =>", { order, fetchError });

    if (fetchError) {
      return NextResponse.json(
        {
          error: "Erreur lecture commande",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const currentStatus = String(order.status || "").trim().toUpperCase();

    if (currentStatus !== "OUT_FOR_DELIVERY") {
      return NextResponse.json(
        {
          error: "Commande non livrable",
          details: `Statut actuel: ${order.status}`,
        },
        { status: 400 }
      );
    }

    if (!order.delivery_otp) {
      return NextResponse.json(
        { error: "Aucun OTP associé à cette commande" },
        { status: 400 }
      );
    }

    if (String(order.delivery_otp).trim() !== otp) {
      return NextResponse.json(
        { error: "Code OTP invalide" },
        { status: 401 }
      );
    }

    if (order.delivery_otp_expires_at) {
      const expiresAt = new Date(order.delivery_otp_expires_at);
      const now = new Date();

      if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < now.getTime()) {
        return NextResponse.json(
          { error: "Code OTP expiré" },
          { status: 400 }
        );
      }
    }

    const nowIso = new Date().toISOString();

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "DELIVERED",
        delivery_otp: null,
        delivery_otp_expires_at: null,
        delivered_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", orderId)
      .select(`
        id,
        status,
        delivery_otp,
        delivery_otp_expires_at,
        delivered_at,
        updated_at,
        courier_id
      `)
      .maybeSingle<OrderRow>();

    console.log("VERIFY OTP UPDATE RESULT =>", {
      updatedOrder,
      updateError,
    });

    if (updateError) {
      return NextResponse.json(
        {
          error: "Erreur mise à jour commande",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Commande non mise à jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Commande livrée avec succès",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("VERIFY OTP UNCAUGHT ERROR =>", error);

    return NextResponse.json(
      {
        error: "Erreur serveur verify-otp",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}