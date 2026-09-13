# Amenities Filter — Plan (v2, verified against code + live DB)

## Verdict on the original plan
The original draft had the right skeleton (FilterContext state → header UI →
whitelisted API params → page re-fetch), but 5 problems made it not implementable as written:

1. **Tag source was wrong.** `defaultPropertyState.js` contains only DEFAULTS
   (`view: ''`, `ac: false`, ...) — there are no values to "extract". Live DB check
   (506 docs): `view` is free text with 14 distinct values: Lake, Lagoon, City,
   Mountain, River, Ocean, Forest, Sunset, Garden, Beach + dirty data ("1", "Road",
   "street", "garden"). → Decision: static curated tag list (12 tags) in a shared
   config file; `view` matched case-insensitively (`$in` + `options:'i'`) so the
   stray lowercase "garden" still matches.
2. **API projection gap.** `/api/route.js` projects only `{coordinates, _id, price}`.
   Client-side amenity gating needs `ac`, `parking`, `view` in the response. → Add
   to projection.
3. **Stale region cache.** page.js caches fetched bounding boxes in
   `cachedRegionsRef`; a filter change would make those regions stale (they were
   fetched without the new params) and the cache check would skip re-fetches. → On
   ANY filter change: clear `loadedIdsRef` + `cachedRegionsRef`, then refetch the
   current viewport (same pattern as the existing maxPrice raise effect, extended).
4. **UI mismatch.** The draft put all tags inside a dropdown panel; the requirement
   is a scrollable line of options next to PriceFilter on the same row. → Tags row
   lives in the opened panel as a single horizontal strip with hidden scrollbar and
   edge fade (overflow-x: auto, flex-nowrap, touch scroll) — the "invisible
   boundaries" behavior requested.
5. **`available` is not an amenity.** The route hard-codes `available: true`; it
   must not be a filter tag.

## Design
- **State**: `FilterContext` gains `selectedAmenities` (array of tag ids) +
  `toggleAmenity(id)` + `resetAmenities()`.
- **Tags** (single source: `components/amenityFilter/amenityTags.js`):
  - booleans: `ac` → "A/C", `parking` → "Parking"
  - view: Ocean, Beach, Lake, Lagoon, City, Mountain, River, Forest, Sunset, Garden
- **URL params** (whitelisted in `utils/filters.js`, already generic in route.js —
  the route needs no param-parsing changes): `ac=true&parking=true&view=Ocean,City`
- **Server**: whitelist entries `ac`/`parking` (boolean eq), `view` (string `$in`).
- **Client gating**: `marks` memo also filters by selected amenities (instant UI,
  same pattern as the price gate). Refetch is debounced via the existing
  `debouncedViewportFetch`.
- **Header**: `<AmenityFilter />` rendered next to `<PriceFilter />` in header.js;
  both pills sit on the same bottom row of the header (absolute positioning,
  left: 16px / 170px).

## File changes
| Action | File | What |
|---|---|---|
| Create | `components/amenityFilter/amenityTags.js` | Tag list + params builder + client matcher |
| Create | `components/amenityFilter/AmenityFilter.js` | Pill button + panel with horizontal scroll tag row |
| Create | `components/amenityFilter/AmenityFilter.module.css` | Styles (matches PriceFilter pill, hidden scrollbar, fade) |
| Modify | `app/context/FilterContext.js` | amenities state + toggle/reset |
| Modify | `app/header.js` | render AmenityFilter next to PriceFilter |
| Modify | `utils/filters.js` | whitelist: ac, parking (boolean), view ($in, case-insensitive) |
| Modify | `app/api/route.js` | projection += ac, parking, view |
| Modify | `app/(home)/page.js` | append amenity params to fetch URL; client gate in marks memo; refetch effect on filter change (clears caches) |

## Testing
1. `npx next build` — clean compile.
2. Live API: `/api?...&view=Ocean` → 50 docs; `&parking=true` → 3; combined with
   maxPrice works.
3. UI: pills on one row; panel opens; tags scroll horizontally; toggling updates
   markers + sidebar; reset restores.
