import { NextResponse } from 'next/server'

// Daily exchange rates, USD base.
// Primary: open.er-api.com (free, no key). Fallback: frankfurter.
// 24h revalidation — rental prices don't need fresher rates,
// and it keeps upstream calls to ~1/day.
export const revalidate = 86400

export async function GET() {
  const sources = [
    {
      url: 'https://open.er-api.com/v6/latest/USD',
      parse: (json) => {
        if (json.result !== 'success' || !json.rates) throw new Error('bad er-api payload')
        return json.rates
      },
    },
    {
      url: 'https://api.frankfurter.app/latest?from=USD',
      parse: (json) => {
        if (!json.rates) throw new Error('bad frankfurter payload')
        return json.rates
      },
    },
  ]

  for (const source of sources) {
    try {
      const res = await fetch(source.url, { next: { revalidate: 86400 } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const rates = source.parse(json)
      // USD rate must always be present (it's 1)
      if (rates.USD === undefined) throw new Error('missing USD')
      return NextResponse.json({ base: 'USD', rates })
    } catch (err) {
      console.error('[rates] source failed:', source.url, err.message)
    }
  }

  // All sources down — revalidate every hour so it recovers on its own.
  return NextResponse.json(
    { base: 'USD', rates: null },
    { status: 502, headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } }
  )
}
