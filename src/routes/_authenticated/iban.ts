// Bankové kódy slovenských a českých bánk
const SLOVAK_BANKS: Record<string, { name: string; short: string; color: string }> = {
  "0900": { name: "Slovenská sporiteľňa", short: "SLSP", color: "#196ee6" },
  "1100": { name: "Tatra banka", short: "Tatra", color: "#222222" },
  "1111": { name: "UniCredit Bank", short: "UniCredit", color: "#e30613" },
  "0200": { name: "VÚB banka", short: "VÚB", color: "#004b97" },
  "7500": { name: "ČSOB", short: "ČSOB", color: "#0094d8" },
  "8330": { name: "Fio banka", short: "Fio", color: "#235b9e" },
  "6500": { name: "365.bank / Poštová banka", short: "365.bank", color: "#10b981" },
  "8360": { name: "mBank", short: "mBank", color: "#e11d48" },
  "5600": { name: "Prima banka", short: "Prima", color: "#f97316" },
  "0720": { name: "Národná banka Slovenska", short: "NBS", color: "#475569" },
  "8130": { name: "Citibank Europe", short: "Citi", color: "#003b70" },
  "8430": { name: "Revolut Bank", short: "Revolut", color: "#0075eb" },
};

const CZECH_BANKS: Record<string, { name: string; short: string; color: string }> = {
  "0800": { name: "Česká spořitelna", short: "ČS", color: "#196ee6" },
  "0100": { name: "Komerční banka", short: "KB", color: "#dc2626" },
  "0300": { name: "ČSOB ČR", short: "ČSOB", color: "#0094d8" },
  "0600": { name: "MONETA Money Bank", short: "MONETA", color: "#2563eb" },
  "2010": { name: "Fio banka ČR", short: "Fio", color: "#235b9e" },
  "5500": { name: "Raiffeisenbank ČR", short: "RB", color: "#eab308" },
  "6210": { name: "mBank ČR", short: "mBank", color: "#e11d48" },
};

const IBAN_LENGTHS: Record<string, number> = {
  SK: 24,
  CZ: 24,
  AT: 20,
  DE: 22,
  PL: 28,
  HU: 28,
  FR: 27,
  GB: 22,
  IT: 27,
};

export interface BankInfo {
  name: string;
  short: string;
  color: string;
  country: string;
}

/**
 * Automaticky formátuje IBAN na veľké písmená s medzerami po 4 znakoch.
 */
export function formatIban(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const chunks = clean.match(/.{1,4}/g);
  return chunks ? chunks.join(" ") : clean;
}

/**
 * Očistí IBAN od medzier a iných znakov.
 */
export function cleanIban(iban: string): string {
  return iban.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Zistí banku podľa kódu banky v IBAN-e (pre SK a CZ).
 */
export function detectBank(iban: string): BankInfo | null {
  const clean = cleanIban(iban);
  if (clean.length < 8) return null;

  const country = clean.slice(0, 2);

  if (country === "SK") {
    // V slovenskom IBAN-e je kód banky na pozíciách 5-8 (index 4..8)
    const bankCode = clean.slice(4, 8);
    const bank = SLOVAK_BANKS[bankCode];
    if (bank) return { ...bank, country: "Slovensko" };
    return { name: `Slovenská banka (kód ${bankCode})`, short: bankCode, color: "#64748b", country: "Slovensko" };
  }

  if (country === "CZ") {
    // V českom IBAN-e je kód banky na pozíciách 5-8
    const bankCode = clean.slice(4, 8);
    const bank = CZECH_BANKS[bankCode];
    if (bank) return { ...bank, country: "Česko" };
    return { name: `Česká banka (kód ${bankCode})`, short: bankCode, color: "#64748b", country: "Česko" };
  }

  if (country === "AT") return { name: "Rakúska banka", short: "AT", color: "#dc2626", country: "Rakúsko" };
  if (country === "DE") return { name: "Nemecká banka", short: "DE", color: "#334155", country: "Nemecko" };
  if (country === "PL") return { name: "Poľská banka", short: "PL", color: "#dc2626", country: "Poľsko" };
  if (country === "HU") return { name: "Maďarská banka", short: "HU", color: "#16a34a", country: "Maďarsko" };

  return null;
}

/**
 * Matematická validácia IBAN-u pomocou algoritmu MOD-97.
 */
export function validateIban(iban: string): { valid: boolean; error?: string; complete: boolean } {
  const clean = cleanIban(iban);
  if (!clean) return { valid: false, complete: false };

  // Základná kontrola krajiny
  if (!/^[A-Z]{2}/.test(clean)) {
    return { valid: false, error: "IBAN musí začínať kódom krajiny (napr. SK).", complete: false };
  }

  const country = clean.slice(0, 2);
  const expectedLength = IBAN_LENGTHS[country];

  // Ešte nie je dopísaný
  if (expectedLength && clean.length < expectedLength) {
    return { valid: false, complete: false };
  }

  if (expectedLength && clean.length > expectedLength) {
    return {
      valid: false,
      error: `IBAN pre krajinu ${country} musí mať presne ${expectedLength} znakov (zadaných ${clean.length}).`,
      complete: true,
    };
  }

  // Prepočet MOD-97 (prvé 4 znaky na koniec, písmená na 10-35)
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const expanded = rearranged
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? String(code - 55) : char;
    })
    .join("");

  try {
    const remainder = BigInt(expanded) % 97n;
    if (remainder === 1n) {
      return { valid: true, complete: true };
    }
    return { valid: false, error: "Nesprávne kontrolné číslice IBAN-u (skontrolujte preklepy).", complete: true };
  } catch {
    return { valid: false, error: "Neplatný formát IBAN-u.", complete: true };
  }
}
