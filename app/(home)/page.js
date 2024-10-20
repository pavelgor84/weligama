"use client"

//import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from '../page.module.css'
import { Icon_bed, Icon_cond, Icon_shower } from '@/components/icons/iconset'

import SliderTest from '@/components/slider/SliderTest'

import Map from '@/components/map/map'
import Link from 'next/link'
import next from 'next'
export const revalidate = 10


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
    // const mainDiv = e.currentTarget;
    // if (!mainDiv.contains(e.relatedTarget)) {
    //   console.log('Mouse left the main div');
    //   setId(false)
    // }
    setId(false)

  }

  function handleOver(e) { // handle marker for the map
    //e.preventDefault()
    setId(e.target.id)

  }

  const [asset, setAsset] = useState([])
  console.log(asset)
  const [nav, setNav] = useState({
    positions: [],
    currentPoint: ''
  })
  //console.log(nav)
  const [id, setId] = useState('')
  const [popup, setPopup] = useState('')

  useEffect(() => {
    fetch('/api', { next: { revalidate: 10 } })
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

  const scroll = function (id) {
    const pop = asset.find((el) => {
      return el._id === id
    })
    if (pop) {
      setPopup((prev) => pop)
    }
    // let el = document.getElementById(id)
    // el.classList.add(styles.selected_card_container)
    // el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }


  //console.log(asset)
  const card = asset.map((prop) => {
    return (
      <div className={styles.card_container} key={prop._id} id={prop._id} onMouseEnter={handleOver} onMouseLeave={handleLeave} >
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
            <h3 className={styles.card_right_h3}>{prop.name}</h3>
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
  //console.log(card[0])


  return (
    <main className={styles.main}>

      <div className={styles.left_block}>
        {card ? card : NULL}
      </div>
      <div className={styles.right_block}>
        <div className={styles.map_place}>
          <div className={styles.block}>
            {nav.positions.length != 0 ? <Map centerZoom={nav.currentPoint} coords={marks} pointId={id} scroll_to={scroll} html_popup={popup} /> : "Loading..."}
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