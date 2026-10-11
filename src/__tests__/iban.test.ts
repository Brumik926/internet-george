import { describe, it, expect } from "vitest";
import { formatIban, cleanIban, detectBank, validateIban } from "@/lib/iban";

describe("formatIban", () => {
  it("pridá medzery po 4 znakoch a prevedie na veľké písmená", () => {
    expect(formatIban("sk3112000000198742637541")).toBe("SK31 1200 0000 0198 7426 3754 1");
  });

  it("odstráni neplatné znaky", () => {
    expect(formatIban("SK31-1200 0000")).toBe("SK31 1200 0000");
  });

  it("prázdny vstup vráti prázdny reťazec", () => {
    expect(formatIban("")).toBe("");
  });
});

describe("cleanIban", () => {
  it("odstráni medzery a prevedie na veľké písmená", () => {
    expect(cleanIban("sk31 1200 0000 0198 7426 3754 1")).toBe("SK3112000000198742637541");
  });
});

describe("detectBank", () => {
  it("rozpozná Slovenskú sporiteľňu (0900)", () => {
    const bank = detectBank("SK31 0900 0000 0001 9182 6452 1");
    expect(bank?.short).toBe("SLSP");
    expect(bank?.country).toBe("Slovensko");
  });

  it("rozpozná Tatra banku (1100)", () => {
    expect(detectBank("SK0211000000002611700237")?.short).toBe("Tatra");
  });

  it("rozpozná VÚB (0200)", () => {
    expect(detectBank("SK3102000000004211902341")?.short).toBe("VÚB");
  });

  it("rozpozná českú banku (Komerční banka 0100)", () => {
    const bank = detectBank("CZ6501000000000000000000");
    expect(bank?.short).toBe("KB");
    expect(bank?.country).toBe("Česko");
  });

  it("neznámy SK kód vráti generickú slovenskú banku", () => {
    const bank = detectBank("SK3199990000000000000000");
    expect(bank?.country).toBe("Slovensko");
    expect(bank?.name).toContain("9999");
  });

  it("príliš krátky IBAN vráti null", () => {
    expect(detectBank("SK31")).toBeNull();
  });
});

describe("validateIban", () => {
  it("platný slovenský IBAN prejde MOD-97", () => {
    // SK31 1200 0000 0198 7426 3754 1 je známy platný testovací IBAN
    expect(validateIban("SK31 1200 0000 0198 7426 3754 1").valid).toBe(true);
  });

  it("neúplný IBAN nie je validný, ale ani nehlási chybu", () => {
    const result = validateIban("SK31 1200");
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
    const result = validateIban("3112 0000 0001 9874 2637 541");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("kódom krajiny");
  });

  it("preklep v číslici zlyhá na kontrolných čísliciach", () => {
    const result = validateIban("SK32 1200 0000 0198 7426 3754 1");
    expect(result.valid).toBe(false);
    expect(result.complete).toBe(true);
    expect(result.error).toContain("kontrolné číslice");
  });

  it("príliš dlhý IBAN hlási chybu dĺžky", () => {
    const result = validateIban("SK31 1200 0000 0198 7426 3754 112");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("24 znakov");
  });
});
