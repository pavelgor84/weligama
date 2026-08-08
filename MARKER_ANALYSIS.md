# Marker Pagination Bug Analysis Report

## Problem Statement
500 markers exist in MongoDB but only ~50 are visible on the map when zoomed out to view all of Sri Lanka. In a previous version, more markers were shown.

## Data Flow Summary
1. Home page mounts -> fetches /api?page=1&limit=50 with world-wide bbox (-180..180)
2. API paginates through ALL pages until items.length < limit (should load all 500)
3. On viewport change, debounced fetch re-queries /api using current viewport bounds only
4. Map renders all markers from `asset` state as GeoJSON source

## Root Causes Identified (Ranked by Severity)

### CRITICAL: ViewportBounds Overwrites Initial Fetch — Most Likely Cause

**Location:** `/home/kali/Documents/weligama/app/(home)/page.js`, lines 101-241

The initial fetch loads all 500 properties with world-wide bounds. Then `handleViewportReady` (line 101) is called by Map on load, setting `viewportBounds` to a small region around where the 50 initial markers are clustered. This triggers a NEW paginated fetch using only that small bounding box.

The new fetch returns ~50 items within that small box. Since all IDs from the initial load are already in `loadedIdsRef`, most or all of these are deduplicated away, leaving zero or very few new items merged into state. The map is then re-rendered with a GeoJSON source containing only items visible in the small viewport area — NOT the full 500 markers scattered across Sri Lanka.

**Why you see fewer markers when zooming out:**
- After panning to a different part of the island, `viewportBounds` updates to that new region
- The debounced fetch runs with the NEW (still small) bounding box
- Only markers within that narrow viewport area are returned and processed
- Markers outside the current view bounds never get re-added because they were already in `loadedIdsRef` from the initial load but their data is effectively "lost" when the map re-renders with only viewport-visible items

**Evidence:** The Map component (line 386) iterates over `geo.features` to render markers. If `marks` array (derived from `asset`) was truncated by a failed viewport update, only those features appear — regardless of what's actually in the database.

### HIGH: Server-Side GeoQuery Fails for String Coordinates

**Location:** `/home/kali/Documents/weligama/app/api/route.js`, line 27-31
**Database schema:** `/home/kali/Documents/weligama/models/Restate.js`, line 7

The database stores coordinates as `[Number, Number]` (GeoJSON array format). However, the home page also parses from string format "lat, lng" (line 34 in page.js: `el.coordinates.split(',')`). If ANY property has coordinates stored as a string instead of an array, MongoDB's `$geoWithin: {$box}` query will silently skip it.

The server-side projection only returns `{coordinates: 1, _id: 1, price: 1}` (line 34) — no `name`, `images`, or other fields that would help verify what was actually returned.

### MEDIUM: Map GeoJSON Source Only Contains Viewport-Visible Features

**Location:** `/home/kali/Documents/weligama/components/map/map.js`, lines 104-108, 386

The map's GeoJSON source (`marks`) is built from the `coords` prop. The Map component then:
1. Adds GeoJSON source with all coords (line 104)
2. On viewport change, queries rendered features (line 228-233)
3. Splits into stay/add/del sets and calls `setchangePoints`

But the marker rendering (lines 386-407) only renders markers that are in `lastPoints.current`. If a feature is not query-rendered (outside viewport), it gets marked with `viewport={false}` — showing as "..." instead of price. This means off-screen markers are visually present but non-functional.

### MEDIUM: Debounced Refetch Overwrites State During Rapid Movement

**Location:** `/home/kali/Documents/weligama/app/(home)/page.js`, lines 215-241

When the user pans/zooms rapidly, multiple viewport change events fire. Each triggers a new `fetchPaginated` call with its own AbortController. If an earlier (wider bounds) fetch completes AFTER a later (narrower bounds) fetch, it could:
- Return items from a wider area
- But those items might not be properly merged if `allNewItems` was processed by the narrower fetch first

The abort mechanism cancels in-flight requests, but the debounced 500ms delay means multiple rapid changes can still cause race conditions.

### LOW: Limit of 50 Per Page May Be Too Small for Sparse Distribution

**Location:** `/home/kali/Documents/weligama/app/api/route.js`, line 19

With 500 markers spread across Sri Lanka (~65,610 sq km), a limit of 50 per page means at least 10 pages to load everything. If any page returns overlapping IDs (due to MongoDB query ordering instability with `$geoWithin` + pagination), the total unique items loaded could be less than expected.

## Recommended Fix

**Primary fix:** Remove viewport-based API fetching entirely. Load all properties once on mount and render them client-side:
- The initial world-wide fetch already queries everything (bbox -180 to 180)
- `fetchPaginated` with increasing page numbers should exhaust all results  
- After loading, disable further viewport-triggered refetches
- All 500 markers will be in the `asset` state and render on the map regardless of viewport

**Alternative (if API load is a concern):** Keep viewport-based fetching but maintain "max bounds seen" across all viewport changes — never shrink the bounding box used for queries.

## Suggested Diagnostic Console.log Additions

Add these console.logs to verify the theories:

### In app/(home)/page.js — Initial fetch (around line 134):
```javascript
console.log('[INIT-FETCH] Loaded', items.length, 'items from initial world-wide query');
console.log('[INIT-FETCH] Total in DB:', json.total); // if API returns total field
```

### In app/(home)/page.js — fetchPaginated (around line 187):
```javascript
console.log('[PAGINATE] Page', page, ': fetched', items.length, 'items,', 
            pageNewItems.length, 'new (after dedup),',
            'total loaded:', loadedIdsRef.current.size);
if (allNewItems.length > 0) {
    console.log('[PAGINATE] Merging', allNewItems.length, 'total new items into asset state');
}
```

### In app/(home)/page.js — handleViewportReady (around line 108):
```javascript
console.log('[VIEWPORT] Bounds updated:', { west: bounds.getWest(), east: bounds.getEast(), south: bounds.getSouth(), north: bounds.getNorth() });
console.log('[VIEWPORT] Asset count at this point:', asset.length); // will show stale value due to async
```

### In components/map/map.js — getCurrentPoints (around line 231):
```javascript
function getCurrentPoints() {
    const allfeatures = getRenderedFeatures();
    console.log('[MAP-RENDER] Rendered features in viewport:', allfeatures.length, 'total map features:', geo?.features?.length);
}
```

### In components/map/map.js — splitPoints (around line 256):
```javascript
function splitPoints(newPoints) {
    // ... existing code ...
    console.log('[SPLIT] stay:', stayAdd.length, 'add:', freshPoints.length - stayAdd.length, 'del:', prevPoints.length - stayAdd.length);
}
```

### In app/api/route.js — GET handler (after line 37):
```javascript
console.log('[API-QUERY] Filter:', JSON.stringify(filter), '| page:', page, '| limit:', limit, '| returned:', data.length, '| total matching:', total);
```
