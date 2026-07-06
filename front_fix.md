# Frontend Architecture Analysis - (home)/page.js

## Executive Summary
The main page serves as the landing page showing properties on a map with sidebar listing. The architecture has several critical issues in data flow, state management, and component communication.

---

## 1. Imports Analysis

### ✅ Valid Imports:
```javascript
"use client"          // Required for useState/useEffect hooks (Client Components)
import { useEffect, useState, useMemo } from 'react'    // ✅ Standard React hooks
import styles from '../page.module.css'                  // ✅ CSS Modules import
import Map from '@/components/map/map'                   // ✅ Component import
import HousesMenu from '@/components/housesMenu/HousesMenu'  // ✅ Component import
import { MapContext } from '../context/MapContext'       // ✅ Context import
```

### ⚠️ Issues Found:


## 2. Data Flow Analysis

### Current Architecture:
```
Database (Restate) 
    ↓ GET /api
Response JSON → asset[] state
    ↓ useMemo transform
marks[] (GeoJSON features)
    ↓ props to Map component
Map renders markers on map

changePoints (delta updates)
    ↓ props to HousesMenu
HousesMenu fetches new cards via axios.post('/api/get_more_houses')
```

---

## 3. Component Props Analysis

### HousesMenu Props (Line 117)
```javascript
<HousesMenu 
    cards={changePoints} 
    handleOver={handleOver} 
    handleLeave={handleLeave} 
    s />  // ❌ Unknown prop 's' passed!
```

**Issues:**
1. ❌ **Prop typo**: `s` is not defined anywhere - likely a copy-paste error or incomplete refactoring
2. ⚠️ **Cards as delta updates**: `changePoints` contains `{ stay: [], add: [], del: [] }` - component must fetch new data for `add` items

**Analysis of changePoints flow:**
```javascript
// Map component (map.js) generates changePoints via splitPoints() function
setchangePoints({ stay, add, del })  // Delta updates
```

**HousesMenu receives and handles:**
- ✅ `stay`: Keep existing cards (already in state)
- ❌ `add`: Must fetch NEW cards via axios.post('/api/get_more_houses')
- ✅ `del`: Filter out deleted items from state

**Potential Issue:** If `get_more_houses` fails or returns stale data, UI will be inconsistent.

---

### Map Component Props (Line 122)
```javascript
<Map 
    clearId={setId} 
    setchangePoints={setchangePoints} 
    centerZoom={nav.currentPoint} 
    coords={marks} 
    pointId={id} 
    scroll_to={scrollToElement} 
    html_popup={popup} 
/>
```

**Prop Analysis:**

| Prop | Type | Purpose | Issue? |
|------|------|---------|--------|
| `clearId` | Function `(sid) => void` | Clears selected property ID when leaving viewport | ✅ OK |
| `setchangePoints` | Function | Receives delta updates from map | ⚠️ Should be debounced (300ms recommended)|
| `coords` | FeatureCollection | GeoJSON coordinates for markers | ✅ OK |
| `pointId` | String | Currently selected property ID (for highlighting) | ✅ OK |

**Critical Issues:**


---

## 4. State Management Issues

### Issue 4.1: Multiple Unconnected States
```javascript
const [asset, setAsset] = useState([])           // Full dataset
const [nav, setNav] = useState({ positions: [], currentPoint: '' })  // Map coords
const [id, setId] = useState('')                    // Selected ID
const [popup, setPopup] = useState('')             // Popup content (unused!)
const [changePoints, setchangePoints] = useState('')  // Delta updates
const [scrollTo, setScrollTo] = useState('')       // Target for scrolling
```

**Issue:** No centralized state - each piece operates independently with no synchronization.

---

### Issue 4.2: Context Misuse
```javascript
// Line 63-68
const contextValue = useMemo(() => ({
    scrollTo,        // ❌ Exposed function that modifies parent state
    setScrollTo      // ❌ Another state modifier exposed to child components
}), [scrollTo]);
```

