"use client"

//import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { Icon_bed, Icon_cond, Icon_shower } from '@/components/icons/iconset'
import axios from 'axios'

import SliderTest from '@/components/slider/SliderTest'

import Link from 'next/link'
import styles from './houses.module.css'


export default function HousesMenu({ cards, handleOver, handleLeave }) {

    const [card, setCard] = useState([])

    useEffect(() => {
        //get cards data, delete from state? request a new data, update the state

    }, [cards]);

    function changeCards() {
        // not delete from state and not add? update state with incoming cards
        //delete from state and no add? then delete from state and update
        //delete from state and add? then delete from state and request DB, then add new data to state and uppdate
        //not delete from state and add? then request DB and add new data to state and update
    }

    async function getNewCards(cards) {

    }

    const menu = card.map((prop) => {
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

    return (
        <div>{menu ? menu : NULL}</div>
    )
}