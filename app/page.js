"use client"

//import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './page.module.css'
import Icon_bed from '@/components/icons/Bed'
import Icon_shower from '@/components/icons/Shower'
import Icon_cond from '@/components/icons/Cond'

import SliderTest from '@/components/slider/SliderTest'


// const images = require.context('../public/images/south', true)
// const imageList = images.keys().map(image => images(image));

// imageList.map((image, index) => (
//   console.log(`   key=${index} src=${JSON.stringify(image.default.src)} alt=${'image' + index} `)
// ))




export default function Home() {

  const [asset, setAsset] = useState([])
  //console.log(asset[0])

  useEffect(() => {
    fetch('/api')
      .then((response) => response.json())
      .then((json) => setAsset(json))
  }, []);

  console.log(asset)
  const card = asset.map((prop) => {
    return (
      <div className={styles.card_container} key={prop._id}>
        <div className={styles.card_left}>
          <SliderTest img={prop.images} />
        </div>
        <div className={styles.card_right}>
          <h3>{prop.name}</h3>
          <div className={styles.card_right_options}>
            <Icon_bed /> <span>{prop.bedroom}</span>
            <Icon_shower /> <span>{prop.bath}</span>
            <Icon_cond /> <span>{prop.ac}</span>
            <div className={styles.card_right_options_txt}><span>View {prop.view}</span>  |  <span>Floors {prop.floor}</span>  |  <span>Elevator</span> | <span>Parking {prop.parking}</span></div>
          </div>
          <div className={styles.card_right_bottom}>
            <div className={styles.card_right_date}><button className={styles.card_right_options_button}>Available {prop.available}</button></div>
            <div className={styles.card_right_price}>from <span>Rs.{prop.price}</span> /day</div>
          </div>
        </div>
      </div>
    )
  })
  //console.log(card)


  return (
    <main className={styles.container}>
      <div className={styles.main}>

        {card ? card : NULL}


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