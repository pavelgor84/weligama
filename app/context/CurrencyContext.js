"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'LKR', 'INR', 'AED']
const SYMBOLS = { USD: '$', EUR: '€', GBP: '£', LKR: 'Rs.', INR: '₹', AED: 'AED ' }
const STORAGE_KEY = 'weligama_currency'

const CurrencyContext = createContext({
  currency: 'USD',
  setCurrency: () => {},
  formatPrice: (price) => String(price ?? 0),
})

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('USD')
  const [rates, setRates] = useState(null) // { USD: 1, EUR: 0.86, ... }

  // Load persisted choice once (client only, avoids SSR mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && CURRENCIES.includes(saved)) setCurrencyState(saved)
    } catch (_) { /* storage unavailable — stay USD */ }
  }, [])

  // Fetch daily rates once. On failure stay in USD — never a broken price.
  useEffect(() => {
    let cancelled = false
    fetch('/api/rates')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status))))
      .then((data) => {
        if (!cancelled && data.rates) setRates(data.rates)
      })
      .catch((err) => console.warn('[currency] rates unavailable, staying USD:', err.message))
    return () => { cancelled = true }
  }, [])

  const setCurrency = useCallback((code) => {
    if (!CURRENCIES.includes(code)) return
    setCurrencyState(code)
    try { localStorage.setItem(STORAGE_KEY, code) } catch (_) { /* non-fatal */ }
  }, [])

  // Converts a USD price to a display string like "Rs.12,340" or "€130".
  // Rates missing or unknown currency → plain USD, no symbol gymnastics.
  const formatPrice = useCallback((priceUsd) => {
    const value = Number(priceUsd) || 0
    if (!rates || currency === 'USD') return `${SYMBOLS[currency]}${value.toLocaleString('en-US')}`
    const converted = value * rates[currency]
    // LKR/INR have no meaningful cents at these magnitudes; round to whole units.
    const formatted = Number.isInteger(converted)
      ? converted.toLocaleString('en-US')
      : converted.toLocaleString('en-US', { maximumFractionDigits: 0 })
    return `${SYMBOLS[currency]}${formatted}`
  }, [rates, currency])

  const value = useMemo(() => ({ currency, setCurrency, formatPrice }), [currency, setCurrency, formatPrice])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
