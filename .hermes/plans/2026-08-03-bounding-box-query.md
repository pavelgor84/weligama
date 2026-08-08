# Bounding Box Query Implementation Plan — Viewport-Aware Lazy Loading

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the broken initial-load (page=1 with world-wide bounds) and redundant paginated viewport fetches with a true bounding box query that only asks the DB for coordinates within the user's current viewport + padding, using region-level caching to skip queries when data is already loaded.

**Architecture:** 
- Remove the initial world-wide fetch entirely — start with an empty map
- When the map fires `onViewportReady` (or user pans/zooms), calculate a bounding box from the current viewport bounds expanded by 10% padding, then query DB for markers within that box only
- Cache fetched regions at the *rectangular region level* (not just individual IDs) so if the user pans slightly or re-zooms to a previously seen area, we skip the API call entirely and reuse client-side data
- Keep `loadedIdsRef` as a secondary dedup layer for within-batch de-duplication

**Tech Stack:** Next.js App Router, React hooks, MongoDB `$geoWithin/$box`, Maptiler JS SDK.

**Files affected:**
- `app/(home)/page.js` — data fetching logic (main changes)
- `components/map/map.js` — small change: add padding to viewport bounds before calling parent callback
- No changes needed for: `models/Restate.js`, `app/api/route.js`, `components/housesMenu/HousesMenu.js`

---

## Task 1: Add region-level cache to page.js

**Objective:** Replace the flat `loadedIdsRef` with a proper region cache that tracks which rectangular areas have already been fetched. This is the core optimization — it prevents redundant API calls when user pans within an already-loaded area.

**Files:**
- Modify: `app/(home)/page.js` lines ~80-85 (state/ref declarations)

**Step 1: Read current ref declarations.**

Lines 80-85 of `app/(home)/page.js`:
```javascript
  const loadedIdsRef = useRef(new Set())
  const viewportTimerRef = useRef(null)
  const currentFetchAbortRef = useRef(null)
```

**Step 2: Add region cache ref.**

Add a new ref for tracking cached rectangular regions:

```javascript
  // Ref to track all loaded property IDs globally — prevents duplicate merges into state.
  // Kept as a secondary dedup layer within-batch.
  const loadedIdsRef = useRef(new Set())
  
  // Region-level cache: tracks which bounding box areas have been fetched from DB.
  // Each entry is { west, south, east, north } (in degrees).
  // Before querying the API, we check if any cached region fully contains the requested viewport + padding.
  const cachedRegionsRef = useRef([])

  // Debounce timer for viewport changes — avoids spamming API during rapid panning/zooming
  const viewportTimerRef = useRef(null)
  // AbortController for cancelling in-flight viewport requests
  const currentFetchAbortRef = useRef(null)
```

**Step 3: Add region cache helper functions.**

Add these as module-level helpers inside the component (after state declarations, before `scrollToElement`):

```javascript
  /**
   * Check if a given bounding box is fully covered by any cached region.
   * @param {number} west - requested bounds
   * @param {number} south - requested bounds  
   * @param {number} east - requested bounds
   * @param {number} north - requested bounds
   * @returns {boolean} true if the box is already fully cached
   */
  function isRegionCached(west, south, east, north) {
    for (const region of cachedRegionsRef.current) {
      if (region.west <= west && 
          region.south <= south && 
          region.east >= east && 
          region.north >= north) {
        return true;
      }
    }
    return false;
  }

  /**
   * Add a new cached region, merging it with overlapping regions to keep the array compact.
   * Also removes regions that are fully contained within larger ones.
   */
  function cacheRegion(west, south, east, north) {
    const newRegions = [...cachedRegionsRef.current];

    // Try to merge with an existing overlapping region
    let merged = false;
    for (let i = 0; i < newRegions.length; i++) {
      const r = newRegions[i];
      if (!(r.east < west || r.west > east || r.north < south || r.south > north)) {
        // Overlaps — expand to cover both
        newRegions[i] = {
          west: Math.min(r.west, west),
          south: Math.min(r.south, south),
          east: Math.max(r.east, east),
          north: Math.max(r.north, north)
        };
        merged = true;
        break;
      }
    }

    if (!merged) {
      newRegions.push({ west, south, east, north });
    }

    // Clean up: remove regions fully contained within others to keep array small
    const cleaned = [];
    for (let i = 0; i < newRegions.length; i++) {
      let dominated = false;
      for (let j = 0; j < newRegions.length; j++) {
        if (i !== j) {
          const other = newRegions[j];
          if (other.west <= newRegions[i].west && 
              other.south <= newRegions[i].south && 
              other.east >= newRegions[i].east && 
              other.north >= newRegions[i].north) {
            dominated = true;
            break;
          }
        }
      }
      if (!dominated) cleaned.push(newRegions[i]);
    }

    cachedRegionsRef.current = cleaned;
  }
```

