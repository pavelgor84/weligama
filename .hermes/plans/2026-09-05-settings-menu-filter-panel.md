# Settings Menu with Advanced Filters Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a ☰ settings button next to the existing header controls (CurrencySwitcher, PriceFilter). Clicking it opens an overlay panel with advanced filter options (bedrooms, bathrooms, amenities). Currency and price remain where they are for fast access.

**Architecture:** New `SettingsMenu` component — a standalone dropdown anchored to the header. Uses no new context; checkboxes are presentational only for now. The existing `CurrencySwitcher` and `PriceFilter` stay untouched in `app/header.js`.

**Tech Stack:** Next.js App Router, React hooks, CSS Modules

---

## Task 1: Create the SettingsMenu component

**Objective:** Build a dropdown menu with a settings icon button and an expandable panel containing advanced filter controls.

**Files:**
- Create: `components/settingsMenu/SettingsMenu.js`
- Create: `components/settingsMenu/SettingsMenu.module.css`

**Step 1: Write the SettingsMenu component**

```js
// components/settingsMenu/SettingsMenu.js
"use client"

import { useState, useEffect, useRef } from 'react'
import styles from './SettingsMenu.module.css'

const BEDROOM_OPTIONS = ['Any', '1+', '2+', '3+', '4+']
const BATHROOM_OPTIONS = ['Any', '1+', '2+', '3+']
const AMENITY_OPTIONS = ['Air Conditioning', 'Parking', 'Garden', 'Pool', 'Balcony', 'Heating']

export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className={styles.wrapper} ref={panelRef}>
      {/* Settings button */}
      <button
        className={styles.button}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Advanced filters"
        title="Filters"
      >
        ⚙
      </button>

      {/* Expandable panel */}
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Advanced filter options">
          {/* Header with close */}
          <div className={styles.panelHeader}>
            <span>Filters</span>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close filters">✕</button>
          </div>

          {/* Bedrooms */}
          <fieldset className={styles.fieldset}>
            <legend>Bedrooms</legend>
            <div className={styles.optionGroup}>
              {BEDROOM_OPTIONS.map((opt) => (
                <label key={opt} className={styles.checkboxLabel}>
                  <input type="checkbox" /> {opt}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Bathrooms */}
          <fieldset className={styles.fieldset}>
            <legend>Bathrooms</legend>
            <div className={styles.optionGroup}>
              {BATHROOM_OPTIONS.map((opt) => (
                <label key={opt} className={styles.checkboxLabel}>
                  <input type="checkbox" /> {opt}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Amenities */}
          <fieldset className={styles.fieldset}>
            <legend>Amenities</legend>
            <div className={styles.optionGroup}>
              {AMENITY_OPTIONS.map((opt) => (
                <label key={opt} className={styles.checkboxLabel}>
                  <input type="checkbox" /> {opt}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Apply / Reset row */}
          <div className={styles.actionRow}>
            <button className={styles.resetBtn}>Reset</button>
            <button className={styles.applyBtn}>Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Write the CSS module**

```css
/* components/settingsMenu/SettingsMenu.module.css */

.wrapper {
  position: relative;
  display: inline-block;
}

.button {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #181A18;
  font-size: 18px;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s;
}

.button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}

/* Panel — positioned below and to the right of the button */
.panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 300px;
  max-height: 75vh;
  overflow-y: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 1000;
  color: #181A18;
}

.panelHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.panelHeader span {
  font-size: 16px;
  font-weight: 600;
}

.closeBtn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #999;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.2s;
}

.closeBtn:hover {
  color: #333;
}

.fieldset {
  margin: 14px 0;
  border: none;
  padding: 0;
}

.fieldset legend {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.optionGroup {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkboxLabel {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
  padding: 2px 0;
  transition: color 0.15s;
}

.checkboxLabel:hover {
  color: #000;
}

.actionRow {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid #e8e8e8;
}

.resetBtn {
  flex: 1;
  padding: 10px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: background 0.2s;
}

.resetBtn:hover {
  background: #eaeaea;
}

.applyBtn {
  flex: 1;
  padding: 10px;
  background: #181A18;
  border: 1px solid #181A18;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: white;
  font-weight: 500;
  transition: background 0.2s;
}

.applyBtn:hover {
  background: #333;
}

/* Mobile: full-height slide-in from right */
@media (max-width: 768px) {
  .panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    max-height: 100vh;
    border-radius: 0;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
  }
}
```

**Step 3: Add the button to the header (next to existing controls)**

Modify `app/header.js`:

```js
// app/header.js (BEFORE)
import styles from '../components/header/header.module.css'
import CurrencySwitcher from '@/components/currencySwitcher/CurrencySwitcher'
import PriceFilter from '@/components/priceFilter/PriceFilter'

export default function Header() {
    return (
        <div className={styles.container}>
            <CurrencySwitcher />
            <PriceFilter />
            <div className={styles.title}>...</div>
        </div>
    )
}

// app/header.js (AFTER)
import styles from '../components/header/header.module.css'
import CurrencySwitcher from '@/components/currencySwitcher/CurrencySwitcher'
import PriceFilter from '@/components/priceFilter/PriceFilter'
import SettingsMenu from '@/components/settingsMenu/SettingsMenu'

export default function Header() {
    return (
        <div className={styles.container}>
            <CurrencySwitcher />
            <PriceFilter />
            <SettingsMenu />

            <div className={styles.title}>
                <div className={styles.title_header}>Ceylon rooms</div>
                <div className={styles.title_text}>More Economic Rental Choices to escape to paradise. Book your dream vacation today!</div>
                <div className={styles.info_text}>
                    The site is under development.
                    <p>For any questions: pavelgor@gmail.com</p>
                </div>
            </div>
        </div>
    )
}
```

**Step 4: Commit**

```bash
cd /home/kali/Documents/weligama
git add components/settingsMenu/ app/header.js
git commit -m "feat: add settings menu with advanced filters panel"
```

---

## Verification Steps

After implementing:
1. Navigate to the home page — header should show CurrencySwitcher, PriceFilter, and a new ⚙ button
2. Click ⚙ — panel should appear below/right of the button
3. Panel should contain Bedrooms, Bathrooms, Amenities sections with checkboxes
4. Apply / Reset buttons are presentational (no-op for now)
5. Close panel with ✕ or clicking outside
6. On mobile (<768px), panel should be a full-height slide-in from the right

---

## Principles Applied

- **YAGNI:** Checkboxes are presentational only — no state wiring yet
- **DRY:** Reuses existing header layout; CurrencySwitcher and PriceFilter untouched
- **Minimal:** One component, one CSS module, one header line added
