import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  "mailto:contact@helpflow.fr",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();

  const title = body.title || "Nouvelle mission HelpFlow";
  const message = body.message || "Une nouvelle mission est disponible.";

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("subscription");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await Promise.allSettled(
    (data || []).map((row) =>
      webpush.sendNotification(
        row.subscription,
        JSON.stringify({
          title,
          body: message,
          icon: "/icon-192.png",
          url: "/livreur/missions",
        })
      )
    )
  );

  return NextResponse.json({ ok: true });
}