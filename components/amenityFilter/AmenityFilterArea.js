"use client"

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import AmenityFilter from './AmenityFilter'
import DetailedAmenityFilter from './DetailedAmenityFilter'
import styles from './AmenityFilterArea.module.css'

/**
 * Amenities filter + the "more.." button that opens the detailed filter modal.
 *
 * Rendered as a fragment (no wrapper div) so it slots into the header's
 * .filterRow exactly like <AmenityFilter/> did:
 *   - desktop: in-flow flex item right of the pill strip
 *   - mobile:  absolutely positioned at the right end of the pill strip row
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
      <button className={styles.moreBtn} onClick={() => setOpen(true)}>more..</button>
      {body && createPortal(
        <DetailedAmenityFilter open={open} onClose={() => setOpen(false)} />,
        body
      )}
    </>
  )
}