**Problem:** 
- Context is designed for **read-only data sharing**, not state mutation
- `HousesMenu` receives context but calls `setScrollTo(id)` which modifies parent state
- This creates tight coupling - HousesMenu must know about and modify Home's internal state

---

### Issue 4.3: Race Condition in scrollToElement()
```javascript
// Line 73-76
const scrollToElement = (id) => {
    setScrollTo(id);  // Sets target ID
};
```

**Flow:**
1. `scroll_to={scrollToElement}` passed to Map component  
2. User hovers over property → `handleOver()` called
3. `setScrollTo('')` called (line 43) - **clears scroll target!**
4. Then `scroll_toElement(id)` should be called...

**Issue:** The flow is confusing and `setScrollTo('')` in handleOver() seems intentional to prevent clearing selection, but creates race condition with HouseMenu's scrollTo logic.

---

## 5. Event Handler Issues

### handleLeave(e) - Line 33
```javascript
function handleLeave(e) {
    console.log('leave');
    setId(false);           // ❌ Sets ID to false (falsy string?) instead of empty string
    setScrollTo('');        // Clears scroll target
}
```

**Issues:**
1. `setId(false)` - should be `setId('')` for consistent state type
2. No cleanup logic if component unmounts during hover

---

### handleOver(property_id) - Line 40
```javascript
function handleOver(property_id) {
    setId(property_id);              // ✅ Sets selected ID
    setScrollTo('');                 // ❌ Clears scroll target immediately!
}
```

**Critical Issue:** Setting `scrollTo = ''` here means:
- If user hovers over multiple properties rapidly, previous scroll targets are cleared
- Race condition between hover and click events

---

## 6. Component Lifecycle Issues

### Missing Cleanup for useEffect (Line 78-82)
```javascript
useEffect(() => {
    fetch('/api')
        .then((response) => response.json())
        .then((json) => setAsset(json))
}, []);
```

**Issue:** No error handling or cleanup if component unmounts during fetch.

---

### Issue 6.1: useEffect Dependent on asset but updateMarks() called separately (Line 84-86)
```javascript
useEffect(() => {
    updateMarks();
}, [asset]);
```

**Problem:** Creates infinite loop risk if `updateMarks()` indirectly causes state changes that trigger asset updates.

---

## Summary of Critical Frontend Issues

### Architecture Level:
1. ❌ **No centralized state management** - Multiple disconnected states with no coordination
2. ❌ **Context misused for state mutation** instead of read-only data sharing
3. ❌ **Tight coupling** between components via callback props (Home must expose setScrollTo)

### Data Flow Issues:
4. ❌ **Inefficient coordinate transformation** - String parsing every render
5. ❌ **Empty centerZoom prop** - Map doesn't know where to focus after selection
6. ❌ **Popup system broken** - `html_popup` passed but no handler or popup component

### State Management Issues:
7. ❌ **Multiple unconnected states**: asset, nav, id, popup, changePoints, scrollTo
8. ❌ **Context exposing state mutation functions** (scrollTo, setScrollTo)
9. ❌ **No error handling** in async operations

### Component Communication Issues:
10. ❌ **Prop typo** - `s` prop passed to HousesMenu undefined
11. ❌ **Race conditions** in scroll target management
12. ❌ **Inefficient data transformation** - String parsing every render

---

## Recommendations Summary

| Priority | Issue | Solution |
|----------|-------|----------|
| 1️⃣ | Empty centerZoom prop | Add map focus logic when property selected |
| 2️⃣ | Popup system broken | Implement popup handler + popup component mount |
| 3️⃣ | Inefficient coordinate parsing | Pre-transform coords in useEffect, store as array |
| 4️⃣ | Context state mutation | Pass scroll target as prop instead of function |
| 5️⃣ | Multiple disconnected states | Consider Zustand/Recoil for global state |
| 6️⃣ | Race conditions in scrolling | Debounce scroll requests, use requestAnimationFrame |
| 7️⃣ | Prop typo `s` | Remove undefined prop from HousesMenu call |

The frontend needs a complete refactor to establish proper data flow patterns and eliminate race conditions.
