import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Send, CreditCard, FileText, ArrowLeft } from "lucide-react";

// Jemná hmatová odozva pre mobilné zariadenia
function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(8);
    } catch {}
  }
}

// George "g" logo pre záložku Prehľad
function GeorgeGIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="10" r="5" />
      <path d="M17 10v6a4 4 0 0 1-4 4h-2" />
    </svg>
  );
}

export const defaultGeorgeNavItems = [
  { to: "/", label: "Prehľad", icon: GeorgeGIcon, primary: false },
  { to: "/nova-platba", label: "Platba", icon: Send, primary: true },
  { to: "/karty", label: "Karty", icon: CreditCard, primary: false },
  { to: "/platby", label: "Detaily", icon: FileText, primary: false },
] as const;

export function AppShell({ 
  children,
  hideBottomNav = false,
}: { 
  children: ReactNode;
  hideBottomNav?: boolean;
}) {
  return (
    <div className={`mx-auto min-h-screen w-full max-w-[430px] bg-[#f2f4f8] dark:bg-[#0e1117] text-slate-900 dark:text-white ${hideBottomNav ? "pb-6" : "pb-24"} selection:bg-[#196ee6]/20 transition-colors`}>
      {children}
    </div>
  );
}

export function PersistentBottomNav({
  items = defaultGeorgeNavItems,
}: {
  items?: readonly { to: string; label: string; icon: any; primary?: boolean }[];
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (typeof document === "undefined") return null;

  return createPortal(
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-slate-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0f1218]/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-6px_28px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors">
      <div className="grid grid-cols-4 px-2 items-end">
        {items.map(({ to, label, icon: Icon, primary }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);

          // Výrazné zvýraznené tlačidlo pre Novú platbu
          if (primary) {
            return (
              <Link
                key={to}
                to={to}
                onClick={triggerHaptic}
                className="flex flex-col items-center gap-1 -mt-4 active:scale-95 transition-all duration-150"
                aria-label={label}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#155cc0] to-[#196ee6] text-white shadow-lg shadow-blue-500/30 ring-4 ring-white dark:ring-[#0f1218] active:brightness-110 transition-transform">
                  <Icon className="w-5 h-5 stroke-[2.4] translate-x-0.5 -translate-y-0.5" />
                </div>
                <span className={`text-[11px] font-semibold tracking-tight ${active ? "text-[#196ee6] dark:text-[#38bdf8]" : "text-slate-600 dark:text-zinc-400"}`}>
                  {label}
                </span>
              </Link>
            );
          }

          // Štandardné navigačné položky s hmatovou odozvou a odpružením
          return (
            <Link
              key={to}
              to={to}
              onClick={triggerHaptic}
              className={`flex flex-col items-center gap-1 py-1 active:scale-90 transition-all duration-150 select-none ${
                active 
                  ? "text-[#196ee6] dark:text-[#38bdf8] font-semibold" 
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <div className={`flex items-center justify-center transition-all duration-200 ${
                active 
                  ? "w-12 h-7 rounded-full bg-[#e3effe] dark:bg-[#162c45] text-[#196ee6] dark:text-[#38bdf8] shadow-sm" 
                  : "w-12 h-7"
              }`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] tracking-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body,
  );
}

export function BrandHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  return (
    <header className="px-5 pt-6 pb-4">
      <div className="flex items-center justify-between">
        {back ? (
          <Link
            to="/"
            onClick={triggerHaptic}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-800 dark:text-white active:scale-90 transition-transform duration-150"
            aria-label="Späť"
          >
            <ArrowLeft className="size-5" />
          </Link>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">George</span>
        )}
        {action}
      </div>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{subtitle}</p> : null}
    </header>
  );
}
