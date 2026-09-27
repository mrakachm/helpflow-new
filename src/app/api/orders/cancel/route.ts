import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = body?.orderId as string | undefined;
    const action = String(body?.action || "").trim().toUpperCase();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId manquant" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id,client_id,status,payment_intent_id,return_payment_status"
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        {
          error: "Commande introuvable",
          message: error?.message,
        },
        { status: 404 }
      );
    }

    // Choix du client après un refus du destinataire :
    // ne pas organiser le retour.
    // Le paiement initial reste intact.
    if (action === "DECLINE_RETURN") {
      const authorization = req.headers.get("authorization") || "";
      const accessToken = authorization
        .replace(/^Bearer\s+/i, "")
        .trim();

      if (!accessToken) {
        return NextResponse.json(
          { error: "Authentification requise" },
          { status: 401 }
        );
      }

      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (authError || !user) {
        return NextResponse.json(
          { error: "Session invalide ou expirée" },
          { status: 401 }
        );
      }

      if (order.client_id !== user.id) {
        return NextResponse.json(
          { error: "Cette commande ne vous appartient pas" },
          { status: 403 }
        );
      }

      const status = String(order.status || "").toUpperCase();

      const returnPaymentStatus = String(
        order.return_payment_status || ""
      ).toLowerCase();

      if (returnPaymentStatus === "paid") {
        return NextResponse.json(
          {
            error:
              "Le retour est déjà payé et ne peut plus être refusé",
          },
          { status: 400 }
        );
      }

      if (
        status !== "RETURN_PAYMENT_PENDING" &&
        status !== "REFUSED_BY_RECIPIENT"
      ) {
        return NextResponse.json(
          {
            error:
              "Aucune décision de retour n’est en attente",
          },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();

      const { error: declineError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "CANCELED",
          canceled_at: now,
          updated_at: now,
        })
        .eq("id", order.id)
        .eq("client_id", user.id);

      if (declineError) {
        return NextResponse.json(
          {
            error:
              "Impossible d’enregistrer votre décision",
            message: declineError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        action: "DECLINE_RETURN",
      });
    }

    // Si déjà prise, on bloque.
    if (
      order.status === "ACCEPTED" ||
      order.status === "PICKED_UP" ||
      order.status === "DELIVERING"
    ) {
      return NextResponse.json(
        {
          error: "Commande non annulable (déjà prise)",
        },
        { status: 400 }
      );
    }

    // Si DRAFT : annuler directement.
    if (order.status === "DRAFT") {
      const now = new Date().toISOString();

      const { error: cancelError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "CANCELED",
          canceled_at: now,
          updated_at: now,
        })
        .eq("id", order.id);

      if (cancelError) {
        return NextResponse.json(
          {
            error: "Impossible d’annuler la commande",
            message: cancelError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
      });
    }

    // Si PAID : remboursement Stripe si possible.
    if (
      order.status === "PAID" &&
      order.payment_intent_id
    ) {
      await stripe.refunds.create({
        payment_intent: order.payment_intent_id,
      });

      const now = new Date().toISOString();

      const { error: cancelError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "CANCELED",
          canceled_at: now,
          updated_at: now,
        })
        .eq("id", order.id);

      if (cancelError) {
        return NextResponse.json(
          {
            error:
              "Remboursement effectué mais erreur lors de l’annulation de la commande",
            message: cancelError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
      });
    }

    return NextResponse.json(
      {
        error: "État commande invalide",
        status: order.status,
      },
      { status: 400 }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "unknown";

    return NextResponse.json(
      {
        error: "Erreur serveur",
        message,
      },
      { status: 500 }
    );
  }
}