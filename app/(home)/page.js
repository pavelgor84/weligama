"use client"

//import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import styles from '../page.module.css'
//import { Icon_bed, Icon_cond, Icon_shower } from '@/components/icons/iconset'

//import SliderTest from '@/components/slider/SliderTest'

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

    setId(false)

  }

  function handleOver(e) { // handle marker for the map
    //e.preventDefault()
    setId(e.target.id)

  }

  const [asset, setAsset] = useState([])
  //console.log(asset)
  const [nav, setNav] = useState({
    positions: [],
    currentPoint: ''
  })
  //console.log(nav)
  const [id, setId] = useState('')
  const [popup, setPopup] = useState('')

  const [changePoints, setchangePoints] = useState('')
  //console.log(changePoints)

  const itemRef = useRef(null);

  const [scrollTo, setScrollTo] = useState('')

  const scrollToElement = (id) => {
    setScrollTo(id); // Устанавливаем целевой идентификатор
    if (itemRef.current) {
      itemRef.current.scrollIntoView({ inline: "center", behavior: 'smooth' });
    }
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
        {changePoints ? <HousesMenu cards={changePoints} handleOver={handleOver} handleLeave={handleLeave} ref={itemRef} targetId={scrollTo} /> : "LOADING"}
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
