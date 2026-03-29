"use client"

import { useState } from "react"
import { Banknote, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { CurrencyInput } from "@/components/currency-input"
import type { CashBalance, Currency } from "@/lib/types"
import { useFxRate } from "@/hooks/use-fx-rate"

interface CashAvailableProps {
  balance: CashBalance
  onUpdate: (amount: number, currency: string) => void
  loading?: boolean
}

export function CashAvailable({ balance, onUpdate, loading }: CashAvailableProps) {
  const { toCZK, formatCZK, rate } = useFxRate()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<Currency>("CZK")

  const safeBalance = typeof balance.amount === "number" && !isNaN(balance.amount) ? balance.amount : 0
  const safeCurrency = balance.currency ?? "CZK"
  const displayCZK = toCZK(safeBalance, safeCurrency)

  function handleOpen() {
    setAmount(safeBalance.toString())
    setCurrency(safeCurrency)
    setOpen(true)
  }

  function handleSave() {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed < 0) return
    onUpdate(parsed, currency)
    setOpen(false)
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-400/15">
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Cash Available</span>
            <span className="text-lg font-bold text-foreground font-mono">{formatCZK(displayCZK)}</span>
            {balance.currency === "USD" && safeBalance > 0 && (
              <span className="text-xs text-muted-foreground">
                ({safeBalance.toLocaleString("cs-CZ")} USD)
              </span>
            )}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={handleOpen} className="text-muted-foreground hover:text-foreground gap-1.5">
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cash Balance</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <CurrencyInput
              label="Amount"
              amount={amount}
              currency={currency}
              onAmountChange={setAmount}
              onCurrencyChange={setCurrency}
              fxRate={rate}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
