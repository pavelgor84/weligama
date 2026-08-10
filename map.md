# Performance Analysis Report — Weligama Map Component

## 1. map.js — Main Map Component (Worst offender)

### P1 — `map.current.on('render', afterChangeComplete)` fires at 60fps (line 181)
The `'render'` event in Maptiler fires on every frame during rendering. Even though `afterChangeComplete` removes itself, the event listener is registered inside the 'load' callback and fires continuously until the first render cycle completes. This creates massive CPU overhead.


### P2 — Coordinate parsing runs on every render for every house (page.js lines 274-309)
```js
const marks = Array.isArray(asset) 
    ? asset.map((prop, index) => { ... parse coordinates each time ... })
```
Every re-render of page.js reparses ALL coordinate strings and reverses arrays for EVERY property. This should be in useMemo since it only needs to recompute when `asset` changes.

### P2 — `handleViewportMove` defined inside effect callback (lines 159-173)
This function is recreated every time the map 'load' event fires. It could be hoisted outside using useCallback or a ref pattern, though this is minor.

---

## 2. marker.js — Individual Marker Component

### P0 — CRITICAL: One Maptiler Marker instance per feature (line 19)
```js
markerRef.current = new maptilersdk.Marker({ element: contentRef.current })
    .setLngLat([geometry.coordinates[0], geometry.coordinates[1]])
    .addTo(map)
```
Every marker creates a DOM element + Maptiler Marker wrapper. With 50-200 markers visible, this means 50-200 DOM nodes with event handlers each. The `useEffect` has `[]` deps but references changing values (`map`, `feature`). React will still recreate the Marker on every render because `map.current` is a ref that technically changes identity across renders.

### P1 — Inline styles recreated on every render (lines 32-45, 57-70)
The style objects are constructed fresh every render for every marker. Should be extracted to constants or use CSS classes.

---

## 3. page.js — Parent Page Component

### P1 — O(n²) region cache cleanup in `cacheRegion` (lines 126-144)
```js
for (let i = 0; i < newRegions.length; i++) {
    for (let j = 0; j < newRegions.length; j++) { ... }
}
```
Every call to `cacheRegion` does O(n²) comparison. As the user pans around more, `cachedRegionsRef.current` grows. This is called on every viewport change that crosses a cached boundary. After 50 panned areas this becomes noticeable. Consider using spatial indexing (quadtree/R-tree) or simply capping to N most recent regions.

### P2 — `updateMarks()` called in useEffect on every asset change (line 269-271)
```js
useEffect(() => { updateMarks() }, [asset]);
```
This is fine functionally but `updateMarks` is recreated every render and could be extracted or memoized.

### P2 — `contextValue` useMemo depends on `setScrollTo` (line 149-153)
```js
const contextValue = useMemo(() => ({ scrollTo, setScrollTo, viewportBounds }), [scrollTo, viewportBounds]);
```
Including `setScrollTo` in the memo means context changes every render since it's a stable function reference but still adds overhead. More importantly, `setScrollTo` should NOT be in context — only state values need to be; setters are already stable via closure.

---

## 4. HousesMenu.js

### P1 — Scroll logic runs on EVERY render unconditionally (lines 32-44)
```js
if (scrollTo !== null && itemRef.current.length != 0) {
    if (scrollTo !== selectedRef.current) { ... }
}
```
`scrollTo` is initialized as `''` (empty string), so `scrollTo !== null` is ALWAYS true. This DOM traversal and scrollIntoView runs on every single render of the component, not just when scrollTo actually changes. Should be in a useEffect with `[scrollTo]` dependency.

### P1 — Direct DOM ref mutation instead of React refs (lines 48-52)
```js
const addToRefs = (el) => {
    if (el && !itemRef.current.includes(el)) {
        itemRef.current.push(el);
    }
};
```
Using an array as a ref and pushing DOM nodes directly. This bypasses React's reconciliation for refs, which can cause issues with SSR and concurrent mode. Should use `useRef([])` properly or a Map keyed by element ID.

### P1 — API call in HousesMenu even when data already available (line 72-98)
`getNewCards()` calls `/api/get_more_houses` POST for every add operation, even though the full property data might already be in `asset` state from the viewport fetch. This is a separate unnecessary network request per batch of viewport changes.

---

## 5. route.js — API Endpoint

### P2 — No server-side caching
```js
const data = await Restate.find(filter, projection).skip(skip).limit(limit).exec()
```
Identical bounding box queries hit MongoDB every time. A simple Redis or in-memory LRU cache keyed on the bounds hash would eliminate duplicate DB hits for overlapping viewports.

### P2 — `countDocuments` called but result unused (line 39)
```js
const total = await Restate.countDocuments(filter)
return NextResponse.json({ data, total, page })
```
The client never uses `total`. This is a wasted aggregation query on every request.

---

## Summary — Top 5 Impact Issues to Fix First

1. **`splitPoints` O(n^2) -> use Set** (affects every pan/zoom event)
2. **Map destroy/rebuild on zoom change -> use `setZoom()`** (extremely expensive WebGL tear-down)
3. **Coordinate parsing in page.js render -> wrap in useMemo** (runs 50-200 times per re-render)
4. **`geo` object in map.js -> wrap in useMemo** (creates new FeatureCollection every render, triggers downstream unnecessary work)
5. **Remove `countDocuments` from API route** (wasted DB query with no client-side consumer)
