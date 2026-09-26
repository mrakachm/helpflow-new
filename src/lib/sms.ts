export type SmsResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; status?: number };

type OvhClient = {
  requestPromised: (
    method: string,
    path: string,
    body?: unknown
  ) => Promise<unknown>;
};

type OvhFactory = (options: {
  endpoint: string;
  appKey: string;
  appSecret: string;
  consumerKey: string;
}) => OvhClient;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const createOvhClient = require("@ovhcloud/node-ovh") as OvhFactory;

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
  const appKey = process.env.OVH_APPLICATION_KEY;
  const appSecret = process.env.OVH_APPLICATION_SECRET;
  const consumerKey = process.env.OVH_CONSUMER_KEY;
  const serviceName = process.env.OVH_SMS_SERVICE;

  if (!appKey || !appSecret || !consumerKey || !serviceName) {
    return {
      ok: false,
      error: "Configuration SMS OVHcloud manquante",
    };
  }

  const ovh = createOvhClient({
    endpoint: "ovh-eu",
    appKey,
    appSecret,
    consumerKey,
  });

  try {
    const data = await ovh.requestPromised(
      "POST",
      `/sms/${serviceName}/jobs`,
      {
        message,
        receivers: [normalizePhone(phone)],
        senderForResponse: true,
      }
    );

    return {
      ok: true,
      data,
    };
  } catch (error: unknown) {
    const ovhError = error as {
      error?: number;
      message?: string;
    };

    return {
      ok: false,
      error:
        ovhError?.message ||
        "Erreur lors de l'envoi du SMS OVHcloud",
      status:
        typeof ovhError?.error === "number"
          ? ovhError.error
          : undefined,
    };
  }
}