**Step 4: Verify.** Run `npx eslint app/(home)/page.js` to check for syntax errors. No test needed — this is just adding helper functions, no behavior change yet.

**Commit:** `git add -A && git commit -m "refactor: add region-level cache refs and helpers to page.js"`

---

## Task 2: Remove initial world-wide fetch + add initial viewport query

**Objective:** Delete the broken single-page world-wide fetch on mount. Instead, when the map first loads (fires `onViewportReady`), perform a bounding box query for that specific area only. This ensures users see markers relevant to their current view, not random page=1 results.

**Files:**
- Modify: `app/(home)/page.js` lines ~117-155 (initial fetch useEffect) and lines ~101-115 (`handleViewportReady`)

**Step 1: Remove the initial fetch.**

Delete the entire `useEffect` at lines 119-155. This is the broken code that only loads page=1 with world-wide bounds — it's been replaced by viewport-aware queries in Task 3.

Current code to remove (lines 117-155):
```javascript
  // Initial fetch: load all properties on mount so the map can render and marks can populate.
  // Use a very large bounding box to cover the entire world (approximate) — the API requires bbox params.
  useEffect(() => {
    const abortController = new AbortController();

    fetch(`/api?page=1&limit=50` +
      `&minLng=-180` +
      ...
    return () => abortController.abort();
  }, []); // Runs once on mount
```

**Step 2: Update handleViewportReady to trigger initial load.**

Replace the current `handleViewportReady` (lines 101-115) with a version that triggers an initial fetch when called for the first time, and skips redundant queries using the region cache.

New code:
```javascript
  function handleViewportReady(bounds) {
    const boundsObj = {
      west: bounds.getWest(),
      east: bounds.getEast(),
      south: bounds.getSouth(),
      north: bounds.getNorth()
    };
    setViewportBounds(boundsObj);

    // Only fetch if this viewport area hasn't been cached yet.
    // The 10% padding ensures markers near edges aren't clipped when user drags slightly.
    const PADDING = 0.1; // ~10% of typical viewport size in degrees for Sri Lanka
    const paddedWest = boundsObj.west - PADDING;
    const paddedSouth = boundsObj.south - PADDING;
    const paddedEast = boundsObj.east + PADDING;
    const paddedNorth = boundsObj.north + PADDING;

    if (!isRegionCached(paddedWest, paddedSouth, paddedEast, paddedNorth)) {
      debouncedViewportFetch(boundsObj);
    }
  }
```

**Step 3: Verify.** Run `npx eslint app/(home)/page.js`. The initial fetch useEffect is gone; handleViewportReady now triggers viewport-aware queries. No test needed yet — behavior change, but no new logic errors expected.

**Commit:** `git add -A && git commit -m "refactor: replace broken world-wide fetch with viewport-aware query"`

---

## Task 3: Replace fetchPaginated + debounced handler with unified viewport fetcher

**Objective:** Merge the old `fetchPaginated` function and the debounce useEffect into a single, clean `debouncedViewportFetch` function. This is the core bounding box query logic — it queries the DB for markers within the current viewport (with padding), deduplicates against both `loadedIdsRef` and cached regions, then merges new items into state.

**Files:**
- Modify: `app/(home)/page.js` lines ~163-262 (old fetchPaginated + debounce useEffect)

**Step 1: Delete old functions.**

Delete these two blocks entirely:
- `fetchPaginated` function (lines ~163-229) 
- The entire `useEffect` that calls `fetchPaginated` on viewport change (lines ~235-262)

**Step 2: Add new unified functions.**

Replace the deleted code with this:

