"use client"

import { useFilter } from '@/app/context/FilterContext'
import { AMENITY_TAGS } from './amenityTags'
import styles from './AmenityFilter.module.css'

export default function AmenityFilter() {
  const { selectedAmenities, toggleAmenity, resetAmenities } = useFilter()

  const count = selectedAmenities.length

  return (
    <div className={styles.wrap}>
      <div className={styles.scrollRow} role="listbox" aria-label="Select amenities">
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
        {count > 0 && (
          <button className={styles.reset} onClick={() => resetAmenities()}>
            Reset ({count})
          </button>
        )}
      </div>
    </div>
  )
}
