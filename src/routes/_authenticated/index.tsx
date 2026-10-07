import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  CreditCard,
  BarChart2,
  MoreVertical,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  PiggyBank,
  Check,
  Tag,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/bank/AppShell";
import { InitialsAvatar } from "@/components/bank/InitialsAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { balance, monthTotals, MONTHS, inMonth, formatEur, useBank } from "@/lib/bank-store";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Prehľad | George" },
      { name: "description", content: "Prehľad George SLSP" },
      { property: "og:title", content: "Prehľad | George" },
      { property: "og:description", content: "Zostatok účtu, príjmy a výdavky v George." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GeorgePrehlad,
});

// George farby pre jednotlivé kategórie výdavkov
const CATEGORY_COLORS: Record<string, string> = {
  Potraviny: "#f97316",
  Bývanie: "#8b5cf6",
  Doprava: "#0ea5e9",
  Zábava: "#ec4899",
  Zdravie: "#10b981",
  Poplatky: "#64748b",
  Ostatné: "#94a3b8",
};

// Zoznam dostupných Moneyback ponúk
const MONEYBACK_OFFERS = [
  { id: "lidl", merchant: "Lidl", discount: "3 %", desc: "Platí pri nákupe nad 25 €", color: "#0050aa" },
  { id: "omv", merchant: "OMV", discount: "4 %", desc: "Pohonné hmoty MaxxMotion", color: "#007a3d" },
  { id: "martinus", merchant: "Martinus", discount: "5 %", desc: "Knihy, e-knihy a spoločenské hry", color: "#e11d48" },
  { id: "alza", merchant: "Alza.sk", discount: "2 %", desc: "Elektronika a príslušenstvo", color: "#16a34a" },
  { id: "drmax", merchant: "Lekáreň Dr.Max", discount: "5 %", desc: "Voľnopredajný sortiment a vitamíny", color: "#0284c7" },
];

function getGreeting(ownerName: string) {
  const hour = new Date().getHours();
  const firstName = ownerName.trim().split(" ")[0] || "klient";
  if (hour < 10) return `Dobré ráno, ${firstName}`;
  if (hour < 18) return `Dobrý deň, ${firstName}`;
  return `Dobrý večer, ${firstName}`;
}