```javascript
  /**
   * Fetch markers within a bounding box, paginating through all pages.
   * Deduplicates against loadedIdsRef and caches the region so future queries
   * that overlap don't re-fetch from DB.
   * 
   * IMPORTANT: All setAsset calls happen AFTER the loop completes to avoid
   * React state batching overwriting intermediate pages' data.
   */
  async function fetchWithinBounds(bounds, abortSignal) {
    let page = 1;
    const limit = 50;
    const allNewItems = [];

    while (true) {
      if (abortSignal?.aborted) break;

      const url = `/api?page=${page}&limit=${limit}` +
        `&minLng=${bounds.west}` +
        `&maxLng=${bounds.east}` +
        `&minLat=${bounds.south}` +
        `&maxLat=${bounds.north}`;

      try {
        const response = await fetch(url, { signal: abortSignal });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const json = await response.json();
        const items = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);

        let pageNewItems = [];
        for (const item of items) {
          if (!loadedIdsRef.current.has(item._id)) {
            loadedIdsRef.current.add(item._id);
            pageNewItems.push(item);
          }
        }
        allNewItems.push(...pageNewItems);

        // Termination: API returns fewer items than requested (or zero)
        if (items.length === 0 || items.length < limit) break;
        page++;
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Bounding-box fetch error:', error);
        break;
      }
    }

    // Cache this region so future overlapping queries skip the DB
    cacheRegion(bounds.west, bounds.south, bounds.east, bounds.north);

    // ONE setAsset call after the loop
    if (allNewItems.length > 0) {
      console.log(`[BBQ] Loaded ${allNewItems.length} new items for viewport (${bounds.west.toFixed(2)},${bounds.south.toFixed(2)})-(${bounds.east.toFixed(2)},${bounds.north.toFixed(2)}), total state:`, allNewItems.length > 0 ? loadedIdsRef.current.size : 'no change');
      setAsset(prev => prev.concat(allNewItems));
    }
  }

  /**
   * Debounced viewport-change handler.
   * Waits for the user to stop panning/zooming before triggering API fetches.
   */
  function debouncedViewportFetch(bounds) {
    // Cancel any in-flight request from a previous viewport state
    if (currentFetchAbortRef.current) {
      currentFetchAbortRef.current.abort();
    }
    const abortController = new AbortController();
    currentFetchAbortRef.current = abortController;

    if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    viewportTimerRef.current = setTimeout(() => {
      fetchWithinBounds(bounds, abortController.signal).catch((err) => {
        if (!abortSignalIsAborted(err)) console.error('Viewport fetch error:', err);
      });
    }, 500);

    function abortSignalIsAborted(error) {
      return error && error.name === 'AbortError';
    }

    return () => {
      clearTimeout(viewportTimerRef.current);
      abortController.abort();
    };
  }
```

**Step 3: Remove the old debounce useEffect entirely.** 

The `debouncedViewportFetch` is now a plain function called directly from `handleViewportReady`. The old useEffect (lines ~235-261) that wrapped it is no longer needed — we removed it in Step 1.

Wait, I need to re-examine this. The original code had the debounce inside a useEffect with `[viewportBounds]` as dependency. But now `handleViewportReady` calls `debouncedViewportFetch` directly (not through React state). So there's no useEffect needed for the viewport handler anymore — it's all imperative in `handleViewportReady`.

**Step 4: Verify.** Run `npx eslint app/(home)/page.js`. Check that:
- No references to old `fetchPaginated` function remain
- No stale useEffect with `[viewportBounds]` dependency remains  
- All variable names resolve correctly (`cachedRegionsRef`, `isRegionCached`, `cacheRegion`)

**Commit:** `git add -A && git commit -m "feat: implement viewport-aware bounding box query with region caching"`

---

## Task 4: Update marks conversion and cleanup diagnostic logs

**Objective:** Clean up investigation console.log statements, simplify the coordinate parsing logic (no longer needed to handle string coordinates since API returns consistent format), and ensure the map renders correctly from empty initial state.

**Files:**
- Modify: `app/(home)/page.js` lines ~17-49 (`updateMarks`) and lines ~264-309 (`marks` conversion)

**Step 1: Simplify updateMarks.**

The current `updateMarks` function (lines 17-48) handles both string `"lat, lng"` AND array `[lng, lat]` coordinate formats. Since the API always returns `{ coordinates: [lng, lat], _id, price }`, we can simplify but must keep backward compatibility for any admin-created entries with string coordinates.

