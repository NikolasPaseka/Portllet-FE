"use client"

import { useState, useEffect, useCallback } from "react"

export function useLocalStorage<T>(key: string, initialValue: T, validate?: (data: unknown) => data is T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        const parsed = JSON.parse(item)
        if (validate) {
          if (validate(parsed)) {
            setStoredValue(parsed)
          } else {
            // Stale/incompatible data — clear it and use initial value
            window.localStorage.removeItem(key)
          }
        } else {
          setStoredValue(parsed)
        }
      }
    } catch {
      window.localStorage.removeItem(key)
    }
    setIsLoaded(true)
  }, [key, validate])

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        return valueToStore
      })
    },
    [key]
  )

  return [storedValue, setValue, isLoaded] as const
}
