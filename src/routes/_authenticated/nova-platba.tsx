import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Fingerprint,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  QrCode,
  Camera,
  Upload,
  X,
} from "lucide-react";
import { enableBiometric, isBiometricEnabled, isBiometricSupported, verifyBiometric } from "@/lib/biometric";
import { AppShell, BrandHeader } from "@/components/bank/AppShell";
import { RecipientPicker } from "@/components/bank/RecipientPicker";
import {
  addTransaction,
  balance,
  CATEGORIES,
  formatEur,
  useBank,
} from "@/lib/bank-store";
import { QrScannerModal } from "@/components/bank/QrScannerModal";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/nova-platba")({
  head: () => ({
    meta: [
      { title: "Nová platba | George" },
      { property: "og:title", content: "Nová platba | George" },
      { property: "og:description", content: "Zadajte prevod so skenovaním QR kódu a biometrickým potvrdením." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Zadajte prevod so skenovaním a biometrickým potvrdením v George." },
    ],
  }),
  component: NovaPlatba,
});

const field =
  "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground focus:border-primary";

function NovaPlatba() {
  const s = useBank();
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();

  const [name, setName] = useState("");
  const [iban, setIban] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Prevod");
  const [note, setNote] = useState("");
  const [vs, setVs] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    void isBiometricSupported().then(setBioSupported);
  }, []);

  const value = Number(amount.replace(",", "."));

  // 1. Validácia formulára pred autorizáciou
  function handleInitiatePayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Zadajte meno príjemcu.");
    if (!iban.trim()) return setError("Zadajte IBAN príjemcu.");
    if (!Number.isFinite(value) || value <= 0) return setError("Zadajte platnú sumu.");
    if (value > balance(s)) return setError("Nedostatočný zostatok na účte.");

    setShowConfirmModal(true);
  }

  // 2. Biometrické potvrdenie a zaúčtovanie platby
  async function confirmWithBiometrics() {
    setBusy(true);
    setError("");

    try {
      if (!bioSupported) {
        throw new Error("Toto zariadenie nepodporuje overenie odtlačkom prsta.");
      }
      if (!isBiometricEnabled(user.id)) {
        await enableBiometric(user.id, user.email ?? "George");
      }
      // Každá platba sa vždy potvrdí odtlačkom/tvárou
      const verified = await verifyBiometric(user.id);
      if (!verified) throw new Error("Overenie biometriou zlyhalo.");

      addTransaction({
        type: "out",
        counterparty: name.trim(),
        iban: iban.trim().toUpperCase(),
        amount: Math.round(value * 100) / 100,
        date: new Date().toISOString(),
        category,
        ...(vs.trim() ? { vs: vs.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });

      setShowConfirmModal(false);
      toast.success("Platba bola úspešne autorizovaná a odoslaná");
      navigate({ to: "/platby" });
    } catch (err) {
      console.error(err);
      toast.error("Autorizácia platby bola prerušená");
      const msg = err instanceof Error && err.name !== "NotAllowedError" ? err.message : "";
      setError(msg || "Overenie odtlačkom/tvárou bolo zrušené alebo zlyhalo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <BrandHeader
        title="Nová platba"
        subtitle={`Z účtu · ${formatEur(balance(s))}`}
        back
        action={
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            aria-label="Skenovať QR kód / Faktúru"
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted/60 active:scale-95"
          >
            <QrCode className="size-4 text-primary" />
            <span>Skenovať</span>
          </button>
        }
      />

      <div className="space-y-3 px-4 pb-24">
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/50 active:scale-[0.99]"
        >
          <QrCode className="size-5 text-primary" />
          <span>Skenovať QR kód / Faktúru</span>
        </button>

        <RecipientPicker
          userId={user.id}
          transactions={s.transactions}
          current={{ name, iban }}
          onPick={(r) => {
            setName(r.name);
            setIban(r.iban);
            if (r.category) setCategory(r.category);
          }}
        />

        {/* Formulár platby */}
        <form onSubmit={handleInitiatePayment} className="space-y-3">
          <div className="space-y-3 rounded-3xl bg-surface p-4 shadow-sm">
            <label className="block">
              <span className="text-[12px] text-muted-foreground">Príjemca</span>
              <input
                className={`${field} mt-1`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Meno a priezvisko alebo názov firmy"
              />
            </label>

            <label className="block">
              <span className="text-[12px] text-muted-foreground">IBAN / číslo účtu</span>
              <input
                className={`${field} mt-1 font-mono tracking-wide uppercase`}
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="SK00 0000 0000 0000 0000 0000"
              />
            </label>

            <label className="block">
              <span className="text-[12px] text-muted-foreground">Suma (€)</span>
              <input
                className={`${field} mt-1 text-[24px] font-bold text-foreground`}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[12px] text-muted-foreground">Kategória</span>
                <select
                  className={`${field} mt-1`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[12px] text-muted-foreground">Variabilný symbol</span>
                <input
                  className={`${field} mt-1 font-mono`}
                  inputMode="numeric"
                  value={vs}
                  onChange={(e) => setVs(e.target.value)}
                  placeholder="10 čísel"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[12px] text-muted-foreground">Správa pre príjemcu</span>
              <input
                className={`${field} mt-1`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Poznámka k platbe"
              />
            </label>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 p-3 text-[13px] text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-95"
          >
            <span>Pokračovať na autorizáciu</span>
            <ArrowRight className="size-4" />
          </button>

          <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-600" />
            Platba bude overená biometriou zariadenia
          </p>
        </form>
      </div>

      {/* Skener QR kódov */}
      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(data) => {
          if (data.recipientName) setName(data.recipientName);
          if (data.iban) setIban(data.iban);
          if (data.amount) setAmount(data.amount.replace(".", ","));
          if (data.vs) setVs(data.vs);
          if (data.note) setNote(data.note);
        }}
      />

      {/* Rekapitulácia a potvrdenie */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-[400px] rounded-3xl bg-surface p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
                <Fingerprint className="size-8" />
              </div>
              <h3 className="mt-3 text-[18px] font-bold">Potvrdenie platby</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Skontrolujte detaily platby a autorizujte prevod.
              </p>
            </div>

            <div className="my-5 space-y-2 rounded-2xl bg-surface-2 p-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Suma:</span>
                <span className="font-bold text-foreground text-[15px]">{formatEur(value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Príjemca:</span>
                <span className="font-semibold text-foreground">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IBAN:</span>
                <span className="font-mono text-[11px] text-foreground">{iban}</span>
              </div>
              {vs && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VS:</span>
                  <span className="font-mono text-foreground">{vs}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={confirmWithBiometrics}
                disabled={busy}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                <Fingerprint className="size-5" />
                {busy ? "Overujem biometriu…" : "Potvrdiť biometriou"}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={busy}
                className="h-11 w-full rounded-2xl bg-transparent text-[13px] font-semibold text-muted-foreground hover:bg-surface-2"
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
