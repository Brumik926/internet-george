export interface ParsedPaymentData {
  iban?: string | undefined;
  amount?: string | undefined;
  recipientName?: string | undefined;
  vs?: string | undefined;
  note?: string | undefined;
}

import { decode as decodeBySquare } from "bysquare/pay";

function parseBySquare(text: string): ParsedPaymentData | null {
  try {
    const model = decodeBySquare(text);
    const p = model.payments?.[0];
    if (!p) return null;
    return {
      iban: p.bankAccounts?.[0]?.iban?.replace(/\s+/g, "").toUpperCase() || undefined,
      amount: p.amount != null ? String(p.amount) : undefined,
      recipientName: p.beneficiary?.name || undefined,
      vs: p.variableSymbol || undefined,
      note: p.paymentNote || undefined,
    };
  } catch {
    return null;
  }
}

export function parsePaymentQr(raw: string): ParsedPaymentData | null {
  const text = raw.trim();

  // 0. PAY by square (slovenský štandard)
  if (isPayBySquare(text)) {
    const r = parseBySquare(text);
    if (r) return r;
  }


  // 1. Payme URL formát: https://payme.sk?... alebo payme://...
  if (text.includes("payme.sk") || text.startsWith("payme:")) {
    try {
      const url = new URL(text.replace("payme://", "https://payme.sk/"));
      const p = url.searchParams;
      return {
        iban: p.get("iban") || p.get("IBAN") || undefined,
        amount: p.get("am") || p.get("amount") || undefined,
        recipientName: p.get("cn") || p.get("recipient") || undefined,
        vs: p.get("vs") || undefined,
        note: p.get("msg") || p.get("note") || undefined,
      };
    } catch {
      // fallback ďalej
    }
  }

  // 2. Európsky SEPA / EPC QR kód (začína BCD)
  if (text.startsWith("BCD")) {
    const lines = text.split(/\r?\n/);
    if (lines.length >= 8) {
      const recipientName = lines[5]?.trim();
      const iban = lines[6]?.replace(/\s+/g, "").toUpperCase()?.trim();
      const amountRaw = lines[7]?.replace(/^EUR/i, "").replace(/[^\d.,]/g, "").replace(",", ".");
      const vs = lines[9]?.match(/\d{1,10}/)?.[0];
      const note = (lines[10] || lines[11])?.trim();

      return {
        recipientName: recipientName || undefined,
        iban: iban || undefined,
        amount: amountRaw || undefined,
        vs: vs || undefined,
        note: note || undefined,
      };
    }
  }

  // 3. Fallback: detekcia IBAN a sumy v obyčajnom texte (alebo JSON)
  const ibanMatch = text.match(/SK\d{2}\s?(?:\d{4}\s?){4}\d{4}/i);
  const amountMatch = text.match(/(\d+[.,]\d{2})\s?€?/);
  const vsMatch = text.match(/(?:VS|variabilny|var\.?\s*symbol)[:\s]*(\d{1,10})/i);

  if (ibanMatch) {
    return {
      iban: (ibanMatch[0] ?? "").replace(/\s+/g, "").toUpperCase(),
      amount: amountMatch?.[1]?.replace(",", ".") ?? undefined,
      vs: vsMatch?.[1] ?? undefined,
    };
  }

  return null;
}

/** PAY by square: base32hex reťazec (0-9, A-V), typicky začína "0004". */
export function isPayBySquare(raw: string): boolean {
  const t = raw.trim();
  return t.length > 20 && /^[0-9A-V]+$/.test(t);
}
