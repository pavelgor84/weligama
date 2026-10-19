"use client"

import { createContext, useContext, useState, useCallback, useMemo } from 'react'

export const PRICE_FILTER_DEFAULT = 1000   // USD, per day
export const PRICE_FILTER_MIN = 1
export const PRICE_FILTER_MAX = 1000
export const PRICE_FILTER_STEP = 10

const FilterContext = createContext({
  maxPrice: PRICE_FILTER_DEFAULT,
  setMaxPrice: () => {},
  selectedAmenities: [],
  toggleAmenity: () => {},
  resetAmenities: () => {},
})

export function FilterProvider({ children }) {
  const [maxPrice, setMaxPrice] = useState(PRICE_FILTER_DEFAULT)
  // Array of amenity tag ids (see components/amenityFilter/amenityTags.js),
  // e.g. ['ac', 'view:Ocean']
  const [selectedAmenities, setSelectedAmenities] = useState([])

  const setMaxPriceClamped = useCallback((value) => {
    const n = Number(value)
    if (!Number.isFinite(n)) return
    setMaxPrice(Math.min(PRICE_FILTER_MAX, Math.max(PRICE_FILTER_MIN, Math.round(n))))
  }, [])

  const toggleAmenity = useCallback((id) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const resetAmenities = useCallback(() => setSelectedAmenities([]), [])

  const value = useMemo(
    () => ({ maxPrice, setMaxPrice: setMaxPriceClamped, selectedAmenities, toggleAmenity, resetAmenities }),
    [maxPrice, setMaxPriceClamped, selectedAmenities, toggleAmenity, resetAmenities]
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilter() {
  return useContext(FilterContext)
}
