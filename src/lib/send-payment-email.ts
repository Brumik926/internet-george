import { createServerFn } from "@tanstack/react-start";

export interface PaymentEmailPayload {
  to: string;
  recipientName: string;
  iban: string;
  amount: number;
  date: string;
}

export const sendPaymentEmail = createServerFn({ method: "POST" })
  .validator((d: PaymentEmailPayload) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY nie je nastavený.");
      return { success: false, error: "Chýba RESEND_API_KEY" };
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="background-color: #196ee6; padding: 18px 24px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px;">George – Potvrdenie o platbe</h2>
        </div>
        <p style="font-size: 16px; color: #334155;">Dobrý deň,</p>
        <p style="font-size: 15px; color: #475569;">Vaša platba bola úspešne zrealizovaná. Tu sú podrobnosti transakcie:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Suma:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #0f172a; font-size: 18px;">${data.amount.toFixed(2)} €</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Príjemca:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${data.recipientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">IBAN:</td>
            <td style="padding: 10px 0; font-family: monospace; color: #0f172a;">${data.iban}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b;">Dátum a čas:</td>
            <td style="padding: 10px 0; color: #0f172a;">${data.date}</td>
          </tr>
        </table>
        
        <p style="font-size: 13px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Tento e-mail bol vygenerovaný automaticky aplikáciou George.
        </p>
      </div>
    `;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "George Platby <onboarding@resend.dev>",
          to: [data.to],
          subject: `Potvrdenie platby: -${data.amount.toFixed(2)} € pre ${data.recipientName}`,
          html: htmlBody,
        }),
      });

      const responseData = await res.json();
      return { success: res.ok, data: responseData };
    } catch (err) {
      console.error("Chyba Resend API:", err);
      return { success: false, error: String(err) };
    }
  });
