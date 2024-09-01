"use client"

//import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { Icon_bed, Icon_cond, Icon_shower } from '@/components/icons/iconset'

import SliderTest from '@/components/slider/SliderTest'

import Link from 'next/link'


export default function Popup({ pop, close }) {
    console.log(pop)
    return (
        <div className={styles.card_container} key={pop._id} id={pop._id} >
            <div className={styles.card_left}>
                <SliderTest img={pop.images} />
            </div>
            <div className={styles.card_right} id={pop._id} >
                <Link href={{
                    pathname: "/list",
                    query: {
                        id: pop._id
                    }
                }} target="_blank">
                    <div onClick={close} className={styles.card_right_close}>X</div>
                    <h3 className={styles.card_right_h3}>{pop.name}</h3>
                    <div className={styles.card_right_options} >
                        <Icon_bed /> <span>{pop.bedroom}</span>
                        <Icon_shower /> <span>{pop.bath}</span>
                        <Icon_cond /> <span>{pop.ac}</span>
                        <div className={styles.card_right_options_txt}><span>View {pop.view}</span>  |  <span>Floors {pop.floor}</span>  |  <span>Elevator</span> | <span>Parking {pop.parking}</span></div>
                    </div>
                    <div className={styles.card_right_bottom}>
                        <div className={styles.card_right_date}><button className={styles.card_right_options_button}>Available {pop.available}</button></div>
                        <div className={styles.card_right_price}>from <span>Rs.{pop.price}</span> /day</div>
                    </div>
                </Link>
            </div>

        </div>
        // <div>
        //     test and
        // </div>
    )

}
