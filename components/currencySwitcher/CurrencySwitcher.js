"use client"

import { useState } from 'react'
import { useCurrency } from '@/app/context/CurrencyContext'
import styles from './CurrencySwitcher.module.css'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'LKR', 'INR', 'AED']
const LABELS = { USD: 'USD $', EUR: 'EUR €', GBP: 'GBP £', LKR: 'LKR Rs.', INR: 'INR ₹', AED: 'AED' }

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)

  return (
    <div className={styles.wrap}>
      <button
        className={styles.button}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {LABELS[currency]} <span className={styles.arrow}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className={styles.menu} role="listbox" aria-label="Currency">
          {CURRENCIES.map((code) => (
            <li
              key={code}
              role="option"
              aria-selected={code === currency}
              className={code === currency ? styles.active : ''}
              onClick={() => { setCurrency(code); setOpen(false) }}
            >
              {LABELS[code]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
