export type SmsResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; status?: number };

function normalizePhone(phone: string) {
  let value = phone.replace(/[^\d+]/g, "");

  if (value.startsWith("00")) {
    value = `+${value.slice(2)}`;
  }

  if (value.startsWith("0")) {
    value = `+33${value.slice(1)}`;
  }

  return value;
}

export async function sendSms(
  phone: string,
  message: string
): Promise<SmsResult> {
  const serviceName = process.env.OVH_SMS_SERVICE;
  const user = process.env.OVH_SMS_USER;
  const password = process.env.OVH_SMS_PASSWORD;

  if (!serviceName || !user || !password) {
    return {
      ok: false,
      error: "Configuration SMS OVHcloud manquante",
    };
  }

  try {
    const body = new URLSearchParams({
      account: serviceName,
      login: user,
      password,
      from: "",
      senderForResponse: "1",
      to: normalizePhone(phone),
      message,
      contentType: "application/json",
      noStop: "1",
    });

    const response = await fetch(
      "https://www.ovh.com/cgi-bin/sms/http2sms.cgi",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        cache: "no-store",
      }
    );

    const text = await response.text();

    let data: {
      status?: number;
      message?: string;
      creditLeft?: string;
      SmsIds?: string[];
    } | null = null;

    try {
      data = JSON.parse(text);
    } catch {
      return {
        ok: false,
        error: `Réponse OVH invalide : ${text}`,
        status: response.status,
      };
    }

    if (data?.status !== 100 && data?.status !== 101) {
      return {
        ok: false,
        error: data?.message || "Erreur lors de l'envoi du SMS OVHcloud",
        status: data?.status,
      };
    }

    return {
      ok: true,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de contacter le service SMS OVHcloud",
    };
  }
}