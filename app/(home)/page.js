"use client"

//import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from '../page.module.css'
import { Icon_bed, Icon_cond, Icon_shower } from '@/components/icons/iconset'

import SliderTest from '@/components/slider/SliderTest'

import Map from '@/components/map/map'
import Link from 'next/link'


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

  function handleClick(e) { // handle marker for the map

    let point = { currentPoint: e.split(',').map((x) => +x) }
    //console.log(point)
    setNav(prev => ({ ...prev, ...point }))
  }

  const [asset, setAsset] = useState([])
  //console.log(asset[0])
  const [nav, setNav] = useState({
    positions: [],
    currentPoint: ''
  })
  //console.log(nav)

  useEffect(() => {
    fetch('/api')
      .then((response) => response.json())
      .then((json) => setAsset(json))
  }, []);

  useEffect(() => {
    updateMarks()
  }, [asset]);


  const marks = asset.map((prop) => {
    return {
      "type": "Feature",
      "id": prop._id,
      "geometry": {
        "type": "Point",
        "coordinates": prop.coordinates.split(',').reverse().map((x) => +x)
      }
    }
  });
  //console.log(JSON.stringify(marks))

  // {
  //   "type": "FeatureCollection",
  //   "generator": "overpass-turbo",
  //   "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.",
  //   "timestamp": "2024-05-31T12:04:15Z",
  //   "features": [
  //     {
  //       "type": "Feature",
  //       "properties": {
  //         "@id": "node/357659331",
  //         "name": "Gill Wing",
  //         "shop": "shoes"
  //       },
  //       "geometry": {
  //         "type": "Point",
  //         "coordinates": [
  //           -0.1032412,
  //           51.5425188
  //         ]
  //       },
  //       "id": "node/357659331"
  //     },
  //     {
  //       "type": "Feature",
  //       "properties": {
  //         "@id": "node/444284623",
  //         "addr:city": "London",
  //         "addr:housenumber": "33G",
  //         "addr:postcode": "SW3 4LX",
  //         "addr:street": "King's Road",
  //         "brand": "Geox",
  //         "brand:wikidata": "Q588001",
  //         "brand:wikipedia": "en:Geox",
  //         "name": "Geox",
  //         "phone": "+44 20 7730 6787",
  //         "shop": "shoes",
  //         "website": "https://www.geox.com/en-GB"
  //       },
  //       "geometry": {
  //         "type": "Point",
  //         "coordinates": [
  //           -0.1616884,
  //           51.4904757
  //         ]
  //       },
  //       "id": "node/444284623"
  //     },]
  //   }

  console.log(asset)
  const card = asset.map((prop) => {
    return (
      <div className={styles.card_container} key={prop._id}>
        <div className={styles.card_left}>
          <SliderTest img={prop.images} />
        </div>
        <div className={styles.card_right} id={prop._id} >
          <Link href={{
            pathname: "/list",
            query: {
              id: prop._id
            }
          }} target="_blank">
            <h3>{prop.name}</h3>
            <div className={styles.card_right_options} >
              <Icon_bed /> <span>{prop.bedroom}</span>
              <Icon_shower /> <span>{prop.bath}</span>
              <Icon_cond /> <span>{prop.ac}</span>
              <div className={styles.card_right_options_txt}><span>View {prop.view}</span>  |  <span>Floors {prop.floor}</span>  |  <span>Elevator</span> | <span>Parking {prop.parking}</span></div>
            </div>
            <div className={styles.card_right_bottom}>
              <div className={styles.card_right_date}><button className={styles.card_right_options_button}>Available {prop.available}</button></div>
              <div className={styles.card_right_price}>from <span>Rs.{prop.price}</span> /day</div>
            </div>
          </Link>
        </div>

      </div>
    )
  })
  //console.log(nav.positions)


  return (
    <main className={styles.main}>

      <div className={styles.left_block}>
        {card ? card : NULL}
      </div>
      <div className={styles.right_block}>
        <div className={styles.map_place}>
          <div className={styles.block}>
            {nav.positions.length != 0 ? <Map centerZoom={nav.currentPoint} coords={marks} /> : "Loading"}
            {/* {nav.positions.length != 0 ? <Map centerZoom={nav.currentPoint} coords={nav.positions} /> : "Loading"} */}
            {/* {Object.hasOwn(nav, 'positions') ? <Map centerZoom={nav.currentPoint} coords={nav.positions} /> : "Loading..."} */}
          </div>

        </div>
      </div>


    </main>
  )
}

{/* <div className={styles.card_container}>
          <div className={styles.card_left}>
            <SliderTest />
          </div>
          <div className={styles.card_right}>
            <h3>Card title</h3>
            <div className={styles.card_right_options}>
              <Icon_bed /> <span>2 bedroom</span>
              <Icon_shower /> <span>1 bath</span>
              <Icon_cond /> <span>a/c</span>
              <div className={styles.card_right_options_txt}><span>City view</span>  |  <span>3rd floor</span>  |  <span>Elevator</span> | <span>Parking</span></div>
            </div>
            <div className={styles.card_right_bottom}>
              <div className={styles.card_right_date}><button className={styles.card_right_options_button}>Available now!</button></div>
              <div className={styles.card_right_price}>from <span>Rs.6000</span> /day</div>
            </div>
          </div>
        </div>
        <div className={styles.card_container}>
          <div className={styles.card_left}>
            <SliderTest />
          </div>
          <div className={styles.card_right}>
            <h3>Card title</h3>
            <div className={styles.card_right_options}>
              <Icon_bed /> <span>2 bedroom</span>
              <Icon_shower /> <span>1 bath</span>
              <Icon_cond /> <span>a/c</span>
              <div className={styles.card_right_options_txt}><span>City view</span>  |  <span>3rd floor</span>  |  <span>Elevator</span> | <span>Parking</span></div>
            </div>
            <div className={styles.card_right_bottom}>
              <div className={styles.card_right_date}><button className={styles.card_right_options_button}>Available now!</button></div>
              <div className={styles.card_right_price}>from <span>Rs.6000</span> /day</div>
            </div>
          </div>
        </div> */}