Keep the existing logic as-is — it already handles both formats correctly. Just remove the debug `console.log(coords)` at line 46 and change to a more useful log:

Change line 46 from:
```javascript
    console.log(coords)
```
To:
```javascript
    setNav((prev) => ({ ...coords, positions: coords.positions.length > 0 ? coords.positions : prev.positions }));
```

Actually, no — don't change the logic. Just remove investigation logs and keep the function working as-is. Remove line 46's `console.log(coords)` entirely (it was added during debugging).

**Step 2: Clean up coordinate conversion in marks.**

Lines ~270-309 convert coordinates for MapTiler GeoJSON format. The current code handles both string and array formats with complex fallback logic. Keep it as-is but clean up the investigation `console.warn` statements added earlier:
- Remove all `[MARKS-CONVERT]` console.warn lines
- Keep only a summary count at the end

**Step 3: Ensure empty initial state renders gracefully.**

The map currently shows "Loading..." when `nav.positions.length === 0` (line ~335). Since we no longer load anything on mount, this will be true initially. After the first viewport query completes and items are merged into `asset`, `updateMarks` runs and populates `nav.positions`. This flow is unchanged — no code change needed here.

**Step 4: Verify.** Run `npx eslint app/(home)/page.js`. Check that all investigation logs (`[INIT-FETCH]`, `[VIEWPORT-READY]`, `[DEBOUNCE-*]`, `[ASSET-CHANGE]`) have been removed or simplified.

**Commit:** `git add -A && git commit -m "chore: clean up diagnostic console.log statements"`

---

## Task 5: Verify end-to-end

**Objective:** Confirm the bounding box query works correctly — map starts empty, populates as user pans/zooms, shows more markers when zooming out (larger viewport = more DB matches), skips redundant queries.

**Steps:**

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser to home page.** Observe:
   - Map loads with initial center on Weligama, showing "Loading..." briefly
   - After ~500ms debounce, markers in the initial viewport appear (likely 5-15 properties around Weligama)
   - Check console for `[BBQ]` log lines showing how many items were loaded

3. **Zoom out** to see all of Sri Lanka:
   - New bounding box is much larger → DB returns more markers (should be 300+)
   - Map updates with new markers appearing across the island
   - Check console for `[BBQ]` log showing large batch load

4. **Pan around** at high zoom level:
   - As you pan to new areas, small batches of new markers appear (2-10)
   - Re-panning over already-seen areas produces NO `[BBQ]` logs — region cache is working!

5. **Zoom out again** to Sri Lanka view:
   - Should see ALL previously loaded markers (they're cached in client state)
   - No redundant API calls since the larger viewport was likely covered by merged regions

6. **Run lint:**
   ```bash
   npm run lint
   ```

7. **Run build:**
   ```bash
   npm run build
   ```

---

## Summary of Changes

| File | Change | Lines affected |
|------|--------|----------------|
| `app/(home)/page.js` | Add region cache refs + helper functions (`isRegionCached`, `cacheRegion`) | ~40 lines added |
| `app/(home)/page.js` | Remove broken initial world-wide fetch (lines 119-155) | ~37 lines removed |
| `app/(home)/page.js` | Replace handleViewportReady to trigger viewport-aware query with padding | ~20 lines changed |
| `app/(home)/page.js` | Replace old fetchPaginated + debounce useEffect with unified debouncedViewportFetch + fetchWithinBounds | ~100 lines rewritten |
| `app/(home)/page.js` | Clean up investigation console.log statements | minor cleanup |

**What stays the same:**
- Maptiler SDK rendering in `map.js` — already handles viewport-aware feature display via `queryRenderedFeatures` + `splitPoints`
- API route `app/api/route.js` — already supports `$geoWithin/$box`, no changes needed
- HousesMenu, MapContext, marker components — no changes needed

**Key behavior differences from current:**
1. **No more broken initial load** — world-wide page=1 is gone; map starts empty and populates based on actual viewport
2. **True bounding box queries** — DB only receives coordinates for what's visible + 10% padding, not random pagination offsets
3. **Region-level caching** — panning within a previously-seen area skips the API entirely instead of making redundant calls that return duplicate IDs
4. **Zoom-out shows more markers** — larger viewport = wider bounding box = more DB matches, so markers fill in as user zooms out (this is the correct behavior)
