type SendOtpEmailParams = {
  to: string;
  otp: string;
  orderId: string;
};

export async function sendOtpEmail({
  to,
  otp,
  orderId,
}: SendOtpEmailParams) {
  if (!to || !otp || !orderId) {
    throw new Error("Email, OTP ou ID commande manquant.");
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquante.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "HelpFlow <noreply@helpflow.fr>",
      to: [to],
      subject: "Votre code OTP HelpFlow",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Votre code de livraison HelpFlow</h2>

          <p>Votre commande HelpFlow a été créée avec succès.</p>

          <p><strong>Numéro de commande :</strong> ${orderId}</p>

          <div style="margin: 24px 0; padding: 18px; background: #f3f4f6; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Code OTP de livraison</p>
            <p style="margin: 0; font-size: 34px; font-weight: 700; letter-spacing: 5px; color: #2563eb;">
              ${otp}
            </p>
          </div>

          <p>
            Donnez ce code uniquement au livreur lorsque vous avez bien reçu votre colis.
          </p>

          <p style="font-size: 13px; color: #6b7280;">
            Si vous n'êtes pas à l'origine de cette commande, vous pouvez ignorer cet email.
          </p>

          <p style="margin-top: 24px;">Merci,<br />L'équipe HelpFlow</p>
        </div>
      `,
    }),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error("RESEND EMAIL ERROR:", data);
    throw new Error(
      data?.message ||
        data?.error ||
        "Erreur lors de l'envoi de l'email OTP."
    );
  }

  return data;
}