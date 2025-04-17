"use client"

//import Image from 'next/image'
import { useEffect, useState, useRef, forwardRef } from 'react'
import { Icon_bed, Icon_cond, Icon_shower } from '@/components/icons/iconset'
import axios from 'axios'

import SliderTest from '@/components/slider/SliderTest'

import Link from 'next/link'
import styles from './houses.module.css'


const HousesMenu = forwardRef(({ cards, handleOver, handleLeave, targetId }, ref) => {


    const [card, setCard] = useState([])
    console.log(card)
    console.log("scroll to ", targetId)

    useEffect(() => {
        //get cards data, delete from state? request a new data, update the state
        console.log("CARDS CHANGED!")
        changeCards(cards)

    }, [cards]);

    async function changeCards(cards) {
        // + not delete from state and not add? update state with incoming cards
        if (cards.add.length == 0 & cards.del.length == 0) {
            console.log("first load")
            let newState = await getNewCards(cards.stay)
            setCard(newState)
        }
        // + delete from state and no add? then delete from state and update
        if (cards.add.length == 0 & cards.del.length != 0) {
            console.log("delete cards")
            let prevState = [...card]
            let newState = prevState.filter((item) => !cards.del.includes(item._id))
            setCard(newState)
        }
        //delete from state and add? then delete from state and request DB, then add new data to state and uppdate
        if (cards.add.length != 0 & cards.del.length != 0) {
            let prevState = [...card]
            let newState = prevState.filter((item) => !cards.del.includes(item._id))
            let newCards = await getNewCards(cards.add)
            newState.push(...newCards)
            setCard(newState)
        }
        //not delete from state and add? then request DB and add new data to state and update
        if (cards.add.length != 0 & cards.del.length == 0) {
            console.log("add new cards")
            let prevState = [...card]
            let newCards = await getNewCards(cards.add)
            prevState.push(...newCards)
            setCard(prevState)
        }
        else console.log("nothing happened")


    }

    async function getNewCards(new_cards) {

        const response = await axios.post('/api/get_more_houses', new_cards)
        const result = await response.data
        console.log({ result })
        return result

    }

    const menu = card ? card.map((prop) => {
        return (
            <div className={prop._id === targetId ? styles.card_container_selected : styles.card_container} key={prop._id} id={prop._id} onMouseEnter={handleOver} onMouseLeave={handleLeave} ref={prop._id === targetId ? ref : null}>
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
    }) : NULL

    return (
        <>{menu ? menu : NULL}</>
    )
})
export default HousesMenu