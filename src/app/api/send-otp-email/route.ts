import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { to, otp, orderId } = await req.json();

    if (!to || !otp || !orderId) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }

    await sendOtpEmail({ to, otp, orderId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur envoi email" },
      { status: 500 }
    );
  }
}