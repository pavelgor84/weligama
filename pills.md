

Here's what I found in the current header:

- app/header.js renders, in order: CurrencySwitcher, PriceFilter, AmenityFilter, then a centered .title block.
- All three controls are position:absolute inside the sticky .container, so DOM order doesn't drive layout — their CSS
 does.
- CurrencySwitcher: top-right (top:14px; right:16px).
- PriceFilter: bottom-left (left:16px; bottom:12px) — a pill button that opens a slider panel downward.
- AmenityFilter: bottom, to the right of price (left:170px; bottom:12px) — a pill button that toggles a panel containi
ng the horizontal scroll row of pills. That's the "press a button first" behavior you want gone.
- Header .container: desktop height:30%, mobile (≤768px) height:10% with padding 0 and the title hidden. So on mobile
it's a thin ~84px bar.

PLAN

1. Amenities → always-visible pill row (all viewports)
   - components/amenityFilter/AmenityFilter.js: delete the toggle button + open state + panel wrapper. Render the .scr
ollRow of pills directly, always mounted. Keep Reset as a small inline control appended at the end of the scroll row s
o it stays reachable.
   - components/amenityFilter/AmenityFilter.module.css: drop .button / .arrow / .panel / .label; keep .scrollRow, .tag
, .tagSelected, .reset. Reposition .wrap to sit below the price filter as a full-width horizontal strip (left:16px; ri
ght:16px; top:<just under the price pill>), overflow-x:auto with the existing hidden-scrollbar + edge-fade.

2. Price filter → top-left corner
   - components/priceFilter/PriceFilter.module.css: change .wrap from left:16px; bottom:12px to top:14px; left:16px. I
ts panel already opens downward (top:calc(100%+10px)), so it'll drop below the button — no other change needed.

3. Unwrapped amenities placed below the price filter
   - Handled by item 1's .wrap positioning (directly under the top-left price pill).

4. Mobile header +20%
   - components/header/header.module.css, @media (max-width:768px): bump .container height from 10% to 12% so the stac
ked price-button + pill-row fits.

Two things I need you to confirm before I touch anything:

A) "Make header wider by 20%" — the header is already 100% wide on mobile, so there's no horizontal room to gain. I'm
reading this as making the mobile header bar 20% TALLER (height 10% → 12%) so the new stacked filter layout fits. Is t
hat what you mean?

B) Scope of the repositioning — should "price to top-left + amenities row below it" apply on desktop too, or only on m
obile?
   - On desktop the header is tall (30%) with a centered 400px title card. Moving price/amenities to the top-left ther
e means I'd also nudge the title down so they don't overlap.
   - My default: apply the new top-left layout on BOTH desktop and mobile (shifting the desktop title down to make roo
m), since you didn't scope it to mobile. Say the word if you'd rather keep desktop as-is and only restyle mobile.

Confirm A (and B if you disagree with my default) and I'll back up each file (.bak) and make the edits, then run npm r
un build + npm run lint to verify.
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
────────────────────────────────────────

● [IMPORTANT: Background process proc_c2da5bf20664 matched watch pattern "Ready in".
Command: cd /home/kali/Documents/weligama && npm run dev
Matched output:
 ✓ Ready in 1606ms]
────────────────────────────────────────


╭─ ⚕ Hermes ─────────────────────────────────────────────────────────────────────────────────────────────────────────╮
That's just the dev server's "Ready in 1606ms" notification arriving late — it was already up, nothing new.

Still waiting on your call for the two open points from the plan:

A) "Wider by 20%" → I'll read this as mobile header bar height +20% (10% → 12%), since the header is already full-widt
h horizontally. OK?

B) New top-left price + amenities-below layout on both desktop and mobile (my default), or mobile only?

Reply "A yes, B both" (or whatever you prefer) and I'll back up the files and start editing.
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
────────────────────────────────────────


● for mobile only
────────────────────────────────────────

 ⚕ qwen3.8-27b │ 47.9K/66K │ [███████░░░] 73% │ ◷ 302.3s │ ↑ 4 t/s │ ⚙ 2 │ 12h 33m │ . ─ Plan Weligama header filt...
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
⚕ ❯ msg=interrupt · /queue · /bg · /steer · Ctrl+C cancel
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

