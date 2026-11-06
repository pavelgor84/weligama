"use client"

import { useEffect, useRef } from 'react'
import { useFilter } from '@/app/context/FilterContext'
import { AMENITY_TAGS } from './amenityTags'
import styles from './AmenityFilter.module.css'

export default function AmenityFilter() {
  const { selectedAmenities, toggleAmenity } = useFilter()
  const rowRef = useRef(null)

  // Mouse wheel over the pill row should scroll the row horizontally.
  // React's onWheel is registered passive at the root, so preventDefault()
  // inside it silently fails — a native non-passive listener is required.
  useEffect(() => {
    const el = rowRef.current
    if (!el) return

    const onWheel = (e) => {
      // Only intercept dominant vertical deltas; horizontal trackpad swipes
      // keep working natively via overflow-x: auto.
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return

      // Always swallow the vertical wheel over the pill row so the page
      // (and thus the house menu) never scrolls from here. When the row has
      // no room to scroll, scrollLeft is clamped by the browser and the
      // wheel simply does nothing.
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div className={styles.wrap}>
      <div ref={rowRef} className={styles.scrollRow} role="listbox" aria-label="Select amenities">
        {AMENITY_TAGS.map((tag) => {
          const selected = selectedAmenities.includes(tag.id)
          return (
            <button
              key={tag.id}
              role="option"
              aria-selected={selected}
              className={selected ? styles.tagSelected : styles.tag}
              onClick={() => toggleAmenity(tag.id)}
            >
              {tag.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
