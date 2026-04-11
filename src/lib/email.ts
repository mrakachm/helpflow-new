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

  return await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: "Code OTP de livraison",
    html: `
      <h2>Votre livraison est en cours</h2>
      <p>Commande : ${orderId}</p>
      <p>Votre code OTP :</p>
      <h1>${otp}</h1>
      <p>Donnez ce code uniquement au livreur lors de la livraison.</p>
    `,
  });
}