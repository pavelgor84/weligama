"use client"

//import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { Icon_bed, Icon_cond, Icon_shower } from '@/components/icons/iconset'
import axios from 'axios'

import SliderTest from '@/components/slider/SliderTest'

import Link from 'next/link'
import styles from './houses.module.css'


export default function HousesMenu({ cards, handleOver, handleLeave, targetId }) {


    const [card, setCard] = useState([])
    //console.log("scroll to ", targetId)

    const itemRef = useRef([]);
    //console.log(itemRef.current)

    useEffect(() => {
        //get cards data, delete from state? request a new data, update the state
        itemRef.current = [] //clear refs during updating menu to prevent its rise 
        changeCards(cards)

    }, [cards]);

    console.log(targetId)
    if (targetId !== null && itemRef.current.length != 0) { //check for targetId, check for all refs for handle selection in menu
        itemRef.current.forEach((item) => {
            if (item.id === targetId) {
                item.className = styles.card_container_selected //apply selected style to menu element
            }
        })

    }
    if (targetId !== null) {// scroll to given targetId, if not do nothing
        const index = itemRef.current.findIndex(item => item.id === targetId);
        if (index !== -1) {

            itemRef.current[index].scrollIntoView({ block: "center", behavior: 'smooth' });
        }
    }

    const addToRefs = (el) => { // add refs to every menu element
        if (el && !itemRef.current.includes(el)) {
            itemRef.current.push(el);
        }
    };

    function hov(element) {// cear selection in menu if we pointed to another element

        if (targetId !== null) { // if there is a point to select
            if (element.target.id !== targetId) { // if current menu element isn't pointed
                itemRef.current.forEach((item) => {
                    if (item.id === targetId) {
                        item.className = styles.card_container // remove current selection if we pointed to other element
                    }
                })
                handleOver(element)// call update mark on the map for remove.
            }
        }

    }

    async function changeCards(cards) {
        // + not delete from state and not add? update state with incoming cards
        if (cards.add.length == 0 & cards.del.length == 0) {
            //console.log("first load")
            let newState = await getNewCards(cards.stay)
            setCard(newState)
        }
        // + delete from state and no add? then delete from state and update
        if (cards.add.length == 0 & cards.del.length != 0) {
            //console.log("delete cards")
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
            //console.log("add new cards")
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
        //console.log({ result })
        return result

    }

    const menu = card ? card.map((prop, index) => {
        return (
            <div className={prop._id === targetId ? styles.card_container_selected : styles.card_container} key={prop._id} id={prop._id} onMouseEnter={hov} onMouseLeave={handleLeave} ref={addToRefs} >
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
                            <div className={styles.card_right_date}><button className={styles.card_right_options_button}>Available</button></div>
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
}
