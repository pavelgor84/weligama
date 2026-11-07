"use client"

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import AmenityFilter from './AmenityFilter'
import DetailedAmenityFilter from './DetailedAmenityFilter'
import styles from './AmenityFilterArea.module.css'

/**
 * Amenities filter + the round "adjust filters" icon button that opens the
 * detailed filter modal.
 *
 * Rendered as a fragment (no wrapper div) so it slots into the header's
 * .filterRow exactly like <AmenityFilter/> did:
 *   - desktop: in-flow flex item right of the pill strip
 *   - mobile:  absolutely positioned below the pill strip (top:104px), so it
 *              never covers the chips and the strip can bleed edge to edge
 *
 * The modal itself is portaled to document.body: .filterRow has a CSS
 * transform (translateX(-50%)), which makes any position:fixed descendant
 * resolve against it instead of the viewport — that's what previously made
 * the overlay cover only the filter row and pushed the card above the
 * browser window.
 */
export default function AmenityFilterArea() {
  const [open, setOpen] = useState(false)
  // document only exists on the client — the portal target is set in an
  // effect so static generation (SSG) never touches it.
  const [body, setBody] = useState(null)
  useEffect(() => { setBody(document.body) }, [])

  return (
    <>
      <AmenityFilter />
      <button
        type="button"
        className={styles.moreBtn}
        onClick={() => setOpen(true)}
        aria-label="More filters"
        title="More filters"
      >
        {/* "Adjust" glyph: three sliders with knobs — the detailed filter entry point */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M3 6.5h8.6" /><circle cx="14.2" cy="6.5" r="2.4" /><path d="M16.6 6.5H21" />
          <path d="M3 12h2.6" /><circle cx="8.2" cy="12" r="2.4" /><path d="M10.6 12H21" />
          <path d="M3 17.5h8.6" /><circle cx="14.2" cy="17.5" r="2.4" /><path d="M16.6 17.5H21" />
        </svg>
      </button>
      {body && createPortal(
        <DetailedAmenityFilter open={open} onClose={() => setOpen(false)} />,
        body
      )}
    </>
  )
}
