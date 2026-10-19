"use client"

import { useEffect, useState } from 'react'
import { useFilter } from '@/app/context/FilterContext'
import { AMENITY_TAGS } from './amenityTags'
import { AMENITY_CATEGORIES } from '@/components/shared/roomAmenityCatalog'
import styles from './DetailedAmenityFilter.module.css'

// Header pills grouped by tag type (same order as the header row).
const GENERAL_GROUPS = [
  { label: 'Property', match: (t) => t.type === 'boolean' },
  { label: 'Rooms',    match: (t) => t.type === 'number' },
  { label: 'Beds',     match: (t) => t.type === 'beds' },
  { label: 'Views',    match: (t) => t.type === 'string' },
]

/**
 * Detailed amenities filter modal.
 *
 * Props:
 *   open    — visibility flag
 *   onClose — called by the X button and Escape (discards the draft)
 *
 * Draft semantics: pills toggle a local `draft` list; only Apply commits it
 * to the shared FilterContext (applyAmenities). Clear empties the draft
 * without closing the window.
 */
export default function DetailedAmenityFilter({ open, onClose }) {
  const { selectedAmenities, applyAmenities } = useFilter()
  // Draft selection — only becomes real on Apply.
  const [draft, setDraft] = useState([])

  // Seed the draft from the live selection each time the modal opens.
  useEffect(() => {
    if (open) setDraft([...selectedAmenities])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Escape closes without applying (same as the X button).
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const toggle = (id) =>
    setDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleClear = () => setDraft([])
  const handleApply = () => { applyAmenities(draft); onClose() }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Detailed amenities filter">
      <div className={styles.card}>
        <button className={styles.close} onClick={onClose} aria-label="Close filter">×</button>
        <h2 className={styles.title}>Amenities</h2>

        <div className={styles.body}>
          {GENERAL_GROUPS.map((g) => {
            const tags = AMENITY_TAGS.filter(g.match)
            if (tags.length === 0) return null
            return (
              <section key={g.label} className={styles.group}>
                <h3 className={styles.groupTitle}>{g.label}</h3>
                <div className={styles.pillRow}>
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      className={draft.includes(tag.id) ? styles.pillOn : styles.pill}
                      onClick={() => toggle(tag.id)}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </section>
            )
          })}

          {AMENITY_CATEGORIES.map((cat) => (
            <section key={cat.label} className={styles.group}>
              <h3 className={styles.groupTitle}>{cat.label}</h3>
              <div className={styles.pillRow}>
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    className={draft.includes(item.id) ? styles.pillOn : styles.pill}
                    onClick={() => toggle(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.clearBtn} onClick={handleClear}>Clear</button>
          <button className={styles.applyBtn} onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  )
}
