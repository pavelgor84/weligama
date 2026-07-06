"use client"

//import Image from 'next/image'
import { useEffect, useState, useMemo } from 'react'
import styles from '../page.module.css'


import Map from '@/components/map/map'
//import Link from 'next/link'

import HousesMenu from '@/components/housesMenu/HousesMenu'
import { MapContext } from '../context/MapContext'


export default function Home() {

  function updateMarks() {
    // Prevent "Cannot read properties of undefined (reading 'forEach')" error
    if (!Array.isArray(asset)) {
      console.warn('asset is not an array, skipping updateMarks');
      return;
    }
    
    const coords = {
      positions: [],
      currentPoint: ''
    }
    //console.log(asset)
    asset.forEach((el) => {
      // Parse coordinates - handles both user-friendly string "lat, lng" AND GeoJSON array [lng, lat] formats
      let coordArr;

      if (typeof el.coordinates === 'string') {
        // User-friendly format from adminEdit.js: "lat, lng"
        coordArr = el.coordinates.split(',').map(x => +x);
      } else if (Array.isArray(el.coordinates)) {
        // GeoJSON array format [lng, lat] - just use as-is for nav positions
        coordArr = el.coordinates;
      } else {
        console.error('Invalid coordinates format:', el._id, typeof el.coordinates, el.coordinates);
        return;
      }

      coords.positions.push(coordArr);
    })
    console.log(coords)
    setNav((prev) => coords)

  }
  function handleLeave(e) {
    //console.log('leave')
    setId(false)
    setScrollTo('') //prevent pass targetId to houseMenu for preventing clear selection

  }

  function handleOver(property_id) { // handle marker for the map
    //e.preventDefault()
    setId(property_id)
    setScrollTo('') //prevent pass targetId to houseMenu for preventing clear selection

  }

  const [asset, setAsset] = useState([])
  //console.log(asset)
  const [nav, setNav] = useState({
    positions: [],
    currentPoint: ''
  })
  //console.log(nav)
  const [id, setId] = useState('')
  console.log('id', id)
  const [popup, setPopup] = useState('')

  const [changePoints, setchangePoints] = useState('')

  const [scrollTo, setScrollTo] = useState('')

  // Мемоизированное значение контекста
  const contextValue = useMemo(() => ({
    //hoveredId,
    //setHoveredId,
    scrollTo,
    setScrollTo
  }), [scrollTo]);




  const scrollToElement = (id) => {
    setScrollTo(id); // Устанавливаем целевой идентификатор and send scrollTo to HouseMenu

  };

  useEffect(() => {
    const abortController = new AbortController();
    
    fetch('/api', { signal: abortController.signal })
      .then((response) => response.json())
      .catch((error) => {
        if (error.name === 'AbortError') return; // Ignore aborted requests
        console.error('Failed to fetch assets:', error);
        throw error;
      })
      .then((json) => setAsset(json))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
        }
      });

    return () => abortController.abort(); // Cleanup on unmount or asset change
  }, []);

  useEffect(() => {
    updateMarks()
  }, [asset]);

  // Prevent "Cannot read properties of undefined (reading 'map')" error
  const marks = Array.isArray(asset) 
    ? asset.map((prop, index) => {
        return {
          "type": "Feature",
          "properties": {
            "@id": prop._id,
            "home_id": prop._id,
            "price": prop.price ?? 0
          },
          "id": prop._id,
          "geometry": {
            "type": "Point",
            "coordinates": prop.coordinates
          }
        }
      })
    : [] // Return empty array if asset is undefined/null/not an array
  //console.log(JSON.stringify(marks))
  const hverrStyle = {
    color: 'blue',
    backgroundColor: 'lightgray',
  };


  return (
    <main className={styles.main}>

      <MapContext.Provider value={contextValue}>

        <div className={styles.left_block}>
          {/* {card ? card : NULL} */}
          {changePoints && typeof changePoints === 'object' ? (
            <HousesMenu 
              cards={changePoints} 
              handleOver={handleOver} 
              handleLeave={handleLeave}
            />
          ) : "LOADING"}
        </div>
        <div className={styles.right_block}>
          <div className={styles.map_place}>
            <div className={styles.block}>
              {nav.positions.length != 0 ? <Map clearId={setId} setchangePoints={setchangePoints} centerZoom={nav.currentPoint} coords={marks} pointId={id} scroll_to={scrollToElement} html_popup={popup} /> : "Loading..."}
            </div>

          </div>
        </div>

      </MapContext.Provider>
    </main>
  )
}
