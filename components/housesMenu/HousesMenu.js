"use client"

import { useEffect, useState, useRef } from 'react'
import { Icon_bed, Icon_cond, Icon_shower } from '@/components/icons/iconset'
import axios from 'axios'

import SliderTest from '@/components/slider/SliderTest'

import Link from 'next/link'
import styles from './houses.module.css'

import { useMapContext } from '@/app/context/MapContext'
import { useCurrency } from '@/app/context/CurrencyContext'
import { formatAddress } from '@/components/shared/addressDisplay'


export default function HousesMenu({ cards, handleOver, handleLeave }) {

    const [card, setCard] = useState([])

    const itemRef = useRef([]);
    const selectedRef = useRef('');
    const prevStayIdsRef = useRef([]); // track stay IDs to skip redundant API calls (Issue #3)

    const { scrollTo } = useMapContext()
    const { formatPrice } = useCurrency()

    useEffect(() => {
        //get cards data, delete from state? request a new data, update the state
        itemRef.current = [] //clear refs during updating menu to prevent its rise 
        changeCards(cards)

    }, [cards]);


    useEffect(() => {
        console.log("scroll to", scrollTo)
        if (scrollTo && itemRef.current.length > 0) { //check for scrollTo, check for all refs for handle selection in menu
            if (scrollTo !== selectedRef.current) {
                itemRef.current.forEach((item) => {
                    if (item.id === scrollTo) {
                        item.className = styles.card_container_selected //apply selected style to menu element
                        // Mobile: the cards sit in a horizontal strip over the map, so
                        // centre the card sideways; desktop keeps centring it in the list.
                        const isMobile = window.innerWidth <= 768
                        item.scrollIntoView(
                            isMobile
                                ? { block: 'nearest', inline: 'center', behavior: 'smooth' }
                                : { block: 'center', behavior: 'smooth' }
                        );
                        selectedRef.current = scrollTo
                    }
                })
            }
        }
    }, [scrollTo])



    const addToRefs = (el) => { // add refs to every menu element
        if (el && !itemRef.current.includes(el)) {
            itemRef.current.push(el);
        }
    };

    function hov(element) {// cear selection in menu if we pointed to another element

        if (!itemRef.current.length) return;
        
        const targetId = element.currentTarget.id;
        itemRef.current.forEach((item) => {
            if (item.id === targetId && item.className !== styles.card_container_selected) {
                item.className = styles.card_container // remove current selection if we pointed to other element
                selectedRef.current = element.currentTarget.id
            }
        })
        handleOver(element.currentTarget.id)// call update mark on the map for remove.
    }
    
    function touchEnd() {
        handleLeave()
    }

    async function changeCards(cards) {
        // + not delete from state and not add? skip API call if stay IDs unchanged (Issue #3)
        if (cards.add.length == 0 & cards.del.length == 0) {
            const currentStayIds = [...(cards.stay || [])].sort().join(',');
            const prevStayIds = [...prevStayIdsRef.current].sort().join(',');
            if (currentStayIds !== prevStayIds && currentStayIds !== '') {
                let newState = await getNewCards(cards.stay);
                setCard(newState);
                prevStayIdsRef.current = [...(cards.stay || [])]; // update tracked IDs
            }
        }
        // + delete from state and no add? then delete from state and update
        if (cards.add.length == 0 & cards.del.length != 0) {
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
            let prevState = [...card]
            let newCards = await getNewCards(cards.add)
            prevState.push(...newCards)
            setCard(prevState)
        }

    }

    async function getNewCards(new_cards) {

        const response = await axios.post('/api/get_more_houses', new_cards)
        const result = await response.data
        return result

    }

    const menu = card ? card.map((prop, index) => {
        return (
            <div className={prop._id === scrollTo ? styles.card_container_selected : styles.card_container} key={prop._id} id={prop._id} onTouchStart={hov} onMouseEnter={hov} onMouseLeave={handleLeave} ref={addToRefs} >
                <Link href={{
                    pathname: "/list",
                    query: {
                        id: prop._id
                    }
                }} target="_blank" className={styles.card_link}>
                    <div className={styles.card_media}>
                        <SliderTest img={prop.images} />

                        {/* Frosted-glass panel behind the lower half of the media */}
                        <div className={styles.glass} aria-hidden="true"></div>

                        {/* Scrim for text legibility, sits above the glass and slider */}
                        <div className={styles.scrim} aria-hidden="true"></div>

                        <div className={styles.card_content}>
                            <h3 className={styles.card_title}>{prop.name}</h3>

                            <ul className={styles.features}>
                                <li>
                                    <Icon_bed width={15} height={15} />
                                    <span>{prop.bedroom} Bedroom</span>
                                </li>
                                <li>
                                    <Icon_shower width={15} height={15} />
                                    <span>{prop.bath} Bath</span>
                                </li>
                                <li>
                                    <Icon_cond width={15} height={15} />
                                    <span>AC {prop.ac ? "Yes" : "No"}</span>
                                </li>
                            </ul>

                            {/* Address row — city, street, house number only; "Address" when none provided */}
                            <div className={styles.meta}>
                                <p className={styles.meta__location}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
                                        <g transform="translate(12 12) scale(1.2) translate(-12 -12)">
                                            <path d="M12 21.2s6.9-6.3 6.9-11.1a6.9 6.9 0 1 0-13.8 0C5.1 14.9 12 21.2 12 21.2Z" />
                                            <circle cx="12" cy="9.9" r="2.5" />
                                            <circle cx="12" cy="9.9" r="0.95" fill="currentColor" stroke="none" />
                                        </g>
                                    </svg>
                                    {formatAddress(prop.address)}
                                </p>
                            </div>

                            <div className={styles.card_footer}>
                                <p className={styles.price}>
                                    <span className={styles.price_from}>from</span> <span>{formatPrice(prop.price)}</span><span className={styles.price_period}>/day</span>
                                </p>
                                <button className={styles.btn} type="button">View Details</button>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        )
    }) : NULL

    return (
        <>
            {menu ? menu : NULL}
        </>
    )
}
