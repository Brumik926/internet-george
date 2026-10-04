import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CreditCard, LockKeyhole, UnlockKeyhole, Info, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useBank } from '@/lib/bank-store'

export const Route = createFileRoute('/_authenticated/karty')({
  head: () => ({ meta: [
    { title: 'Karty · George' },
    { name: 'description', content: 'Platobná karta, jej údaje a ovládanie v George.' },
    { property: 'og:title', content: 'Karty · George' },
    { property: 'og:description', content: 'Prehľad platobnej karty a jej ovládanie.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: KartyPage,
})

function KartyPage() {
  const bank = useBank()
  const [blocked, setBlocked] = useState(false)
  const [dialog, setDialog] = useState<'details' | 'block' | null>(null)

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-background pb-28 text-foreground">
      <header className="flex items-center gap-3 px-5 pb-6 pt-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/" aria-label="Späť na Prehľad"><ArrowLeft className="size-5" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-normal">Karty</h1>
      </header>

      <section className="px-5" aria-label="Platobná karta">
        <div className="payment-card relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-lg p-6 text-primary-foreground">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xl font-semibold">Slovenská sporiteľňa</p><p className="mt-1 text-xs opacity-80">SPACE · Visa Debit</p></div>
            <Wifi className="mt-1 size-6 shrink-0 rotate-90" aria-label="Bezkontaktná karta" />
          </div>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 30" className="payment-card-chip h-7 w-10" aria-hidden="true">
              <rect x="1" y="1" width="38" height="28" rx="5" fill="currentColor" />
              <path d="M14 1v9H1m25-9v9h13M14 29v-9H1m25 9v-9h13M14 10h12v10H14z" fill="none" stroke="var(--payment-card-chip-line)" />
            </svg>
            <p className="whitespace-nowrap font-mono text-lg">•••• •••• •••• 2269</p>
          </div>
          <div className="flex items-end justify-between gap-3">
            <p className="min-w-0 truncate text-sm uppercase">{bank.owner || 'Visa Debit'}</p>
            <span className="text-3xl font-bold italic">VISA</span>
          </div>
          {blocked && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 text-foreground"><LockKeyhole className="size-8" /><p className="font-semibold">Dočasne zablokovaná</p><p className="text-xs text-muted-foreground">Ukážková karta</p></div>}
        </div>

        <div className="flex items-center justify-between gap-3 py-5">
          <div><h2 className="text-lg font-semibold tracking-normal">Visa Debit</h2><p className="mt-1 text-xs text-muted-foreground">Ukážková karta · •••• 2269</p></div>
          <span className={blocked ? 'text-sm font-medium text-destructive' : 'text-sm font-medium text-income'}>{blocked ? 'Zablokovaná' : 'Aktívna'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 border-y border-border py-5">
          <Button variant="secondary" className="h-20 flex-col gap-2 rounded-lg" onClick={() => setDialog('details')}><CreditCard className="size-5" />Údaje karty</Button>
          <Button variant="secondary" className="h-20 flex-col gap-2 rounded-lg" onClick={() => setDialog('block')}>
            {blocked ? <UnlockKeyhole className="size-5" /> : <LockKeyhole className="size-5" />}
            {blocked ? 'Odblokovať kartu' : 'Zablokovať kartu'}
          </Button>
        </div>
        <dl className="space-y-5 py-6 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Typ karty</dt><dd>Visa Debit</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Číslo karty</dt><dd className="font-mono">•••• 2269</dd></div>
          <div><dt className="text-muted-foreground">Pripojený účet</dt><dd className="mt-2 break-words font-mono">{bank.iban || '—'}</dd></div>
        </dl>
        <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" />Skutočné údaje karty ani bankové blokovanie nie sú pripojené.</p>
      </section>

      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null) }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>{dialog === 'details' ? 'Údaje karty' : blocked ? 'Odblokovať kartu?' : 'Zablokovať kartu?'}</DialogTitle>
            <DialogDescription>{dialog === 'details'
              ? 'V ukážke je dostupné iba maskované číslo •••• 2269. Celé číslo, platnosť a bezpečnostný kód nie sú v Cloude uložené.'
              : 'Zmena platí iba pre túto ukážku. Skutočnú platobnú kartu v banke nezablokuje ani neodblokuje.'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>{dialog === 'details' ? 'Zavrieť' : 'Zrušiť'}</Button>
            {dialog === 'block' && <Button onClick={() => { setBlocked(value => !value); setDialog(null) }}>{blocked ? 'Odblokovať ukážku' : 'Zablokovať ukážku'}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}