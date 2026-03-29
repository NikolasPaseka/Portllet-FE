"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Currency } from "@/lib/types"

interface CurrencyInputProps {
  label: string
  amount: string
  currency: Currency
  onAmountChange: (val: string) => void
  onCurrencyChange: (val: Currency) => void
  fxRate?: number
  placeholder?: string
}

export function CurrencyInput({
  label,
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  fxRate,
  placeholder = "0",
}: CurrencyInputProps) {
  const numAmount = parseFloat(amount) || 0
  const czkEquivalent = currency === "USD" && fxRate ? numAmount * fxRate : null

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-secondary border-border text-foreground"
        />
        <Select value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
          <SelectTrigger className="w-24 bg-secondary border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CZK">CZK</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {czkEquivalent !== null && numAmount > 0 && (
        <p className="text-xs text-muted-foreground">
          {"~"}{" "}
          {new Intl.NumberFormat("cs-CZ", {
            style: "currency",
            currency: "CZK",
            maximumFractionDigits: 0,
          }).format(czkEquivalent)}
        </p>
      )}
    </div>
  )
}
