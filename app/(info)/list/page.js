"use client"


//import SliderList from '@/components/slider_list/SliderList'
import Gallery from '@/components/gallery/Gallery'
import { useEffect, useRef, useState } from 'react'
import styles from './list.module.css'
import osm from './map_provider'
import Map from '@/components/map/map'
import { useSearchParams } from 'next/navigation'

import { Icon_bed, Icon_cond, Icon_shower } from '@/components/icons/iconset'


export default function List() {
    const id_property = useSearchParams() //get params from previous page
    //console.log(id_property.get('id'))
    const [center, setCenter] = useState([])
    const ZOOM_LEVEL = 9
    const mapRef = useRef()

    let coords = [[5.978403170674758, 80.4282318764493], [5.974711154120036, 80.42580714581621]]

    function fetch_data() {
        fetch('/api/get_one', {
            method: "POST",
            body: JSON.stringify(id_property.get('id')) // extract id from params
        })
            .then((response) => response.json())
            .then((json) => {
                setAsset(json)
            })
    }
    useEffect(() => {
        fetch_data()
    }, []);

    const [asset, setAsset] = useState([])
    console.log(asset)

    const groupedByNumber = asset.rooms ? asset.rooms.reduce((acc, obj) => {
        // Если ключ для этого number уже есть, добавляем объект в массив
        if (!acc[obj.room_number]) {
            acc[obj.room_number] = []; // Если нет, создаем новый массив для этого number
        }
        acc[obj.room_number].push(obj);
        return acc;
    }, {}) : null

    let rooms = []
    let index = 0
    for (const item in groupedByNumber) {
        rooms.push(
            <div className={styles.room_containter}>
                <div key={index++} className={styles.room_photos}>
                    <h4 className={styles.room_header}> Room {item}</h4>
                    <Gallery photos={groupedByNumber[item]} />
                </div>
                <div className={styles.room_info}>  {asset.rooms_info[item] || ''} </div>
            </div>
        )
    }
    function Rooms() {
        return (
            <>
                {rooms}

            </>
        );
    }


    return (
        <section>
            <div className={styles.container}>
                <div className={styles.slider_area}>
                    {asset.images ? <Gallery photos={asset.images} /> : "LOADING..."}

                </div>
                <div className={styles.info_block}>
                    <div className={styles.info_block_left}>
                        <h1 className={styles.header}> Rhoncus suspendisse </h1>
                        <div className={styles.location}> London, Notting Hill </div>
                        <div className={styles.short_amenities}>
                            <div className={styles.short_amenities_leftIcons}>
                                <Icon_bed /> <span>2 bedroom</span>
                                <Icon_shower /> <span>1 bath</span>
                                <Icon_cond /> <span>yes</span>

                            </div>
                            <div className={styles.short_amenities_rightOptions}>
                                <span>View Garden</span>  |  <span>Floors 2 </span>  |  <span>Elevator</span> | <span>Parking yes</span>
                            </div>
                        </div>
                        <h2 className={styles.description_header}>Description</h2>
                        <span className={styles.description}>
                            A truly global city, London has long been considered a cutting-edge metropolis and hub for culture, style and finance. With each borough, Tube zone and neighborhood of London sporting its own vibe and lifestyle advantages, it can be downright difficult to settle on where to look for a furnished apartment in London . Whether you’re a digital nomad looking for a studio apartment in London or just seeking a month to month rental in London, Blueground has you covered.

                        </span>

                    </div>

                    <div className={styles.info_block_right}>
                        {/* <Map centerZoom={center} coords={coords} /> */}
                    </div>
                </div>
                <h2>Where you sleep</h2>
                <div className={styles.amenities}>
                    <Rooms />

                </div>


            </div>
        </section>
    )
}