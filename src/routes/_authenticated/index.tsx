import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  CreditCard,
  BarChart2,
  MoreVertical,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { AppShell } from "@/components/bank/AppShell";
import { InitialsAvatar } from "@/components/bank/InitialsAvatar";
import { balance, monthTotals, MONTHS, inMonth, useBank } from "@/lib/bank-store";

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
  Potraviny: "#f97316", // oranžová
  Bývanie: "#8b5cf6",  // fialová
  Doprava: "#0ea5e9",  // svetlomodrá
  Zábava: "#ec4899",   // ružová
  Zdravie: "#10b981",  // smaragdová
  Poplatky: "#64748b", // bridlicová
  Ostatné: "#94a3b8",  // neutrálna sivá
};

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

  // Výpočet rozdelenia výdavkov podľa kategórií za tento mesiac
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
    .slice(0, 3); // TOP 3 kategórie do legendy

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

          {/* Autentické uvítanie a nadpis */}
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

                  {/* Legenda TOP kategórií */}
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

          {/* 2. Karta: Investície */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#161a23] p-5 shadow-sm border border-slate-100 dark:border-zinc-800/40 before:absolute before:inset-x-0 before:top-0 before:h-[3.5px] before:bg-gradient-to-r before:from-[#196ee6] before:to-[#4f46e5] dark:before:from-[#3b82f6] dark:before:to-[#6366f1]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">Investície</h2>
                <div className="mt-1 flex items-baseline text-slate-900 dark:text-white">
                  <span className="text-[32px] font-bold leading-none tracking-tight">0,</span>
                  <span className="text-[18px] font-bold leading-none ml-0.5">00&nbsp;€</span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-700/60 shrink-0 bg-slate-100 dark:bg-zinc-800">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80"
                  alt="Investície"
                  className="w-full h-full object-cover"
                />
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

          {/* 3. Karta: Moneyback */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#161a23] p-5 shadow-sm border border-slate-100 dark:border-zinc-800/40 before:absolute before:inset-x-0 before:top-0 before:h-[3.5px] before:bg-gradient-to-r before:from-[#9333ea] before:to-[#ec4899]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">Moneyback</h2>
                <div className="mt-1.5 inline-flex items-center rounded-full bg-[#e0f2fe] dark:bg-[#142639] px-2.5 py-0.5 text-[12px] font-medium text-[#0284c7] dark:text-[#38bdf8]">
                  5 nových ponúk
                </div>
              </div>

            <div className="w-12 h-12 rounded-full bg-[#fdf2f8] dark:bg-[#2e1627] text-[#db2777] dark:text-[#f43f5e] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6 stroke-[2]" />
              </div>
            </div>

            <p className="mt-3 text-[14px] leading-snug text-slate-600 dark:text-zinc-300">
              Objavte ponuky od najlepších značiek a získajte späť časť svojich peňazí.
            </p>

            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-[#eef4ff] hover:bg-[#e0ecff] dark:bg-[#1b273d] dark:hover:bg-[#233454] px-4 py-2 text-[14px] font-medium text-[#196ee6] dark:text-[#60a5fa] transition"
              >
                Prezrite si 5 nových ponúk
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
