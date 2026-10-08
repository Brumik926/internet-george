import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  ArrowLeft, 
  Search, 
  BarChart2, 
  Plus, 
  FileEdit,
  CreditCard,
  QrCode,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  X,
  ShoppingCart,
  Home,
  Fuel,
  Film,
  HeartPulse,
  PiggyBank,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/bank/AppShell";
import { InitialsAvatar } from "@/components/bank/InitialsAvatar";
import { balance, formatDate, formatEur, MONTHS, useBank, type Txn } from "@/lib/bank-store";

export const Route = createFileRoute("/_authenticated/platby")({
  head: () => ({
    meta: [
      { title: "Účet a transakcie | George" },
      { name: "description", content: "História transakcií a správa účtu George" },
      { property: "og:title", content: "Účet a transakcie | George" },
      { property: "og:description", content: "História transakcií, vyhľadávanie a filtre účtu George." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UcetDetail,
});

// Logo Slovenskej sporiteľne pre bankové poplatky
function SlspLogoIcon() {
  return (
    <div className="w-10 h-10 rounded-full bg-[#196ee6] flex items-center justify-center text-white shrink-0 shadow-sm">
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <circle cx="12" cy="6" r="2.2" />
        <rect x="7" y="10" width="10" height="2.5" rx="1.2" />
        <rect x="7" y="14" width="10" height="2.5" rx="1.2" />
        <rect x="7" y="18" width="10" height="2.5" rx="1.2" />
      </svg>
    </div>
  );
}

// George farebná ikona pre každú kategóriu
function CategoryIcon({ category, type, counterparty }: { category?: string; type: "in" | "out"; counterparty: string }) {
  const isIn = type === "in";
  const name = (counterparty || "").toLowerCase();
  const cat = category || "";

  if (cat === "Poplatky" || name.includes("poplatok") || name.includes("vedenie")) {
    return <SlspLogoIcon />;
  }

  if (isIn) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#e8fbf0] dark:bg-[#064e3b]/40 text-[#16a34a] dark:text-[#4ade80] flex items-center justify-center shrink-0 shadow-sm">
        <ArrowDownLeft className="w-5 h-5 stroke-[2.4]" />
      </div>
    );
  }

  if (cat === "Potraviny" || name.includes("billa") || name.includes("tesco") || name.includes("lidl") || name.includes("kaufland")) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#fff7ed] dark:bg-[#431407]/40 text-[#ea580c] dark:text-[#fb923c] flex items-center justify-center shrink-0 shadow-sm">
        <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  if (cat === "Doprava" || name.includes("slovnaft") || name.includes("omv") || name.includes("shell") || name.includes("orlen")) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#f0f9ff] dark:bg-[#082f49]/40 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center shrink-0 shadow-sm">
        <Fuel className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  if (cat === "Bývanie" || name.includes("nájom") || name.includes("spp") || name.includes("elektr")) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#faf5ff] dark:bg-[#3b0764]/40 text-[#9333ea] dark:text-[#c084fc] flex items-center justify-center shrink-0 shadow-sm">
        <Home className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  if (cat === "Zábava" || name.includes("netflix") || name.includes("spotify") || name.includes("kino")) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#fdf2f8] dark:bg-[#500724]/40 text-[#db2777] dark:text-[#f472b6] flex items-center justify-center shrink-0 shadow-sm">
        <Film className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  if (cat === "Zdravie" || name.includes("lekár") || name.includes("dr.max") || name.includes("benu")) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#059669] dark:text-[#34d399] flex items-center justify-center shrink-0 shadow-sm">
        <HeartPulse className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  if (cat === "Sporenie" || name.includes("rezerv") || name.includes("sporen")) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#ecfeff] dark:bg-[#083344]/40 text-[#0891b2] dark:text-[#22d3ee] flex items-center justify-center shrink-0 shadow-sm">
        <PiggyBank className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  // Východiskový odoslaný prevod
  return (
    <div className="w-10 h-10 rounded-full bg-[#eff6ff] dark:bg-[#172554]/40 text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center shrink-0 shadow-sm">
      <ArrowUpRight className="w-5 h-5 stroke-[2.4]" />
    </div>
  );
}

function UcetDetail() {
  const s = useBank();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"transakcie" | "funkcie" | "karty" | "info">("transakcie");

  // Reálny zostatok z databázy
  const currentBalance = balance(s);
  const isNegative = currentBalance < 0;
  const absVal = Math.abs(currentBalance);
  const wholeEuros = Math.floor(absVal).toLocaleString("sk-SK");
  const cents = Math.round((absVal - Math.floor(absVal)) * 100).toString().padStart(2, "0");
  const formattedOwnResources = `${isNegative ? "-" : ""}${wholeEuros},${cents} € vlastné zdroje`;

  // Filtre
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<"all" | "in" | "out">("all");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount">("newest");

  const categories = useMemo(
    () => Array.from(new Set(s.transactions.map((t) => t.category))).sort(),
    [s.transactions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qNum = Number(q.replace(",", "."));
    return s.transactions.filter((t) => {
      if (direction !== "all" && t.type !== direction) return false;
      if (category !== "all" && t.category !== category) return false;
      if (!q) return true;
      const hay = [t.counterparty, t.note, t.vs, t.iban, t.category].filter(Boolean).join(" ").toLowerCase();
      if (hay.includes(q)) return true;
      return Number.isFinite(qNum) && qNum > 0 && t.amount.toFixed(2).includes(qNum.toString());
    });
  }, [s.transactions, query, direction, category]);

  const filtersActive = query.trim() !== "" || direction !== "all" || category !== "all" || sortBy !== "newest";
  const filteredSum = filtered.reduce((sum, t) => sum + (t.type === "in" ? t.amount : -t.amount), 0);
  const resetFilters = () => { setQuery(""); setDirection("all"); setCategory("all"); setSortBy("newest"); };

  const groupedTransactions = useMemo(() => {
    if (sortBy === "amount") {
      return [{ label: "Podľa sumy", items: [...filtered].sort((a, b) => b.amount - a.amount) }];
    }
    const groups: { [key: string]: { label: string; items: Txn[] } } = {};
    const dir = sortBy === "oldest" ? 1 : -1;
    const sorted = [...filtered].sort(
      (a, b) => dir * (new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    sorted.forEach((txn) => {
      const d = new Date(txn.date);
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const key = `${year}-${String(monthIdx).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = { label: `${MONTHS[monthIdx] || "Neznámy"} ${year}`, items: [] };
      groups[key].items.push(txn);
    });
    return Object.keys(groups)
      .sort((a, b) => (sortBy === "oldest" ? a.localeCompare(b) : b.localeCompare(a)))
      .map((k) => groups[k]!);
  }, [filtered, sortBy]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
      active
        ? "border-[#196ee6] bg-[#196ee6] text-white dark:border-[#38bdf8] dark:bg-[#38bdf8] dark:text-[#0e1117]"
        : "border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-[#161a23] dark:text-zinc-300"
    }`;

  const copyIban = () => {
    if (s.iban) {
      navigator.clipboard.writeText(s.iban);
      toast.success("IBAN bol skopírovaný do schránky");
    }
  };

  return (
    <AppShell hideBottomNav={true}>
      <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#0e1117] text-slate-900 dark:text-white pb-32 font-sans transition-colors duration-200">
        
        {/* Magenta hlavička George pre Detail účtu */}
        <div className="bg-[#b3145a] dark:bg-transparent px-4 pt-4 pb-6 text-white transition-colors">
          <div className="flex items-center justify-between">
            <Link to="/" className="p-1 -ml-1 text-white hover:text-white/80 transition" aria-label="Späť na Prehľad">
              <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
            </Link>
            
            <div className="flex items-center gap-3">
              <Link to="/nastavenia" aria-label="Profil">
                <InitialsAvatar name={s.owner} className="w-8 h-8 text-[12px] bg-white/20 text-white border-white/30" />
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-white/85">
                SPACE účet
              </p>
              
              <div className="mt-1 flex items-baseline">
                <span className="text-[36px] font-extrabold leading-none tracking-tight">
                  {isNegative ? "-" : ""}{wholeEuros},
                </span>
                <span className="text-[20px] font-bold leading-none ml-0.5">
                  {cents}&nbsp;€
                </span>
              </div>

              <p className="mt-1.5 text-[12px] text-white/75 font-mono">
                {s.iban || "SK83 0900 0000 0052 0892 1207"}
              </p>
            </div>
          </div>

          {/* Záložky detailu účtu */}
          <div className="mt-6 flex border-b border-white/20 text-[14px] font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("transakcie")}
              className={`pb-2.5 px-3 transition-colors relative ${
                activeTab === "transakcie" 
                  ? "text-white font-semibold" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              Transakcie
              {activeTab === "transakcie" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("funkcie")}
              className={`pb-2.5 px-3 transition-colors relative ${
                activeTab === "funkcie" 
                  ? "text-white font-semibold" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              Funkcie
              {activeTab === "funkcie" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("karty")}
              className={`pb-2.5 px-3 transition-colors relative ${
                activeTab === "karty" 
                  ? "text-white font-semibold" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              Karty
              {activeTab === "karty" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`pb-2.5 px-3 transition-colors relative ${
                activeTab === "info" 
                  ? "text-white font-semibold" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              Info
              {activeTab === "info" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Obsah záložiek */}
        <div className="px-4 mt-4">
          {activeTab === "transakcie" && (
            <div className="space-y-3">
              {/* Vyhľadávanie a filtre */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Hľadať partnera, VS, sumu..."
                    className="w-full rounded-xl bg-white dark:bg-[#161a23] pl-10 pr-9 py-2.5 text-[14px] border border-slate-200 dark:border-zinc-800 outline-none focus:border-[#196ee6] dark:focus:border-[#38bdf8] text-slate-900 dark:text-white"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                      aria-label="Vymazať vyhľadávanie"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {([["all", "Všetky"], ["out", "Výdavky"], ["in", "Príjmy"]] as const).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setDirection(v)} className={chip(direction === v)}>{l}</button>
                  ))}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    aria-label="Zoradiť"
                    className={chip(sortBy !== "newest") + " outline-none cursor-pointer"}
                  >
                    <option value="newest">Najnovšie</option>
                    <option value="oldest">Najstaršie</option>
                    <option value="amount">Najvyššia suma</option>
                  </select>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  <button type="button" onClick={() => setCategory("all")} className={chip(category === "all")}>Všetky kategórie</button>
                  {categories.map((c) => (
                    <button key={c} type="button" onClick={() => setCategory(c)} className={chip(category === c)}>{c}</button>
                  ))}
                </div>

                {filtersActive && (
                  <div className="flex items-center justify-between px-1 text-[13px] text-slate-500 dark:text-zinc-400">
                    <span>
                      Nájdené: {filtered.length} · {filteredSum >= 0 ? "+" : "−"}{formatEur(Math.abs(filteredSum))}
                    </span>
                    <button type="button" onClick={resetFilters} className="font-semibold text-[#196ee6] dark:text-[#38bdf8]">
                      Zrušiť filtre
                    </button>
                  </div>
                )}
              </div>

              {/* Zoznam transakcií s farebnými ikonami a odznakmi */}
              {groupedTransactions.length === 0 ? (
                <div className="rounded-2xl bg-white dark:bg-[#161a23] p-8 text-center text-slate-400">
                  {filtersActive ? (
                    <>
                      <p>Žiadna transakcia nezodpovedá filtrom.</p>
                      <button type="button" onClick={resetFilters} className="mt-3 text-[13px] font-semibold text-[#196ee6] dark:text-[#38bdf8]">Zrušiť filtre</button>
                    </>
                  ) : (
                    "Zatiaľ žiadne zaznamenané transakcie."
                  )}
                </div>
              ) : (
                groupedTransactions.map((group) => (
                  <div key={group.label} className="space-y-2 pt-1">
                    <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-1">
                      {group.label}
                    </h2>
                    <div className="space-y-2">
                      {group.items.map((t) => {
                        const isIn = t.type === "in";
                        // Odznak okamžitej platby pri prevodoch
                        const isInstant = t.category === "Prevod" || t.category === "Mzda" || !t.category;

                        return (
                          <div
                            key={t.id}
                            onClick={() => navigate({ to: "/transakcia/$id", params: { id: t.id } })}
                            className="cursor-pointer flex items-center justify-between rounded-2xl bg-white dark:bg-[#161a23] p-4 shadow-sm border border-slate-100 dark:border-zinc-800/40 hover:bg-slate-50 dark:hover:bg-[#1c212c] transition active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                              <CategoryIcon category={t.category} type={t.type} counterparty={t.counterparty} />
                              
                              <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">
                                  {t.counterparty}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">
                                  <span>{formatDate(t.date)}</span>
                                  {isInstant && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#196ee6] dark:text-[#38bdf8] bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded-full">
                                      <Zap className="w-2.5 h-2.5 fill-current" /> Instant
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1">
                                  <span className="inline-block rounded-full border border-slate-200 dark:border-zinc-700/80 px-2 py-0.5 text-[11px] text-slate-600 dark:text-zinc-300">
                                    {t.category || "Prevod"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`text-[16px] font-bold ${
                                isIn 
                                  ? "text-[#16a34a] dark:text-[#4ade80]" 
                                  : "text-slate-900 dark:text-white"
                              }`}>
                                {isIn ? "+" : "−"}{formatEur(Math.abs(t.amount))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Obsah záložky Funkcie */}
          {activeTab === "funkcie" && (
            <div className="space-y-2.5">
              {[
                { title: "Trvalé príkazy", desc: "Správa opakovaných platieb", icon: QrCode },
                { title: "Výber z bankomatu mobilom", desc: "Kód pre bezkartový výber", icon: SlidersHorizontal },
                { title: "Výpisy z účtu", desc: "Mesačné a ročné PDF výpisy", icon: FileEdit },
              ].map((f) => (
                <div key={f.title} className="flex items-center justify-between rounded-2xl bg-white dark:bg-[#161a23] p-4 shadow-sm border border-slate-100 dark:border-zinc-800/40">
                  <div className="flex items-center gap-3">
                    <f.icon className="w-5 h-5 text-[#196ee6] dark:text-[#38bdf8]" />
                    <div>
                      <p className="text-[15px] font-medium text-slate-900 dark:text-white">{f.title}</p>
                      <p className="text-[12px] text-slate-500 dark:text-zinc-400">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Obsah záložky Karty */}
          {activeTab === "karty" && (
            <div className="rounded-2xl bg-white dark:bg-[#161a23] p-5 shadow-sm border border-slate-100 dark:border-zinc-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-slate-500 dark:text-zinc-400">Virtuálna karta</p>
                  <p className="text-[16px] font-bold text-slate-900 dark:text-white mt-0.5">VISA Debit ···· 2269</p>
                </div>
                <CreditCard className="w-8 h-8 text-[#196ee6] dark:text-[#38bdf8]" />
              </div>
            </div>
          )}

          {/* Obsah záložky Info */}
          {activeTab === "info" && (
            <div className="rounded-2xl bg-white dark:bg-[#161a23] p-5 shadow-sm border border-slate-100 dark:border-zinc-800/40 space-y-4">
              <div>
                <p className="text-[12px] text-slate-500 dark:text-zinc-400">Majiteľ účtu</p>
                <p className="text-[15px] font-medium text-slate-900 dark:text-white">{s.owner || "Tomáš Lizák"}</p>
              </div>
              <div>
                <p className="text-[12px] text-slate-500 dark:text-zinc-400">Názov účtu</p>
                <p className="text-[15px] font-medium text-slate-900 dark:text-white">SPACE účet</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-slate-500 dark:text-zinc-400">IBAN</p>
                  <p className="text-[14px] font-mono font-medium text-slate-900 dark:text-white">{s.iban || "SK83 0900 0000 0052 0892 1207"}</p>
                </div>
                <button
                  type="button"
                  onClick={copyIban}
                  className="p-2 text-[#196ee6] dark:text-[#38bdf8] hover:opacity-80 transition"
                  aria-label="Kopírovať IBAN"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Plávajúca spodná akčná lišta s Novou platbou */}
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0f1218]/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex w-11 h-11 items-center justify-center rounded-full bg-[#edf4ff] dark:bg-[#16273c] text-[#196ee6] dark:text-[#38bdf8] hover:opacity-85 transition active:scale-95"
                aria-label="Vyhľadať v transakciách"
              >
                <Search className="w-5 h-5 stroke-[2.2]" />
              </button>

              <Link
                to="/rozpocet"
                className="flex w-11 h-11 items-center justify-center rounded-full bg-[#edf4ff] dark:bg-[#16273c] text-[#196ee6] dark:text-[#38bdf8] hover:opacity-85 transition active:scale-95"
                aria-label="Prehľad výdavkov a štatistika"
              >
                <BarChart2 className="w-5 h-5 stroke-[2.2]" />
              </Link>
            </div>

            <Link
              to="/nova-platba"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#196ee6] hover:bg-[#155fc7] px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm transition active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[2.4]" />
              <span>Nová platba</span>
            </Link>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
