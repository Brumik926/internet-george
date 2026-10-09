import { describe, it, expect } from "vitest";
import { parsePaymentQr, isPayBySquare } from "@/lib/qr-parser";

describe("parsePaymentQr", () => {
  it("reads SEPA EPC QR into payment fields", () => {
    const raw = "BCD\n002\n1\nSCT\n\nJan Novak\nSK3112000000198742637541\nEUR12.50\n\n1234567890\nNajom";
    const p = parsePaymentQr(raw)!;
    expect(p.iban).toBe("SK3112000000198742637541");
    expect(p.amount).toBe("12.50");
    expect(p.recipientName).toBe("Jan Novak");
  });
  it("detects PAY by square strings", () => {
    expect(isPayBySquare("0004G0006M3QCBB4RGVUFP5MBJ3AAV4UPPBKVNPSLVNCVGGTS")).toBe(true);
  });
});

import { encode } from "bysquare/pay";
describe("PAY by square", () => {
  it("decodes IBAN, amount, VS, recipient and note", () => {
    const qr = encode({
      payments: [{
        type: 1, currencyCode: "EUR", amount: 25.5, variableSymbol: "123456",
        paymentNote: "Faktura", beneficiary: { name: "Jan Novak" },
        bankAccounts: [{ iban: "SK3112000000198742637541" }],
      }],
    } as never);
    const p = parsePaymentQr(qr)!;
    expect(p.iban).toBe("SK3112000000198742637541");
    expect(p.amount).toBe("25.5");
    expect(p.vs).toBe("123456");
    expect(p.recipientName).toBe("Jan Novak");
    expect(p.note).toBe("Faktura");
  });
});
