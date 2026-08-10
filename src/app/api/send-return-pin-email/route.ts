import { NextResponse } from "next/server";
import { sendReturnPinEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const {
      to,
      pin,
      orderId,
      amountCents,
    } = await req.json();

    if (!to || !pin || !orderId) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }

    await sendReturnPinEmail({
      to,
      pin,
      orderId,
      amountCents,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erreur envoi email Code PIN retour",
      },
      { status: 500 }
    );
  }
}