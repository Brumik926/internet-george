import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, CreditCard, Lock, LockOpen, Eye, EyeOff, Wifi } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/karty')({
  component: KartyPage,
})

const CARD_NUMBER = '5123 4567 8901 2345'
const CARD_HOLDER = 'MENO PRIEZVISKO'
const CARD_EXPIRY = '09/28'
const BLOCKED_KEY = 'card-blocked'

function KartyPage() {
  const navigate = useNavigate()
  const [blocked, setBlocked] = useState(() => localStorage.getItem(BLOCKED_KEY) === '1')
  const [showNumber, setShowNumber] = useState(false)

  // Načítanie účtu a zostatku z cloudu
  const { data: account } = useQuery({
    queryKey: ['profile-balance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const [profileRes, txnsRes] = await Promise.all([
        supabase.from('profiles').select('iban').eq('id', user.id).single(),
        supabase.from('transactions').select('type, amount').eq('user_id', user.id),
      ])

      if (profileRes.error) throw profileRes.error
      if (txnsRes.error) throw txnsRes.error

      const balance = (txnsRes.data ?? []).reduce(
        (sum, t) => sum + (t.type === 'in' ? Number(t.amount) : -Number(t.amount)),
        0,
      )
      return { iban: profileRes.data?.iban ?? '', balance }
    },
  })

  // História transakcií z cloudu
  const { data: transactions } = useQuery({
    queryKey: ['account-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  const toggleBlocked = (value: boolean) => {
    setBlocked(value)
    localStorage.setItem(BLOCKED_KEY, value ? '1' : '0')
    toast.success(value ? 'Karta bola zablokovaná' : 'Karta bola odblokovaná')
  }

  const masked = '•••• •••• •••• ' + CARD_NUMBER.slice(-4)

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/' })}
        className="flex items-center gap-2 mb-2"
      >
        <ArrowLeft className="h-4 w-4" /> Späť na Prehľad
      </Button>

      {/* Vizuál karty */}
      <div
        className={`relative rounded-2xl p-6 shadow-lg transition-opacity ${
          blocked ? 'opacity-60 grayscale' : ''
        } bg-gradient-to-br from-primary to-primary/70 text-primary-foreground`}
      >
        <div className="flex justify-between items-start mb-8">
          <CreditCard className="h-8 w-8" />
          <Wifi className="h-6 w-6 rotate-90" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <p className="font-mono text-xl tracking-widest">
            {showNumber ? CARD_NUMBER : masked}
          </p>
          <button
            onClick={() => setShowNumber((v) => !v)}
            aria-label="Zobraziť číslo karty"
            className="opacity-80 hover:opacity-100"
          >
            {showNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs opacity-70">Držiteľ karty</p>
            <p className="font-semibold tracking-wide">{CARD_HOLDER}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">Platnosť</p>
            <p className="font-semibold">{CARD_EXPIRY}</p>
          </div>
        </div>
        {blocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-4 py-1 rounded-full text-sm font-bold rotate-[-8deg]">
              ZABLOKOVANÁ
            </span>
          </div>
        )}
      </div>

      {/* Nastavenia karty */}
      <Card className="p-4 bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {blocked ? <Lock className="h-5 w-5 text-destructive" /> : <LockOpen className="h-5 w-5 text-primary" />}
            <div>
              <p className="font-medium">Blokovanie karty</p>
              <p className="text-xs text-muted-foreground">
                {blocked ? 'Karta je momentálne zablokovaná' : 'Karta je aktívna'}
              </p>
            </div>
          </div>
          <Switch checked={blocked} onCheckedChange={toggleBlocked} />
        </div>
        <div className="border-t pt-3 mt-2 space-y-1">
          <p className="text-sm text-muted-foreground">Viazaná na účet</p>
          <p className="font-mono text-sm">{account?.iban || '—'}</p>
        </div>
      </Card>

      {/* História transakcií z cloudu */}
      <Card className="p-4 bg-card text-card-foreground shadow-sm">
        <h2 className="text-lg font-semibold mb-3">História transakcií</h2>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{tx.counterparty}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString('sk-SK')}
                  </p>
                </div>
                <span className={`font-semibold ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'in' ? '+' : '−'}{Number(tx.amount).toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Žiadne nedávne transakcie.</p>
        )}
      </Card>
    </div>
  )
}
