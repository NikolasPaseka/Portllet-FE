"use client"

import { useState, useEffect, useCallback } from "react"
import { dashboardApi, cashApi, banksApi, accountsApi, stocksApi, cryptoApi, assetsApi } from "@/lib/api"

interface DashboardOverview {
  cash_czk: number
  banks_czk: number
  stocks_czk: number
  crypto_czk: number
  other_czk: number
  total_czk: number
  fx_rate_usd_czk: number
}

interface CashBalance {
  id: string
  amount: number
  currency: string
}

interface BankAccount {
  id: string
  bankId: string
  name: string
  bankName: string
  type: string
  balance: number
  currency: string
  interestRate: number | null
  createdAt: string
  updatedAt: string
  envelopes: unknown[]
}

interface StockEntry {
  id: string
  name: string
  ticker: string
  shares: number
  livePriceUsd: number | null
  totalValueUsd: number | null
  createdAt: string
  updatedAt: string
}

interface CryptoEntry {
  id: string
  name: string
  symbol: string
  amount: number
  livePriceUsd: number | null
  totalValueUsd: number | null
  createdAt: string
  updatedAt: string
}

interface OtherAsset {
  id: string
  name: string
  value: number
  currency: string
  note: string
  createdAt: string
}

export function useDashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await dashboardApi.overview()
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}

export function useCash() {
  const [data, setData] = useState<CashBalance>({ id: "", amount: 0, currency: "CZK" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await cashApi.get()
      setData(result || { id: "", amount: 0, currency: "CZK" })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch cash")
      setData({ id: "", amount: 0, currency: "CZK" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const update = useCallback(async (amount: number, currency: string) => {
    const result = await cashApi.update(amount, currency)
    setData(result || { id: "", amount: 0, currency: "CZK" })
  }, [])

  return { data, loading, error, refetch, update }
}

interface Bank {
  id: string
  name: string
  createdAt: string
  accounts: unknown[]
}

export function useBanks() {
  const [data, setData] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await banksApi.list()
      setData(Array.isArray(result) ? result : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch banks")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const create = useCallback(async (name: string) => {
    const result = await banksApi.create(name)
    setData(prev => [...prev, result])
    return result
  }, [])

  const update = useCallback(async (id: string, name: string) => {
    const result = await banksApi.update(id, name)
    setData(prev => prev.map(b => b.id === id ? result : b))
    return result
  }, [])

  const remove = useCallback(async (id: string) => {
    await banksApi.delete(id)
    setData(prev => prev.filter(b => b.id !== id))
  }, [])

  return { data, loading, error, refetch, create, update, remove }
}

export function useBankAccounts() {
  const [data, setData] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await accountsApi.list()
      setData(Array.isArray(result) ? result : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch accounts")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const create = useCallback(async (bankId: string, name: string, type: string, balance: number, currency: string, interestRate?: number) => {
    const result = await accountsApi.create({ bankId, name, type, balance, currency, interestRate })
    setData(prev => [...prev, result])
    return result
  }, [])

  const update = useCallback(async (id: string, data: { name?: string; balance?: number; currency?: string }) => {
    const result = await accountsApi.update(id, data)
    setData(prev => prev.map(a => a.id === id ? result : a))
    return result
  }, [])

  const remove = useCallback(async (id: string) => {
    await accountsApi.delete(id)
    setData(prev => prev.filter(a => a.id !== id))
  }, [])

  return { data, loading, error, refetch, create, update, remove }
}

export function useStocks() {
  const [data, setData] = useState<StockEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await stocksApi.list()
      setData(Array.isArray(result) ? result : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch stocks")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const create = useCallback(async (entry: { name: string; ticker: string; shares: number }) => {
    const result = await stocksApi.create(entry)
    setData(prev => [...prev, result])
    return result
  }, [])

  const update = useCallback(async (id: string, data: { name?: string; ticker?: string; shares?: number }) => {
    const result = await stocksApi.update(id, data)
    setData(prev => prev.map(s => s.id === id ? result : s))
    return result
  }, [])

  const remove = useCallback(async (id: string) => {
    await stocksApi.delete(id)
    setData(prev => prev.filter(s => s.id !== id))
  }, [])

  return { data, loading, error, refetch, create, update, remove }
}

export function useCrypto() {
  const [data, setData] = useState<CryptoEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await cryptoApi.list()
      setData(Array.isArray(result) ? result : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch crypto")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const create = useCallback(async (entry: { name: string; symbol: string; amount: number }) => {
    const result = await cryptoApi.create(entry)
    setData(prev => [...prev, result])
    return result
  }, [])

  const update = useCallback(async (id: string, data: { name?: string; amount?: number }) => {
    const result = await cryptoApi.update(id, data)
    setData(prev => prev.map(c => c.id === id ? result : c))
    return result
  }, [])

  const remove = useCallback(async (id: string) => {
    await cryptoApi.delete(id)
    setData(prev => prev.filter(c => c.id !== id))
  }, [])

  return { data, loading, error, refetch, create, update, remove }
}

export function useAssets() {
  const [data, setData] = useState<OtherAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await assetsApi.list()
      setData(Array.isArray(result) ? result : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch assets")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const create = useCallback(async (entry: { name: string; value: number; currency: string; note: string }) => {
    const result = await assetsApi.create(entry)
    setData(prev => [...prev, result])
    return result
  }, [])

  const update = useCallback(async (id: string, data: { name?: string; value?: number; note?: string }) => {
    const result = await assetsApi.update(id, data)
    setData(prev => prev.map(a => a.id === id ? result : a))
    return result
  }, [])

  const remove = useCallback(async (id: string) => {
    await assetsApi.delete(id)
    setData(prev => prev.filter(a => a.id !== id))
  }, [])

  return { data, loading, error, refetch, create, update, remove }
}