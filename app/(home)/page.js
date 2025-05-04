"use client"

//import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from '../page.module.css'


import Map from '@/components/map/map'
//import Link from 'next/link'

import HousesMenu from '@/components/housesMenu/HousesMenu'


export default function Home() {

  function updateMarks() {
    const coords = {
      positions: [],
      currentPoint: ''
    }
    //console.log(asset)
    asset.forEach((el) => {
      let tempPosition = el.coordinates
      //console.log(tempPosition)
      let tempPositionNum = tempPosition.split(',').map((x) => +x)
      coords.positions.push(tempPositionNum)
    })
    //console.log(coords)
    setNav((prev) => coords)

  }
  function handleLeave(e) {
    console.log('leave')
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


  useEffect(() => {
    // Здесь можно выполнить действия при изменении scrollTo
    console.log('Scroll to:', scrollTo);
  }, [scrollTo]);

  const scrollToElement = (id) => {
    setScrollTo(id); // Устанавливаем целевой идентификатор and send scrollTo to HouseMenu

  };

  useEffect(() => {
    fetch('/api')
      .then((response) => response.json())
      .then((json) => setAsset(json))
  }, []);

  useEffect(() => {
    updateMarks()
  }, [asset]);

  const marks = asset.map((prop, index) => {
    return {
      "type": "Feature",
      "properties": {
        "@id": prop._id,
        "home_id": prop._id,
        "price": ""
      },
      "id": prop._id,
      "geometry": {
        "type": "Point",
        "coordinates": prop.coordinates.split(',').reverse().map((x) => +x)
      }
    }
  });
  //console.log(JSON.stringify(marks))
  const hverrStyle = {
    color: 'blue',
    backgroundColor: 'lightgray',
  };

  // const scroll = function (id) {
  //   const pop = asset.find((el) => {
  //     return el._id === id
  //   })
  //   if (pop) {
  //     setPopup((prev) => pop)
  //   }

  // }


  return (
    <main className={styles.main}>

      <div className={styles.left_block}>
        {/* {card ? card : NULL} */}
        {changePoints ? <HousesMenu cards={changePoints} handleOver={handleOver} handleLeave={handleLeave} targetId={scrollTo} /> : "LOADING"}
      </div>
      <div className={styles.right_block}>
        <div className={styles.map_place}>
          <div className={styles.block}>
            {nav.positions.length != 0 ? <Map setchangePoints={setchangePoints} centerZoom={nav.currentPoint} coords={marks} pointId={id} scroll_to={scrollToElement} html_popup={popup} /> : "Loading..."}
          </div>

        </div>
      </div>


    </main>
  )
}
