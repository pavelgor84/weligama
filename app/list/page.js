"use client"


//import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useRef, useState } from 'react'
import styles from './list.module.css'
import osm from './map_provider'
import Map from '@/components/map/map'


export default function List() {
    const [center, setCenter] = useState([])
    const ZOOM_LEVEL = 9
    const mapRef = useRef()
    //console.log(asset[0])

    // useEffect(() => {
    //     fetch('/api')
    //         .then((response) => response.json())
    //         .then((json) => setAsset(json))
    // }, []);
    let coords = [[80.4282318764493, 5.978403170674758], [80.42580714581621, 5.974711154120036]]

    function handlePress(e) {
        let numberCoords = e.split(',').map((x) => +x)
        setCenter((old) => numberCoords)

    }

    return (
        <section>
            <div className={styles.container}>
                <div className={styles.left_block}>
                    <button value={'80.4282318764493, 5.978403170674758'} onClick={(e) => handlePress(e.target.value)}> first coords</button>
                    <button value={'80.42580714581621, 5.974711154120036'} onClick={(e) => handlePress(e.target.value)}> second coords</button>

                </div>
                <div className={styles.block}>
                    <Map centerZoom={center} coords={coords} />

                </div>


            </div>
        </section>
    )
}