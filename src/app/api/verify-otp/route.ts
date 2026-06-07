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

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Variables Supabase manquantes");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyOtpBody;

    const orderId = String(body?.orderId || "").trim();
    const otp = String(body?.otp || "").trim();

    if (!orderId || !otp) {
      return NextResponse.json(
        { error: "orderId ou otp manquant" },
        { status: 400 }
      );
    }

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        "id,status,delivery_otp,delivery_otp_expires_at,delivered_at,updated_at,courier_id"
      )
      .eq("id", orderId)
      .single<OrderRow>();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    if (!order.delivery_otp) {
      return NextResponse.json(
        { error: "Aucun code OTP généré pour cette commande" },
        { status: 400 }
      );
    }

    if (order.delivery_otp !== otp) {
      return NextResponse.json(
        { error: "Code OTP incorrect" },
        { status: 400 }
      );
    }

    if (order.delivery_otp_expires_at) {
      const expiresAt = new Date(order.delivery_otp_expires_at).getTime();

      if (expiresAt < Date.now()) {
        return NextResponse.json(
          { error: "Code OTP expiré" },
          { status: 400 }
        );
      }
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "LIVRÉ",
        delivery_otp_verified_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur vérification OTP" },
      { status: 500 }
    );
  }
}