"use client"


//import SliderList from '@/components/slider_list/SliderList'
import Gallery from '@/components/gallery/Gallery'
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
                <div className={styles.slider_area}>
                    {asset.images ? <Gallery photos={asset.images} /> : "LOADING..."}

                </div>
                <div className={styles.info_block}>
                    <div className={styles.info_block_left}>
                        <div lassName={styles.info_block_left} c>
                            <h1 lassName={styles.header}> Rhoncus suspendisse </h1>
                            <span lassName={styles.location}> London, Notting Hill </span>
                            <div lassName={styles.short_amenities}>
                                <div lassName={styles.short_amenities_leftIcons}>

                                </div>
                                <div lassName={styles.short_amenities_rightOptions}>

                                </div>
                            </div>
                            <h2 lassName={styles.description_header}>Description</h2>
                            <span lassName={styles.description}>
                                A truly global city, London has long been considered a cutting-edge metropolis and hub for culture, style and finance. With each borough, Tube zone and neighborhood of London sporting its own vibe and lifestyle advantages, it can be downright difficult to settle on where to look for a furnished apartment in London . Whether you’re a digital nomad looking for a studio apartment in London or just seeking a month to month rental in London, Blueground has you covered.

                            </span>
                        </div>
                    </div>

                    <div className={styles.info_block_right}>
                        {/* <Map centerZoom={center} coords={coords} /> */}
                    </div>
                </div>
                <div className={styles.amenities}>

                </div>


            </div>
        </section>
    )
}