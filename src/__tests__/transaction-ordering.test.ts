import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { formatDate, groupByMonth, inMonth, monthTotals, type BankState, type Txn } from "@/lib/bank-store";

const now = new Date();
const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15, 12, 0, 0);

const oldTxn: Txn = {
  id: "old",
  type: "out",
  counterparty: "Kino Lumière",
  amount: 18,
  date: prevMonth.toISOString(),
  category: "Zábava",
};

/** Platba odoslaná „teraz" — presne takto ju ukladá Nová platba. */
const freshTxn: Txn = {
  id: "fresh",
  type: "out",
  counterparty: "Nový príjemca",
  amount: 25,
  date: new Date().toISOString(),
  category: "Prevod",
};

describe("poradie transakcií podľa dátumu", () => {
  it("nová platba z dnešného dňa je v prvej (najnovšej) skupine", () => {
    const groups = groupByMonth([oldTxn, freshTxn]);
    expect(groups[0]![1][0]!.counterparty).toBe("Nový príjemca");
    expect(groups[groups.length - 1]![1][0]!.counterparty).toBe("Kino Lumière");
  });

  it("nová platba sa počíta do aktuálneho mesiaca, stará nie", () => {
    expect(inMonth(freshTxn)).toBe(true);
    expect(inMonth(oldTxn)).toBe(false);
    const state = { transactions: [freshTxn, oldTxn] } as unknown as BankState;
    expect(monthTotals(state).expense).toBe(25);
  });

  it("formatDate zobrazí skutočný deň platby (miestny čas)", () => {
    expect(formatDate(freshTxn.date)).toBe(
      `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`,
    );
  });
});
