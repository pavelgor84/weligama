"use client"


//import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useRef, useState } from 'react'
import styles from './list.module.css'
import osm from './map_provider'
import Map from '@/components/map/map'
import { useSearchParams } from 'next/navigation'


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


    return (
        <section>
            <div className={styles.container}>
                <div className={styles.left_block}>

                </div>
                <div className={styles.block}>
                    {/* <Map centerZoom={center} coords={coords} /> */}

                </div>


            </div>
        </section>
    )
}