import { describe, it, expect } from "vitest";
import { formatIban, cleanIban, detectBank, validateIban } from "@/lib/iban";

// Platné testovacie IBAN-y s korektnými kontrolnými číslicami (MOD-97)
const SLSP_IBAN = "SK19 0900 0000 0001 9187 2645";
const TATRA_IBAN = "SK08 1100 0000 0026 1170 0237";
const VUB_IBAN = "SK53 0200 0000 0042 1190 2341";

describe("formatIban", () => {
  it("pridá medzery po 4 znakoch a prevedie na veľké písmená", () => {
    expect(formatIban("sk1909000000000191872645")).toBe(SLSP_IBAN);
  });

  it("odstráni neplatné znaky", () => {
    expect(formatIban("SK07-0900 0000")).toBe("SK07 0900 0000");
  });

  it("prázdny vstup vráti prázdny reťazec", () => {
    expect(formatIban("")).toBe("");
  });
});

describe("cleanIban", () => {
  it("odstráni medzery a prevedie na veľké písmená", () => {
    expect(cleanIban("sk19 0900 0000 0001 9187 2645")).toBe("SK1909000000000191872645");
  });
});

describe("detectBank", () => {
  it("rozpozná Slovenskú sporiteľňu (0900)", () => {
    const bank = detectBank(SLSP_IBAN);
    expect(bank?.short).toBe("SLSP");
    expect(bank?.country).toBe("Slovensko");
  });

  it("rozpozná Tatra banku (1100)", () => {
    expect(detectBank(TATRA_IBAN)?.short).toBe("Tatra");
  });

  it("rozpozná VÚB (0200)", () => {
    expect(detectBank(VUB_IBAN)?.short).toBe("VÚB");
  });

  it("rozpozná českú banku (Komerční banka 0100)", () => {
    const bank = detectBank("CZ65 0100 0000 0000 0000 0000");
    expect(bank?.short).toBe("KB");
    expect(bank?.country).toBe("Česko");
  });

  it("neznámy SK kód vráti generickú slovenskú banku", () => {
    const bank = detectBank("SK00 9999 0000 0000 0000 0000");
    expect(bank?.country).toBe("Slovensko");
    expect(bank?.name).toContain("9999");
  });

  it("príliš krátky IBAN vráti null", () => {
    expect(detectBank("SK07")).toBeNull();
  });
});

describe("validateIban", () => {
  it("platný slovenský IBAN prejde MOD-97", () => {
    expect(validateIban(SLSP_IBAN).valid).toBe(true);
    expect(validateIban(TATRA_IBAN).valid).toBe(true);
    expect(validateIban(VUB_IBAN).valid).toBe(true);
  });

  it("neúplný IBAN nie je validný, ale ani nehlási chybu", () => {
    const result = validateIban("SK19 0900");
    expect(result.valid).toBe(false);
    expect(result.complete).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it("prázdny IBAN nie je validný ani kompletný", () => {
    const result = validateIban("");
    expect(result.valid).toBe(false);
    expect(result.complete).toBe(false);
  });

  it("IBAN bez kódu krajiny hlási chybu", () => {
    const result = validateIban("0709 0000 0000 1918 7264 5");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("kódom krajiny");
  });

  it("preklep v číslici zlyhá na kontrolných čísliciach", () => {
    // rovnaká dĺžka ako platný IBAN, ale zmenená jedna číslica
    const result = validateIban("SK20 0900 0000 0001 9187 2645");
    expect(result.valid).toBe(false);
    expect(result.complete).toBe(true);
    expect(result.error).toContain("kontrolné číslice");
  });

  it("príliš dlhý IBAN hlási chybu dĺžky", () => {
    const result = validateIban("SK19 0900 0000 0001 9187 2645 1");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("24 znakov");
  });
});
