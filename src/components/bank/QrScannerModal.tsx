import { useEffect, useRef, useState } from "react";
import { Camera, Upload, X, AlertCircle } from "lucide-react";
import jsQR from "jsqr";
import { parsePaymentQr, isPayBySquare, type ParsedPaymentData } from "@/lib/qr-parser";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (data: ParsedPaymentData) => void;
}

function decodeFromCanvas(source: CanvasImageSource, w: number, h: number, canvas: HTMLCanvasElement): string | null {
  if (!w || !h) return null;
  // zmenši veľké obrázky kvôli rýchlosti
  const scale = Math.min(1, 1024 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

export function QrScannerModal({ open, onClose, onScanSuccess }: Props) {
  const [mode, setMode] = useState<"camera" | "file">("camera");
  const [errorMsg, setErrorMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastWarnRef = useRef("");

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function handleRaw(raw: string): boolean {
    const parsed = parsePaymentQr(raw);
    if (parsed && (parsed.iban || parsed.amount)) {
      stopCamera();
      navigator.vibrate?.(50);
      toast.success("Údaje z QR kódu boli vložené do platby");
      onScanSuccess(parsed);
      onClose();
      return true;
    }
    const warn = isPayBySquare(raw)
      ? "Tento QR kód je vo formáte PAY by square, ktorý zatiaľ nevieme prečítať. Zadajte údaje ručne."
      : "QR kód neobsahuje platobné údaje (IBAN alebo sumu).";
    if (lastWarnRef.current !== warn) {
      lastWarnRef.current = warn;
      setErrorMsg(warn);
    }
    return false;
  }

  useEffect(() => {
    if (!open || mode !== "camera") {
      stopCamera();
      return;
    }
    let active = true;
    lastWarnRef.current = "";
    setErrorMsg("");

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!active) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();

        let last = 0;
        const tick = (t: number) => {
          if (!active || !streamRef.current) return;
          if (t - last > 200 && video.readyState >= 2 && canvasRef.current) {
            last = t;
            const raw = decodeFromCanvas(video, video.videoWidth, video.videoHeight, canvasRef.current);
            if (raw && handleRaw(raw)) return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        console.error(err);
        setErrorMsg("Kamera nie je dostupná alebo nebol udelený prístup. Skúste nahrať fotku.");
      }
    }
    void init();
    return () => {
      active = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canvasRef.current) return;
    setErrorMsg("");
    lastWarnRef.current = "";
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const raw = decodeFromCanvas(img, img.naturalWidth, img.naturalHeight, canvasRef.current);
      if (!raw) setErrorMsg("Na obrázku sa nenašiel QR kód. Skúste ostrejšiu fotku.");
      else handleRaw(raw);
    } catch {
      setErrorMsg("Obrázok sa nepodarilo načítať.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3">
          <h3 className="font-bold text-foreground">Skenovať faktúru / QR</h3>
          <button
            type="button"
            aria-label="Zavrieť"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1">
          {(["camera", "file"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                mode === m ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m === "camera" ? <Camera className="size-4" /> : <Upload className="size-4" />}
              {m === "camera" ? "Kamera" : "Nahrať fotku"}
            </button>
          ))}
        </div>

        {mode === "camera" ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} playsInline muted autoPlay className="size-full object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="size-48 rounded-2xl border-2 border-dashed border-primary/90" />
            </div>
          </div>
        ) : (
          <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-4 text-center hover:bg-muted/50">
            <Upload className="mb-2 size-8 text-primary" />
            <span className="text-sm font-semibold">Vyberte fotografiu faktúry</span>
            <span className="mt-1 text-xs text-muted-foreground">PNG, JPG alebo screenshot QR kódu</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
