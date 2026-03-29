"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  Trash2,
  Landmark,
  PiggyBank,
  Percent,
  ChevronDown,
  ChevronUp,
  Pencil,
  TrendingUp,
  Building2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CurrencyInput } from "@/components/currency-input"
import type { BankAccountType, Currency } from "@/lib/types"
import { useFxRate } from "@/hooks/use-fx-rate"
import { useBanks } from "@/hooks/use-api"

interface BankAccountApi {
  id: string
  bankId: string
  bankName: string
  name: string
  type: string
  balance: number
  currency: string
  interestRate: number | null
  createdAt: string
  updatedAt: string
  envelopes: unknown[]
}

interface BankAccountsProps {
  accounts: BankAccountApi[]
  onCreate: (bankId: string, name: string, type: string, balance: number, currency: string, interestRate?: number) => Promise<unknown>
  onUpdate: (id: string, data: { name?: string; balance?: number; currency?: string }) => Promise<unknown>
  onDelete: (id: string) => Promise<void>
  loading?: boolean
}

interface BankGroup {
  bankName: string
  accounts: BankAccountApi[]
  totalCZK: number
}

export function BankAccounts({ accounts, onCreate, onUpdate, onDelete, loading }: BankAccountsProps) {
  const { toCZK, formatCZK, rate } = useFxRate()
  const { data: banks = [], loading: banksLoading, create: createBank } = useBanks()
  const [open, setOpen] = useState(false)
  const [openBankDialog, setOpenBankDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [collapsedBanks, setCollapsedBanks] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [savingBank, setSavingBank] = useState(false)

  // account form
  const [selectedBankId, setSelectedBankId] = useState("")
  const [name, setName] = useState("")
  const [bankName, setBankName] = useState("")
  const [newBankName, setNewBankName] = useState("")
  const [type, setType] = useState<BankAccountType>("common")
  const [balance, setBalance] = useState("")
  const [currency, setCurrency] = useState<Currency>("CZK")
  const [interestRate, setInterestRate] = useState("")

  const total = accounts.reduce(
    (sum, a) => sum + toCZK(a.balance, a.currency as Currency),
    0
  )

  const groups: BankGroup[] = useMemo(() => {
    const map = new Map<string, BankAccountApi[]>()
    for (const acc of accounts) {
      const key = acc.bankName || "Other"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(acc)
    }
    return Array.from(map.entries()).map(([bankName, accs]) => ({
      bankName,
      accounts: accs,
      totalCZK: accs.reduce((s, a) => s + toCZK(a.balance, a.currency as Currency), 0),
    }))
  }, [accounts, toCZK])

  function toggleBankCollapse(bankName: string) {
    setCollapsedBanks((prev) => {
      const next = new Set(prev)
      if (next.has(bankName)) next.delete(bankName)
      else next.add(bankName)
      return next
    })
  }

  function resetForm() {
    setSelectedBankId("")
    setName("")
    setType("common")
    setBalance("")
    setCurrency("CZK")
    setInterestRate("")
    setEditingId(null)
  }

  function handleOpenAdd() {
    resetForm()
    if (banks.length > 0) {
      setSelectedBankId(banks[0].id)
    }
    setOpen(true)
  }

  async function handleCreateBank() {
    if (!newBankName.trim()) return
    setSavingBank(true)
    try {
      await createBank(newBankName)
      setNewBankName("")
      setOpenBankDialog(false)
      // Open account creation dialog after bank is created
      setTimeout(() => {
        resetForm()
        if (banks.length > 0) {
          setSelectedBankId(banks[0].id)
        }
        setOpen(true)
      }, 100)
    } finally {
      setSavingBank(false)
    }
  }

  function handleOpenEdit(account: BankAccountApi) {
    setEditingId(account.id)
    setSelectedBankId(account.bankId)
    setName(account.name)
    setType(account.type as BankAccountType)
    setBalance(account.balance.toString())
    setCurrency(account.currency as Currency)
    setInterestRate(account.interestRate?.toString() ?? "")
    setOpen(true)
  }

  async function handleSave() {
    if (!name || !balance || parseFloat(balance) < 0 || !selectedBankId) return
    setSaving(true)
    try {
      if (editingId) {
        await onUpdate(editingId, {
          name,
          balance: parseFloat(balance),
          currency,
        })
      } else {
        await onCreate(
          selectedBankId,
          name,
          type,
          parseFloat(balance),
          currency,
          type === "saving" && interestRate ? parseFloat(interestRate) : undefined
        )
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

  function getMonthlyInterest(account: BankAccountApi) {
    if (account.type !== "saving" || !account.interestRate) return 0
    return (account.balance * account.interestRate) / 100 / 12
  }

  function getYearlyInterest(account: BankAccountApi) {
    if (account.type !== "saving" || !account.interestRate) return 0
    return (account.balance * account.interestRate) / 100
  }

  return (
    <Card className="bg-card border-sky-400/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-400/15">
            <Landmark className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Bank Accounts
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {groups.length} {groups.length === 1 ? "bank" : "banks"} · {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xl font-bold text-foreground font-mono hidden sm:block">
            {loading ? "..." : formatCZK(total)}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenBankDialog(true)}
            className="gap-1.5"
            title="Create a new bank"
          >
            <Plus className="w-3.5 h-3.5" />
            Bank
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenAdd}
            className="gap-1.5"
            disabled={banks.length === 0}
            title={banks.length === 0 ? "Create a bank first" : "Add account to a bank"}
          >
            <Plus className="w-3.5 h-3.5" />
            Account
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <p className="text-xl font-bold text-foreground font-mono sm:hidden">
          {loading ? "..." : formatCZK(total)}
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading accounts...</p>
        ) : banksLoading ? (
          <p className="text-sm text-muted-foreground">Loading banks...</p>
        ) : banks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No banks yet. Click "Add" to create your first bank and account.
          </p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bank accounts yet. Add your first account.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => {
              const isCollapsed = collapsedBanks.has(group.bankName)
              return (
                <div
                  key={group.bankName}
                  className="rounded-xl border border-border/60 overflow-hidden"
                >
                  {/* Bank group header */}
                  <button
                    onClick={() => toggleBankCollapse(group.bankName)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-secondary/40 hover:bg-secondary/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-sky-400/10">
                        <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {group.bankName}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary text-muted-foreground">
                        {group.accounts.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-foreground">
                        {formatCZK(group.totalCZK)}
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Accounts in this bank */}
                  {!isCollapsed && (
                    <div className="divide-y divide-border/30">
                      {group.accounts.map((account) => {
                        const isSaving = account.type === "saving"
                        const isExpanded = expandedId === account.id
                        const monthlyInterest = getMonthlyInterest(account)
                        const yearlyInterest = getYearlyInterest(account)
                        const balanceCZK = toCZK(account.balance, account.currency as Currency)

                        return (
                          <div key={account.id}>
                            {/* Account row */}
                            <div className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/20 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${
                                    isSaving ? "bg-amber-400/15" : "bg-sky-400/10"
                                  }`}
                                >
                                  {isSaving ? (
                                    <PiggyBank className="w-3.5 h-3.5 text-amber-400" />
                                  ) : (
                                    <Landmark className="w-3.5 h-3.5 text-sky-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {account.name}
                                    </p>
                                    <Badge
                                      variant="secondary"
                                      className={`text-[10px] px-1.5 py-0 shrink-0 ${
                                        isSaving
                                          ? "bg-amber-400/15 text-amber-400 border-amber-400/20"
                                          : "bg-sky-400/10 text-sky-400 border-sky-400/20"
                                      }`}
                                    >
                                      {isSaving ? "Saving" : "Common"}
                                    </Badge>
                                    {isSaving && account.interestRate !== undefined && (
                                      <span className="text-[10px] text-amber-400 font-mono shrink-0">
                                        {account.interestRate}% p.a.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <p className="text-sm font-bold font-mono text-foreground">
                                    {formatCZK(balanceCZK)}
                                  </p>
                                  {account.currency === "USD" && (
                                    <p className="text-[10px] text-muted-foreground font-mono">
                                      {account.balance.toLocaleString("cs-CZ")} USD
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {isSaving && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground"
                                      onClick={() => setExpandedId(isExpanded ? null : account.id)}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleOpenEdit(account)}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(account.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Saving account detail panel */}
                            {isSaving && isExpanded && (
                              <div className="px-4 pb-3 bg-amber-400/5">
                                {/* Interest details */}
                                {account.interestRate !== undefined && (
                                  <div className="rounded-lg bg-background/50 p-3 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <Percent className="w-3.5 h-3.5 text-amber-400" />
                                      <span className="text-sm font-medium text-amber-400">
                                        {account.interestRate}% p.a.
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Monthly interest</span>
                                      <span className="text-foreground font-mono flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                                        +{formatCZK(toCZK(monthlyInterest, account.currency as Currency))}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Yearly interest</span>
                                      <span className="text-foreground font-mono">
                                        +{formatCZK(toCZK(yearlyInterest, account.currency as Currency))}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Account Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Bank</Label>
              <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Account Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Checking"
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Account Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as BankAccountType)}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="saving">Saving</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CurrencyInput
              label="Balance"
              amount={balance}
              currency={currency}
              onAmountChange={setBalance}
              onCurrencyChange={setCurrency}
              fxRate={rate}
            />
            {type === "saving" && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm text-muted-foreground">
                  Annual Interest Rate (%)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="e.g. 4.5"
                  className="bg-secondary border-border text-foreground"
                />
                {interestRate && parseFloat(balance) > 0 && (
                  <p className="text-xs text-amber-400">
                    Monthly interest: ~{" "}
                    {formatCZK(
                      toCZK(
                        (parseFloat(balance) * parseFloat(interestRate)) / 100 / 12,
                        currency
                      )
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !selectedBankId}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bank Dialog */}
      <Dialog open={openBankDialog} onOpenChange={setOpenBankDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bank</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Bank Name</Label>
              <Input
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="e.g. CSOB, KB, Wise..."
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenBankDialog(false); setNewBankName(""); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateBank} disabled={savingBank || !newBankName.trim()}>
              {savingBank ? "Creating..." : "Create Bank"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}