"use client"


//import SliderList from '@/components/slider_list/SliderList'
import Gallery from '@/components/gallery/Gallery'
import { useEffect, useRef, useState } from 'react'
import styles from './list.module.css'
// import osm from './map_provider'
// import Map from '@/components/map/map'
import Map_info from '@/components/map_info/map'
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

        if (!asset.occupied_rooms.includes(item)) {
            rooms.push(
                <div key={index++} className={styles.room_containter}>
                    <div className={styles.room_photos}>
                        <h4 className={styles.room_header}> Room {item}</h4>
                        <Gallery photos={groupedByNumber[item]} />
                    </div>
                    <div className={styles.room_info}>  {asset.rooms_info != undefined ? asset.rooms_info[item] : 'No information'} </div>
                </div>
            )
        }
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
                <div className={styles.phone_area}>
                    <div> Call: <a href={`tel:${asset.phone}`}>{asset.phone}</a></div>
                    <div><a href={`https://api.whatsapp.com/send?phone=${asset.phone}&text=Hello! I would like to see the ${asset.name}.When can we meet?`}>Message to WhatsApp</a></div>
                </div>
                <div className={styles.info_block}>
                    <div className={styles.info_block_left}>
                        <h1 className={styles.header}> {asset.name && asset.name} </h1>
                        <div className={styles.short_amenities}>
                            <div className={styles.short_amenities_leftIcons}>
                                <Icon_bed /> <span>{asset.bedroom} bedroom</span>
                                <Icon_shower /> <span>{asset.bath} bath</span>
                                <Icon_cond /> <span>{asset.ac}</span>

                            </div>
                            <div className={styles.short_amenities_rightOptions}>
                                <span>View {asset.view}</span>  |  <span>Floors {asset.floor} </span>  |  <span>Parking {asset.parking}</span>
                            </div>
                        </div>
                        <h2 className={styles.description_header}>Description</h2>
                        <span className={styles.description}>
                            {asset.description && asset.description}
                        </span>

                    </div>

                    <div className={styles.info_block_right}>
                        {asset.coordinates && <Map_info coords={asset.coordinates.split(',').reverse().map((x) => +x)} />}
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