import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type VerifyOtpBody = {
  orderId?: string;
  otp?: string;
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
      .select("id,status,otp_code,courier_id")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const dbOtp = String(order.otp_code || "").trim();

    if (!dbOtp) {
      return NextResponse.json(
        { error: "Aucun code OTP généré pour cette commande" },
        { status: 400 }
      );
    }

    if (dbOtp !== otp) {
      return NextResponse.json(
        { error: "Code OTP incorrect" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "DELIVERED",
        delivered_at: now,
        updated_at: now,
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