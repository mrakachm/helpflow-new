import { Resend } from "resend";

export async function sendOtpEmail({
  to,
  otp,
  orderId,
}: {
  to: string;
  otp: string;
  orderId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquante");
  }

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from: "HelpFlow <onboarding@resend.dev>",
    to,
    subject: "Votre code OTP de livraison",
    html: `
      <h2>Votre livraison est en cours</h2>
      <p>Commande : <strong>${orderId}</strong></p>
      <p>Votre code OTP :</p>
      <h1>${otp}</h1>
      <p>Donnez ce code uniquement au livreur quand vous recevez bien la commande.</p>
    `,
  });

  console.log("✅ Résultat Resend:", JSON.stringify(result, null, 2));

  return result;
}