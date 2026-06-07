import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOtpEmail } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId manquant" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, recipient_email, delivery_otp")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    if (!order.recipient_email) {
      return NextResponse.json(
        { error: "recipient_email manquant" },
        { status: 400 }
      );
    }

    if (!order.delivery_otp) {
      return NextResponse.json(
        { error: "delivery_otp manquant" },
        { status: 400 }
      );
    }

    const result = await sendOtpEmail({
      to: order.recipient_email,
      otp: order.delivery_otp,
      orderId: order.id,
    });

    return NextResponse.json({
      success: true,
      message: "Email OTP renvoyé",
      to: order.recipient_email,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur resend OTP" },
      { status: 500 }
    );
  }
}