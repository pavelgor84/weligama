"use client"


//import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useRef, useState } from 'react'
import styles from './map.module.css'
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";


export default function Map_info({ coords = [80.430288, 5.971817] }) {
    //console.log(coords)


    // const [center, setCenter] = useState({ lat: 5.971817, lng: 80.430288 })
    const [zoom, setZoom] = useState(14);
    const mapContainer = useRef(null);
    const map = useRef(null);
    const points = useRef({})
    const mark = useRef([0, 0])
    const prevMark = useRef([0, 0])
    // const weligama = { lng: 80.430288, lat: 5.971817 };
    //console.log(weligama)

    maptilersdk.config.apiKey = process.env.MAPTILER_API;
    maptilersdk.config.caching = false;


    useEffect(() => {

        function marker(coords) {
            //console.log(coords)

            points.current = new maptilersdk.Marker({ color: "#ff0000" })
                .setLngLat(coords)
                .setPopup(new maptilersdk.Popup().setHTML("&lt;h1&gt;There you are!&lt;/h1&gt;"))
                .addTo(map.current);

            // points.current[i] = new maptilersdk.Marker({ color: "#989ca3" })
            //     .setLngLat([coords[i][1], coords[i][0]])
            //     .addTo(map.current);

        }


        if (map.current) {

            return;
        } // stops map from intializing more than once

        map.current = new maptilersdk.Map({
            container: mapContainer.current,
            style: maptilersdk.MapStyle.STREETS,
            center: coords,
            //center: weligama ? [weligama.lng, weligama.lat] : [80.430288, 5.971817],
            zoom: zoom
        });
        marker(coords)
        map.current.on('load', function () {
            console.log("YEEEEEE")
            map.current.on('mouseenter', function () {
                map.getCanvas().style.cursor = 'pointer';
                //console.log("on")
            });

            // Change it back to a pointer when it leaves.
            map.current.on('mouseleave', function () {
                map.getCanvas().style.cursor = '';
                //console.log("off")
            });



        })

        // new maptilersdk.Marker({ color: "#FF0000" })
        //     .setLngLat([80.4282318764493, 5.978403170674758])
        //     .addTo(map.current);

    }, [zoom]);




    return (
        <div className={styles.mapWrap}>
            <div ref={mapContainer} className={styles.map} />
        </div>
    )
}