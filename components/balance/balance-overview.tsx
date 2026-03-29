"use client"

import {
  Banknote,
  Landmark,
  TrendingUp,
  Bitcoin,
  Boxes,
} from "lucide-react"
import { useDashboard, useCash, useBankAccounts, useStocks, useCrypto, useAssets } from "@/hooks/use-api"
import { CashAvailable } from "./cash-available"
import { BankAccounts } from "./bank-accounts"
import { Stocks } from "./stocks"
import { Crypto } from "./crypto"
import { OtherAssets } from "./other-assets"
import { useFxRate } from "@/hooks/use-fx-rate"

const FALLBACK_RATE = 23.5

export function BalanceOverview() {
  const { data: dashboard, loading: dashboardLoading, refetch: refetchDashboard } = useDashboard()
  const { data: cashData, loading: cashLoading, update: updateCash } = useCash()
  const { data: bankAccounts = [], loading: bankLoading, create: createAccount, update: updateAccount, remove: deleteAccount } = useBankAccounts()
  const { data: stocksData = [], loading: stockLoading, create: createStock, update: updateStock, remove: deleteStock } = useStocks()
  const { data: cryptoData = [], loading: cryptoLoading, create: createCrypto, update: updateCrypto, remove: deleteCrypto } = useCrypto()
  const { data: assetsData = [], loading: assetLoading, create: createAsset, update: updateAsset, remove: deleteAsset } = useAssets()
  const { rate, loading: fxLoading, toCZK, formatCZK } = useFxRate()

  const effectiveRate = dashboard?.fx_rate_usd_czk || rate || FALLBACK_RATE

  // Wrap create functions to refetch dashboard after operations
  const handleCreateAsset = async (entry: any) => {
    await createAsset(entry)
    await refetchDashboard()
  }

  const handleUpdateAsset = async (id: string, data: any) => {
    await updateAsset(id, data)
    await refetchDashboard()
  }

  const handleDeleteAsset = async (id: string) => {
    await deleteAsset(id)
    await refetchDashboard()
  }

  const handleCreateStock = async (entry: any) => {
    await createStock(entry)
    await refetchDashboard()
  }

  const handleUpdateStock = async (id: string, data: any) => {
    await updateStock(id, data)
    await refetchDashboard()
  }

  const handleDeleteStock = async (id: string) => {
    await deleteStock(id)
    await refetchDashboard()
  }

  const handleCreateCrypto = async (entry: any) => {
    await createCrypto(entry)
    await refetchDashboard()
  }

  const handleUpdateCrypto = async (id: string, data: any) => {
    await updateCrypto(id, data)
    await refetchDashboard()
  }

  const handleDeleteCrypto = async (id: string) => {
    await deleteCrypto(id)
    await refetchDashboard()
  }

  // Transform API data to component types
  const cash = {
    amount: cashData.amount,
    currency: cashData.currency as "CZK" | "USD",
  }

  const cashTotal = toCZK(cash.amount, cash.currency)
  const bankTotal = bankAccounts.reduce(
    (sum, a) => sum + toCZK(a.balance, a.currency as "CZK" | "USD"),
    0
  )
  // Stocks and crypto values are now in USD from the API (live prices from Yahoo Finance)
  const stockTotal = stocksData.reduce(
    (sum, e) => sum + toCZK(e.totalValueUsd ?? 0, "USD"),
    0
  )
  const cryptoTotal = cryptoData.reduce(
    (sum, e) => sum + toCZK(e.totalValueUsd ?? 0, "USD"),
    0
  )
  const otherTotal = assetsData.reduce(
    (sum, e) => sum + toCZK(e.value, e.currency as "CZK" | "USD"),
    0
  )
  const grandTotal = dashboard?.total_czk ?? (cashTotal + bankTotal + stockTotal + cryptoTotal + otherTotal)

  const summaryCards = [
    {
      label: "Cash",
      value: cashTotal,
      icon: Banknote,
      iconColor: "text-emerald-400",
      bgAccent: "bg-emerald-400/10",
      borderAccent: "border-emerald-400/20",
    },
    {
      label: "Banks",
      value: bankTotal,
      icon: Landmark,
      iconColor: "text-sky-400",
      bgAccent: "bg-sky-400/10",
      borderAccent: "border-sky-400/20",
    },
    {
      label: "Stocks",
      value: stockTotal,
      icon: TrendingUp,
      iconColor: "text-amber-400",
      bgAccent: "bg-amber-400/10",
      borderAccent: "border-amber-400/20",
    },
    {
      label: "Crypto",
      value: cryptoTotal,
      icon: Bitcoin,
      iconColor: "text-orange-400",
      bgAccent: "bg-orange-400/10",
      borderAccent: "border-orange-400/20",
    },
    {
      label: "Others",
      value: otherTotal,
      icon: Boxes,
      iconColor: "text-rose-400",
      bgAccent: "bg-rose-400/10",
      borderAccent: "border-rose-400/20",
    },
  ]

  const loading = dashboardLoading || fxLoading

  return (
    <div className="flex flex-col gap-5">
      {/* Grand Total */}
      <div className="rounded-xl bg-linear-to-r from-emerald-500/10 via-sky-500/5 to-amber-500/10 border border-border p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Net Worth</p>
            <p className="text-3xl font-bold text-foreground font-mono">
              {loading ? "..." : formatCZK(grandTotal)}
            </p>
            {!loading && (
              <p className="text-xs text-muted-foreground mt-1.5">
                1 USD = {effectiveRate.toFixed(2)} CZK
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border ${card.borderAccent} ${card.bgAccent} p-3.5 flex flex-col gap-2`}
          >
            <div className="flex items-center gap-2">
              <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
            </div>
            <p className="text-base font-semibold text-foreground font-mono">
              {loading ? "..." : formatCZK(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Cash - compact inline */}
      <CashAvailable
        balance={cash}
        onUpdate={(amount, currency) => updateCash(amount, currency)}
        loading={cashLoading}
      />

      {/* Bank Accounts - full width prominent section */}
      <BankAccounts
        accounts={bankAccounts}
        onCreate={createAccount}
        onUpdate={updateAccount}
        onDelete={deleteAccount}
        loading={bankLoading}
      />

      {/* Bottom grid: Stocks, Crypto, Others */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Stocks
          entries={stocksData}
          onCreate={handleCreateStock}
          onUpdate={handleUpdateStock}
          onDelete={handleDeleteStock}
          loading={stockLoading}
        />
        <Crypto
          entries={cryptoData}
          onCreate={handleCreateCrypto}
          onUpdate={handleUpdateCrypto}
          onDelete={handleDeleteCrypto}
          loading={cryptoLoading}
        />
        <OtherAssets
          entries={assetsData.map(a => ({
            id: a.id,
            name: a.name,
            value: a.value,
            currency: a.currency as "CZK" | "USD",
            note: a.note,
          }))}
          onCreate={handleCreateAsset}
          onUpdate={handleUpdateAsset}
          onDelete={handleDeleteAsset}
          loading={assetLoading}
        />
      </div>
    </div>
  )
}