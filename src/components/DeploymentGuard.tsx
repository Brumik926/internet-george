import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CloudOff, RefreshCw } from "lucide-react";

type Status = "checking" | "ok" | "missing-config" | "unreachable";

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
  if (!url || !key) return null;
  return { url, key };
}

async function pingBackend(url: string, key: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Overí, či má nasadená aplikácia konfiguráciu backendu a či sa naň vie pripojiť.
 * Ak nie, zobrazí jasnú správu o obnovení namiesto prázdnej obrazovky.
 */
export function DeploymentGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  const check = useCallback(async () => {
    setStatus("checking");
    const config = getSupabaseConfig();
    if (!config) {
      setStatus("missing-config");
      return;
    }
    const reachable = await pingBackend(config.url, config.key);
    setStatus(reachable ? "ok" : "unreachable");
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  if (status === "ok") return <>{children}</>;

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Kontrolujem pripojenie…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <CloudOff className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          Aplikácia sa nevie pripojiť k backendu
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {status === "missing-config"
            ? "V tomto nasadení chýba konfigurácia databázy. Otvorte projekt v Lovable a znovu ho publikujte tlačidlom Update, aby sa nastavenia backendu dostali do živej verzie."
            : "Backend je momentálne nedostupný. Skúste to o chvíľu znova, prípadne aplikáciu znovu publikujte."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => void check()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Skúsiť znova
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Obnoviť stránku
          </button>
        </div>
      </div>
    </div>
  );
}
