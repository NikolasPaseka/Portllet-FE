"use client"

import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/api"

const FALLBACK_RATE = 23.5 // fallback USD/CZK rate

export function useFxRate() {
  const [rate, setRate] = useState(FALLBACK_RATE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchRate() {
      try {
        setLoading(true)
        const data = await apiRequest<{ from: string; to: string; rate: number }>(
          "/fx/rate?from=USD&to=CZK",
          { requiresAuth: false }
        )
        if (data?.rate) {
          setRate(data.rate)
        }
      } catch {
        // use fallback rate
      } finally {
        setLoading(false)
      }
    }
    fetchRate()
  }, [])

  const toCZK = (amount: number, currency: "CZK" | "USD") => {
    if (currency === "CZK") return amount
    return amount * rate
  }

  const formatCZK = (amount: number) => {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return { rate, loading, toCZK, formatCZK }
}
