import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Lock, Smartphone, ShieldCheck, SlidersHorizontal, EyeOff, Eye, Copy } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/karty')({
  component: KartyPage,
})

const CARD_NUMBER = '4255 1234 5678 9012'
const CARD_CVV = '482'
const CARD_EXPIRY = '08/29'

const fmt = (v: number) =>
  v.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

function KartyPage() {
  const [blocked, setBlocked] = useState(() => localStorage.getItem('card-blocked') === '1')
  const [hidden, setHidden] = useState(false)
  const [internet, setInternet] = useState(true)
  const [abroad, setAbroad] = useState(true)
  const [contactless, setContactless] = useState(true)
  const [atmLimit, setAtmLimit] = useState(2000)
  const [posLimit, setPosLimit] = useState(4000)
  const [netLimit, setNetLimit] = useState(1000)

  const toggleBlocked = () => {
    const next = !blocked
    setBlocked(next)
    localStorage.setItem('card-blocked', next ? '1' : '0')
    toast.success(next ? 'Karta bola dočasne zablokovaná' : 'Karta bola odblokovaná')
  }

  const copyNumber = () => {
    navigator.clipboard?.writeText(CARD_NUMBER.replaceAll(' ', ''))
    toast.success('Číslo karty skopírované')
  }

  return (
    <div className="px-4 pt-2 pb-28 space-y-4 max-w-2xl mx-auto">
      {/* Vizuál karty */}
      <div className="relative rounded-3xl p-6 shadow-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs tracking-widest opacity-80">DEBETNÁ KARTA GEORGE</p>
            <p className="text-lg font-semibold mt-1">Klient George</p>
          </div>
          <span className="text-2xl font-black italic tracking-tight">VISA</span>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <p className="font-mono text-2xl tracking-[0.15em] leading-relaxed">
            {hidden ? '•••• •••• •••• ••••' : CARD_NUMBER}
          </p>
          {!hidden && (
            <button onClick={copyNumber} aria-label="Kopírovať číslo karty" className="opacity-80 hover:opacity-100">
              <Copy className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex justify-between items-end mt-6">
          <div className="flex gap-8">
            <div>
              <p className="text-xs opacity-70">Platnosť</p>
              <p className="font-semibold">{hidden ? '••/••' : CARD_EXPIRY}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">CVV / CVC</p>
              <p className="font-semibold">{hidden ? '•••' : CARD_CVV}</p>
            </div>
          </div>
          <button
            onClick={() => setHidden((v) => !v)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-medium"
          >
            {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {hidden ? 'Zobraziť údaje' : 'Skryť údaje'}
          </button>
        </div>

        {blocked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-5 py-1.5 rounded-full text-sm font-bold rotate-[-6deg]">
              ZABLOKOVANÁ
            </span>
          </div>
        )}
      </div>

      {/* Akcie */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={toggleBlocked}
          className={`rounded-2xl p-4 flex flex-col items-center gap-2 font-semibold transition-colors ${
            blocked
              ? 'bg-primary/15 text-primary'
              : 'bg-destructive/15 text-destructive'
          }`}
        >
          <Lock className="h-5 w-5" />
          {blocked ? 'Odblokovať kartu' : 'Dočasne zablokovať'}
        </button>
        <button
          onClick={() => toast.info('Pridanie do peňaženky bude dostupné čoskoro')}
          className="rounded-2xl p-4 flex flex-col items-center gap-2 font-semibold bg-muted text-foreground"
        >
          <Smartphone className="h-5 w-5 text-primary" />
          Pridať do Peňaženky
        </button>
      </div>

      {/* Zabezpečenie a platby */}
      <Card className="p-5 bg-card text-card-foreground shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Zabezpečenie a platby</h2>
        </div>
        <div className="divide-y">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Internetové platby</p>
              <p className="text-sm text-muted-foreground">Platenie na e-shopoch kartou</p>
            </div>
            <Switch checked={internet} onCheckedChange={setInternet} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Platby v zahraničí</p>
              <p className="text-sm text-muted-foreground">Použitie mimo Slovenska a EÚ</p>
            </div>
            <Switch checked={abroad} onCheckedChange={setAbroad} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Bezkontaktné platby</p>
              <p className="text-sm text-muted-foreground">Priloženie karty k terminálu</p>
            </div>
            <Switch checked={contactless} onCheckedChange={setContactless} />
          </div>
        </div>
      </Card>

      {/* Denné limity */}
      <Card className="p-5 bg-card text-card-foreground shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Denné limity</h2>
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-muted-foreground">Výber z bankomatu</p>
              <p className="font-semibold">{fmt(atmLimit)}</p>
            </div>
            <Slider value={[atmLimit]} onValueChange={([v]) => setAtmLimit(v)} min={0} max={2000} step={50} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-muted-foreground">Platby u obchodníkov (POS)</p>
              <p className="font-semibold">{fmt(posLimit)}</p>
            </div>
            <Slider value={[posLimit]} onValueChange={([v]) => setPosLimit(v)} min={0} max={5000} step={50} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-muted-foreground">Internetový limit</p>
              <p className="font-semibold">{fmt(netLimit)}</p>
            </div>
            <Slider value={[netLimit]} onValueChange={([v]) => setNetLimit(v)} min={0} max={3000} step={50} />
          </div>
        </div>
      </Card>
    </div>
  )
}
