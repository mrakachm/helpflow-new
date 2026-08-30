export type SmsResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; status?: number };

function normalizePhone(phone: string) {
  let value = phone.replace(/[^\d+]/g, "");

  if (value.startsWith("00")) {
    value = `+${value.slice(2)}`;
  }

  // Numéro français : 06... / 07... -> +336... / +337...
  if (value.startsWith("0")) {
    value = `+33${value.slice(1)}`;
  }

  return value;
}

export async function sendSms(
  phone: string,
  message: string
): Promise<SmsResult> {
  const apiLogin = process.env.OCTOPUSH_API_LOGIN;
  const apiKey = process.env.OCTOPUSH_API_KEY;

  if (!apiLogin || !apiKey) {
    return {
      ok: false,
      error: "Configuration SMS Octopush manquante",
    };
  }

  try {
    const response = await fetch(
      "https://api.octopush.com/v1/public/sms-campaign/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-login": apiLogin,
          "api-key": apiKey,
        },
        body: JSON.stringify({
          recipients: [
            {
              phone_number: normalizePhone(phone),
            },
          ],
          text: message,
          type: "sms_premium",
          purpose: "alert",
          sender: "HelpFlow",
        }),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.message || "Erreur lors de l'envoi du SMS",
        status: response.status,
      };
    }

    return {
      ok: true,
      data,
    };
  } catch {
    return {
      ok: false,
      error: "Impossible de contacter le service SMS",
    };
  }
}