import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (
  !supabaseUrl ||
  !serviceRoleKey ||
  !anonKey
) {
  throw new Error(
    "Variables Supabase manquantes"
  );
}

const adminSupabase =
  createClient(
    supabaseUrl,
    serviceRoleKey
  );

export async function POST(
  req: Request
) {
  try {
    /* ============================
       AUTHENTIFICATION LIVREUR
       ============================ */

    const authorization =
      req.headers.get(
        "authorization"
      );

    if (
      !authorization?.startsWith(
        "Bearer "
      )
    ) {
      return Response.json(
        {
          error:
            "Authentification requise",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.substring(
        7
      );

    /*
     * Client Supabase utilisant
     * le token réel du livreur.
     */
    const userSupabase =
      createClient(
        supabaseUrl,
        anonKey,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        }
      );

    const {
      data: userData,
      error: userError,
    } =
      await userSupabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      return Response.json(
        {
          error:
            "Session livreur invalide",
        },
        {
          status: 401,
        }
      );
    }

    const courierId =
      userData.user.id;

    /* ============================
       LECTURE DU BODY
       ============================ */

    const body =
      await req.json();

    const orderId =
      String(
        body?.orderId || ""
      ).trim();

    const pin =
      String(
        body?.pin || ""
      ).trim();

    if (!orderId) {
      return Response.json(
        {
          error:
            "Commande manquante",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{4}$/.test(pin)
    ) {
      return Response.json(
        {
          error:
            "Le Code PIN doit contenir 4 chiffres",
        },
        {
          status: 400,
        }
      );
    }

    /* ============================
       RÉCUPÉRATION COMMANDE
       ============================ */

    const {
      data: order,
      error: orderError,
    } = await adminSupabase
      .from("orders")
      .select(
        `
        id,
        courier_id,
        status,
        return_payment_status,
        return_pin_code,
        return_pin_verified_at
        `
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      throw new Error(
        orderError.message
      );
    }

    if (!order) {
      return Response.json(
        {
          error:
            "Commande introuvable",
        },
        {
          status: 404,
        }
      );
    }

    /* ============================
       LE LIVREUR DOIT ÊTRE
       LE LIVREUR DE CETTE COMMANDE
       ============================ */

    if (
      order.courier_id !==
      courierId
    ) {
      return Response.json(
        {
          error:
            "Cette commande ne vous appartient pas",
        },
        {
          status: 403,
        }
      );
    }

    /* ============================
       RETOUR OBLIGATOIREMENT PAYÉ
       ============================ */

    if (
      String(
        order.return_payment_status ||
          ""
      ).toLowerCase() !==
      "paid"
    ) {
      return Response.json(
        {
          error:
            "Le retour n'a pas encore été payé",
        },
        {
          status: 400,
        }
      );
    }

    const allowedStatuses = [
      "RETURN_TO_SENDER",
      "RETURN_SCHEDULED",
    ];

    if (
      !allowedStatuses.includes(
        String(
          order.status || ""
        ).toUpperCase()
      )
    ) {
      return Response.json(
        {
          error:
            "Cette commande n'est pas en cours de retour",
        },
        {
          status: 400,
        }
      );
    }

    /* ============================
       RETOUR DÉJÀ CONFIRMÉ
       ============================ */

    if (
      order.return_pin_verified_at
    ) {
      return Response.json(
        {
          error:
            "Ce retour a déjà été confirmé",
        },
        {
          status: 409,
        }
      );
    }

    /* ============================
       VÉRIFICATION DU PIN
       ============================ */

    const expectedPin =
      String(
        order.return_pin_code || ""
      ).trim();

    if (!expectedPin) {
      return Response.json(
        {
          error:
            "Code PIN retour introuvable",
        },
        {
          status: 500,
        }
      );
    }

    if (
      pin !== expectedPin
    ) {
      return Response.json(
        {
          error:
            "Code PIN retour incorrect",
        },
        {
          status: 400,
        }
      );
    }

    /* ============================
       RETOUR TERMINÉ
       ============================ */

    const now =
      new Date().toISOString();

    const {
      error: updateError,
    } = await adminSupabase
      .from("orders")
      .update({
        status:
          "RETURN_COMPLETED",

        return_pin_verified_at:
          now,

        return_completed_at:
          now,

        updated_at:
          now,
      })
      .eq("id", orderId)
      .eq(
        "courier_id",
        courierId
      )
      .in(
        "status",
        [
          "RETURN_TO_SENDER",
          "RETURN_SCHEDULED",
        ]
      );

    if (updateError) {
      throw new Error(
        updateError.message
      );
    }

    return Response.json({
      success: true,
      status:
        "RETURN_COMPLETED",
      message:
        "Retour confirmé avec succès",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur vérification Code PIN retour";

    console.error(
      "VERIFY RETURN PIN ERROR =>",
      error
    );

    return Response.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}