function GeorgePrehlad() {
  const s = useBank();
  const navigate = useNavigate();

  // Stav aktivovaných ponúk v Moneyback
  const [moneybackOpen, setMoneybackOpen] = useState(false);
  const [activatedOffers, setActivatedOffers] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["lidl", "omv"];
    try {
      const saved = localStorage.getItem("george_moneyback_activated");
      return saved ? JSON.parse(saved) : ["lidl", "omv"];
    } catch {
      return ["lidl", "omv"];
    }
  });

  const toggleOffer = (id: string) => {
    setActivatedOffers((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem("george_moneyback_activated", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Reálne dáta z databázy
  const currentBalance = balance(s);
  const { income, expense } = monthTotals(s);
  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = (MONTHS[currentMonthIdx] ?? "október").toLowerCase();

  const isNegative = currentBalance < 0;
  const absVal = Math.abs(currentBalance);
  const wholeEuros = Math.floor(absVal).toLocaleString("sk-SK");
  const cents = Math.round((absVal - Math.floor(absVal)) * 100).toString().padStart(2, "0");
  const formattedOwnResources = `${isNegative ? "-" : ""}${wholeEuros},${cents} € vlastné zdroje`;

  // Sporenie - celková suma a ciele
  const totalSaved = s.goals.reduce((a, g) => a + g.saved, 0);
  const primaryGoal = s.goals[0];
  const primaryGoalPct = primaryGoal && primaryGoal.target > 0 
    ? Math.min(100, Math.round((primaryGoal.saved / primaryGoal.target) * 100))
    : 0;

  // Výdavky podľa kategórií
  const currentMonthExpenses = s.transactions.filter(
    (t) => t.type === "out" && inMonth(t)
  );
  const currentMonthIncomeCount = s.transactions.filter(
    (t) => t.type === "in" && inMonth(t)
  ).length;

  const categoryTotals = currentMonthExpenses.reduce<Record<string, number>>((acc, t) => {
    const cat = t.category || "Ostatné";
    acc[cat] = (acc[cat] || 0) + t.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <AppShell>
      <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#0e1117] text-slate-900 dark:text-white pb-28 font-sans transition-colors duration-200">
        
        {/* George modrá hlavička so zaobleným spodným okrajom */}
        <div className="bg-[#196ee6] dark:bg-transparent px-4 pt-3 pb-7 text-white rounded-b-[28px] shadow-sm transition-colors">
          <div className="flex items-center justify-end gap-3.5 pt-1 pb-1">
            <Link to="/platby" className="p-1 text-white hover:text-white/80 transition" aria-label="Hľadať">
              <Search className="w-6 h-6 stroke-[2.2]" />
            </Link>
            <Link to="/karty" className="p-1 text-white hover:text-white/80 transition" aria-label="Karty">
              <CreditCard className="w-6 h-6 stroke-[2.2]" />
            </Link>
            <Link
              to="/nastavenia"
              className="relative flex rounded-full shadow ring-2 ring-white/30 dark:ring-zinc-800"
              aria-label="Profil"
            >
              <InitialsAvatar name={s.owner} className="w-8 h-8 text-[12px]" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ff4d6d] ring-2 ring-[#196ee6] dark:ring-[#0e1117]" />
            </Link>
          </div>

          {/* Uvítanie a nadpis */}
          <div className="mt-1 mb-4">
            <p className="text-[13px] font-medium text-white/85 dark:text-zinc-400">
              {getGreeting(s.owner)}
            </p>
            <h1 className="text-[32px] font-extrabold tracking-tight text-white">
              Prehľad
            </h1>
          </div>

          {/* Dve karty: Výdavky s mini grafom a Príjmy */}
          <div className="grid grid-cols-2 gap-3">
            {/* Karta Výdavky */}
            <Link
              to="/rozpocet"
              className="group rounded-2xl bg-white dark:bg-[#161a23] p-4 text-slate-900 dark:text-white shadow-sm border border-slate-100/80 dark:border-zinc-800/40 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between text-[12px] font-medium text-slate-700 dark:text-zinc-300">
                <span className="truncate">Výdavky · {currentMonthName}</span>
                <span className="flex w-6 h-6 items-center justify-center rounded-full bg-[#edf4ff] dark:bg-[#182a3e] text-[#196ee6] dark:text-[#38bdf8] shrink-0">
                  <BarChart2 className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="mt-1.5 flex items-baseline">
                <span className="text-[24px] font-bold leading-none">
                  {Math.floor(expense).toLocaleString("sk-SK")},
                </span>
                <span className="text-[15px] font-bold leading-none ml-0.5">
                  {Math.round((expense - Math.floor(expense)) * 100).toString().padStart(2, "0")}&nbsp;€
                </span>
              </div>

              {/* Segmentový mini graf kategórií */}
              {expense > 0 && (
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex gap-0.5">
                    {Object.entries(categoryTotals).map(([cat, amount]) => {
                      const pct = Math.max(4, (amount / expense) * 100);
                      const bg = CATEGORY_COLORS[cat] || "#94a3b8";
                      return (
                        <div
                          key={cat}
                          style={{ width: `${pct}%`, backgroundColor: bg }}
                          className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                          title={`${cat}: ${amount.toFixed(2)} €`}
                        />
                      );
                    })}
                  </div>

                  <div className="mt-2 space-y-1">
                    {sortedCategories.map(([cat, amount]) => {
                      const bg = CATEGORY_COLORS[cat] || "#94a3b8";
                      const pct = Math.round((amount / expense) * 100);
                      return (
                        <div key={cat} className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1 truncate">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: bg }} />
                            <span className="truncate">{cat}</span>
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-300 ml-1">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#196ee6] dark:text-[#60a5fa] font-medium pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                <span>Detail rozpočtu</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Karta Príjmy */}
            <div className="rounded-2xl bg-white dark:bg-[#161a23] p-4 text-slate-900 dark:text-white shadow-sm border border-slate-100/80 dark:border-zinc-800/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[12px] font-medium text-slate-700 dark:text-zinc-300">
                  <span className="truncate">Príjmy · {currentMonthName}</span>
                  <span className="flex w-6 h-6 items-center justify-center rounded-full bg-[#ecfdf5] dark:bg-[#064e3b]/30 text-[#10b981] shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="mt-1.5 flex items-baseline">
                  <span className="text-[24px] font-bold leading-none">
                    {Math.floor(income).toLocaleString("sk-SK")},
                  </span>
                  <span className="text-[15px] font-bold leading-none ml-0.5">
                    {Math.round((income - Math.floor(income)) * 100).toString().padStart(2, "0")}&nbsp;€
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                  <TrendingUp className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>{currentMonthIncomeCount > 0 ? `${currentMonthIncomeCount} prijaté platby` : "Žiadne nové príjmy"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sekcia Vaše produkty */}
        <div className="px-4 mt-5 space-y-3">
          <p className="text-[13px] font-medium text-slate-500 dark:text-zinc-400 px-1">
            Vaše produkty
          </p>

          {/* 1. Karta: Účet — klikateľná, s reálnym zostatkom */}
          <Link
            to="/platby"
            className="group relative block overflow-hidden rounded-2xl bg-white dark:bg-[#161a23] p-5 shadow-sm border border-slate-100 dark:border-zinc-800/40 before:absolute before:inset-x-0 before:top-0 before:h-[3.5px] before:bg-gradient-to-r before:from-[#d946ef] before:to-[#f43f5e] active:scale-[0.99] transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white group-hover:text-[#196ee6] dark:group-hover:text-[#38bdf8] transition-colors">
                  Účet
                </h2>
                
                <div className={`mt-1 flex items-baseline ${isNegative ? "text-[#e11d48] dark:text-[#ff5a70]" : "text-slate-900 dark:text-white"}`}>
                  <span className="text-[32px] font-bold leading-none tracking-tight">
                    {isNegative ? "-" : ""}{wholeEuros},
                  </span>
                  <span className="text-[18px] font-bold leading-none ml-0.5">
                    {cents}&nbsp;€
                  </span>
                </div>

                <p className="mt-1.5 text-[13px] text-slate-500 dark:text-zinc-400">
                  {formattedOwnResources}
                </p>
              </div>

              <InitialsAvatar name={s.owner} />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate({ to: "/nova-platba" });
                }}
                className="inline-flex items-center justify-center rounded-full bg-[#eef4ff] hover:bg-[#e0ecff] dark:bg-[#1b273d] dark:hover:bg-[#233454] px-4 py-2 text-[14px] font-medium text-[#196ee6] dark:text-[#60a5fa] transition"
              >
                Nová platba
              </button>
              <span className="p-1 text-[#196ee6] dark:text-[#38bdf8] opacity-80 group-hover:opacity-100 transition">
                <MoreVertical className="w-5 h-5" />
              </span>
            </div>
          </Link>

          {/* 2. Karta: Sporenie a ciele */}
          <Link
            to="/sporenie"
            className="group relative block overflow-hidden rounded-2xl bg-white dark:bg-[#161a23] p-5 shadow-sm border border-slate-100 dark:border-zinc-800/40 before:absolute before:inset-x-0 before:top-0 before:h-[3.5px] before:bg-gradient-to-r before:from-[#06b6d4] before:to-[#3b82f6] active:scale-[0.99] transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white group-hover:text-[#06b6d4] transition-colors">
                  Sporenie a ciele
                </h2>
                <div className="mt-1 flex items-baseline text-slate-900 dark:text-white">
                  <span className="text-[32px] font-bold leading-none tracking-tight">
                    {Math.floor(totalSaved).toLocaleString("sk-SK")},
                  </span>
                  <span className="text-[18px] font-bold leading-none ml-0.5">
                    {Math.round((totalSaved - Math.floor(totalSaved)) * 100).toString().padStart(2, "0")}&nbsp;€
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
                  {primaryGoal ? `${primaryGoal.name} · ${primaryGoalPct}% cieľa` : "Sporenie na rezervu a sny"}
                </p>
              </div>

              <div className="w-12 h-12 rounded-full bg-[#ecfeff] dark:bg-[#083344] text-[#0891b2] dark:text-[#22d3ee] flex items-center justify-center shrink-0">
                <PiggyBank className="w-6 h-6 stroke-[2]" />
              </div>
            </div>

            {/* Progress bar hlavného cieľa */}
            {primaryGoal && (
              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                  <span>{formatEur(primaryGoal.saved)}</span>
                  <span>Cieľ {formatEur(primaryGoal.target)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] transition-all duration-500"
                    style={{ width: `${primaryGoalPct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4">
              <span className="inline-flex items-center justify-center rounded-full bg-[#f0fdfa] dark:bg-[#132f2b] px-4 py-2 text-[14px] font-medium text-[#0d9488] dark:text-[#2dd4bf] group-hover:bg-[#ccfbf1] transition">
                Spravovať sporenie
              </span>
            </div>
          </Link>

          {/* 3. Karta: Investície (SVG graf namiesto externej fotografie) */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#161a23] p-5 shadow-sm border border-slate-100 dark:border-zinc-800/40 before:absolute before:inset-x-0 before:top-0 before:h-[3.5px] before:bg-gradient-to-r before:from-[#196ee6] before:to-[#4f46e5]">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">Investície</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] dark:bg-[#064e3b]/30 px-2 py-0.5 text-[11px] font-medium text-[#10b981]">
                    <TrendingUp className="w-3 h-3" /> +4,2 %
                  </span>
                </div>
                <div className="mt-1 flex items-baseline text-slate-900 dark:text-white">
                  <span className="text-[32px] font-bold leading-none tracking-tight">0,</span>
                  <span className="text-[18px] font-bold leading-none ml-0.5">00&nbsp;€</span>
                </div>
                <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
                  ERSTE Asset Management · Fondy
                </p>
              </div>

              {/* Autentická George ikona fondu */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#196ee6]/10 to-[#4f46e5]/20 dark:from-[#1e293b] dark:to-[#1e1b4b] text-[#196ee6] dark:text-[#60a5fa] flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 20 9 14 15 18 25 7" />
                  <polyline points="19 7 25 7 25 13" />
                </svg>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-[#eef4ff] hover:bg-[#e0ecff] dark:bg-[#1b273d] dark:hover:bg-[#233454] px-4 py-2 text-[14px] font-medium text-[#196ee6] dark:text-[#60a5fa] transition"
              >
                Vyhľadať a kúpiť
              </button>
            </div>
          </div>

          {/* 4. Karta: Moneyback (Interaktívna so zoznamom ponúk a aktiváciou) */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#161a23] p-5 shadow-sm border border-slate-100 dark:border-zinc-800/40 before:absolute before:inset-x-0 before:top-0 before:h-[3.5px] before:bg-gradient-to-r before:from-[#9333ea] before:to-[#ec4899]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">Moneyback</h2>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#fdf2f8] dark:bg-[#2e1627] px-2.5 py-0.5 text-[12px] font-medium text-[#db2777] dark:text-[#f43f5e]">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {activatedOffers.length} {activatedOffers.length === 1 ? "aktívna" : "aktívne"} · {MONEYBACK_OFFERS.length - activatedOffers.length} nové
                  </span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-full bg-[#fdf2f8] dark:bg-[#2e1627] text-[#db2777] dark:text-[#f43f5e] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6 stroke-[2]" />
              </div>
            </div>

            <p className="mt-3 text-[14px] leading-snug text-slate-600 dark:text-zinc-300">
              Aktivujte si ponuky od partnerských značiek a získajte časť peňazí späť na účet.
            </p>

            {/* Rýchly náhľad dvoch zliav */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {MONEYBACK_OFFERS.slice(0, 3).map((o) => {
                const isActivated = activatedOffers.includes(o.id);
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60 px-2.5 py-1 text-[12px] border border-slate-100 dark:border-zinc-800 shrink-0"
                  >
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{o.merchant}</span>
                    <span className="font-bold text-[#db2777]">{o.discount}</span>
                    {isActivated && <Check className="w-3 h-3 text-[#10b981]" />}
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setMoneybackOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-[#fdf2f8] hover:bg-[#fce7f3] dark:bg-[#2e1627] dark:hover:bg-[#3d1c34] px-4 py-2 text-[14px] font-medium text-[#db2777] dark:text-[#f43f5e] transition"
              >
                Prezrieť všetky ponuky ({MONEYBACK_OFFERS.length})
              </button>
            </div>
          </div>
        </div>

        {/* Dialógové okno Moneyback ponúk */}
        <Dialog open={moneybackOpen} onOpenChange={setMoneybackOpen}>
          <DialogContent className="max-w-[400px] rounded-2xl bg-white dark:bg-[#161a23] p-5">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-full bg-[#fdf2f8] dark:bg-[#2e1627] text-[#db2777]">
                  <ShoppingBag className="w-5 h-5" />
                </span>
                <DialogTitle className="text-[20px] font-bold text-slate-900 dark:text-white">
                  Moneyback ponuky
                </DialogTitle>
              </div>
              <DialogDescription className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">
                Aktivujte si zľavy pred platbou kartou George. Peniaze vám prídu priamo na bežný účet.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-3 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {MONEYBACK_OFFERS.map((offer) => {
                const isActivated = activatedOffers.includes(offer.id);
                return (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 hover:bg-slate-100/70 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[15px] text-slate-900 dark:text-white">
                          {offer.merchant}
                        </span>
                        <span className="text-[13px] font-bold text-[#db2777]">
                          {offer.discount}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {offer.desc}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={isActivated ? "outline" : "default"}
                      onClick={() => toggleOffer(offer.id)}
                      className={
                        isActivated
                          ? "rounded-full text-[12px] border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          : "rounded-full text-[12px] bg-[#196ee6] hover:bg-[#155cc0] text-white"
                      }
                    >
                      {isActivated ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Aktivované
                        </span>
                      ) : (
                        "Aktivovať"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setMoneybackOpen(false)}
                className="rounded-full px-5 text-[13px]"
              >
                Hotovo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
