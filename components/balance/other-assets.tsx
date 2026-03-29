"use client"

import { useState } from "react"
import { Plus, Trash2, Boxes, Pencil } from "lucide-react"
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
import { CurrencyInput } from "@/components/currency-input"
import type { OtherAsset, Currency } from "@/lib/types"
import { useFxRate } from "@/hooks/use-fx-rate"

interface OtherAssetsProps {
  entries: OtherAsset[]
  onCreate: (entry: { name: string; value: number; currency: string; note: string }) => Promise<unknown>
  onUpdate: (id: string, data: { name?: string; value?: number; note?: string }) => Promise<unknown>
  onDelete: (id: string) => Promise<void>
  loading?: boolean
}

export function OtherAssets({ entries, onCreate, onUpdate, onDelete, loading }: OtherAssetsProps) {
  const { toCZK, formatCZK, rate } = useFxRate()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [currency, setCurrency] = useState<Currency>("CZK")
  const [note, setNote] = useState("")

  const total = entries.reduce((sum, e) => sum + toCZK(e.value, e.currency), 0)

  function resetForm() {
    setName("")
    setValue("")
    setNote("")
    setCurrency("CZK")
    setEditingId(null)
  }

  function handleOpenAdd() {
    resetForm()
    setOpen(true)
  }

  function handleOpenEdit(entry: OtherAsset) {
    setEditingId(entry.id)
    setName(entry.name)
    setValue(entry.value.toString())
    setCurrency(entry.currency)
    setNote(entry.note)
    setOpen(true)
  }

  async function handleSave() {
    if (!name || !value) return
    setSaving(true)
    try {
      if (editingId) {
        await onUpdate(editingId, {
          name,
          value: parseFloat(value),
          note,
        })
      } else {
        await onCreate({
          name,
          value: parseFloat(value),
          currency,
          note,
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
    <Card className="bg-card border-rose-400/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-rose-400/15">
            <Boxes className="w-4 h-4 text-rose-400" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground">Others</CardTitle>
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
          <p className="text-sm text-muted-foreground">No other assets yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.name}</p>
                  {entry.note && (
                    <p className="text-xs text-muted-foreground">{entry.note}</p>
                  )}
                  <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                    {formatCZK(toCZK(entry.value, entry.currency))}
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
            <DialogTitle>{editingId ? "Edit Asset" : "Add Other Asset"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gold, Art, P2P Lending..."
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <CurrencyInput
              label="Value"
              amount={value}
              currency={currency}
              onAmountChange={setValue}
              onCurrencyChange={setCurrency}
              fxRate={rate}
            />
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Note (optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Description..."
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}