"use client"

import { useState } from "react"
import { Plus, Trash2, TrendingUp, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { StockEntry } from "@/lib/types"
import { useFxRate } from "@/hooks/use-fx-rate"

interface StocksProps {
  entries: StockEntry[]
  onCreate: (entry: { name: string; ticker: string; shares: number }) => Promise<unknown>
  onUpdate: (id: string, data: { name?: string; shares?: number }) => Promise<unknown>
  onDelete: (id: string) => Promise<void>
  loading?: boolean
}

export function Stocks({ entries, onCreate, onUpdate, onDelete, loading }: StocksProps) {
  const { toCZK, formatCZK } = useFxRate()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [ticker, setTicker] = useState("")
  const [shares, setShares] = useState("")

  const total = entries.reduce(
    (sum, e) => sum + toCZK(e.totalValueUsd ?? 0, "USD"),
    0
  )

  function resetForm() {
    setName("")
    setTicker("")
    setShares("")
    setEditingId(null)
  }

  function handleOpenAdd() {
    resetForm()
    setOpen(true)
  }

  function handleOpenEdit(entry: StockEntry) {
    setEditingId(entry.id)
    setName(entry.name)
    setTicker(entry.ticker)
    setShares(entry.shares.toString())
    setOpen(true)
  }

  async function handleSave() {
    if (!name || !shares) return
    setSaving(true)
    try {
      if (editingId) {
        await onUpdate(editingId, {
          name,
          ticker: ticker.toUpperCase(),
          shares: parseFloat(shares),
        })
      } else {
        await onCreate({
          name,
          ticker: ticker.toUpperCase(),
          shares: parseFloat(shares),
        })
      }
    } finally {
      setSaving(false)
      resetForm()
      setOpen(false)
    }
  }

  async function handleDelete(id: string) {
    await onDelete(id)
  }

  return (
    <Card className="bg-card border-amber-400/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-400/15">
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground">Stocks</CardTitle>
        </div>
        <Button size="sm" variant="outline" onClick={handleOpenAdd} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground font-mono mb-4">{loading ? "..." : formatCZK(total)}</p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stock entries yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{entry.name}</p>
                    {entry.ticker && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                        {entry.ticker}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.shares} shares @ ${entry.livePriceUsd?.toLocaleString("en-US") ?? "N/A"} USD
                  </p>
                  <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                    {formatCZK(toCZK(entry.totalValueUsd ?? 0, "USD"))}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(entry)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Stock" : "Add Stock"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Company Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apple Inc."
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Ticker Symbol</Label>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="e.g. AAPL"
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Number of Shares</Label>
              <Input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}