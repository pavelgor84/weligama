"use client"


//import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useRef, useState } from 'react'
import styles from './map.module.css'
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";


export default function Map({ centerZoom, coords }) {
    //console.log(coords.length)
    var cz
    if (centerZoom == '') {
        cz = [80.430288, 5.971817]
        //console.log("cz undefined")
    }
    else {
        //console.log("cz =  " + centerZoom)
        cz = centerZoom
    }

    // const [center, setCenter] = useState({ lat: 5.971817, lng: 80.430288 })
    const [zoom, setZoom] = useState(14);
    const mapContainer = useRef(null);
    const map = useRef(null);
    const points = useRef({})
    const mark = useRef([0, 0])
    const prevMark = useRef([0, 0])
    // const weligama = { lng: 80.430288, lat: 5.971817 };
    const weligama = { lng: cz[0], lat: cz[1] };
    //console.log(weligama)
    maptilersdk.config.apiKey = 'AxnWhpldVUbU3HG2NB2E';



    useEffect(() => {
        function markers(coords) {
            for (let i = 0; i < coords.length; i++) {
                points.current[i] = new maptilersdk.Marker({ color: "#989ca3" })
                    .setLngLat([coords[i][0], coords[i][1]])
                    .addTo(map.current);

            }

        }


        function updateMarkers() {
            if ((mark.current[0] != cz[0]) && mark.current[1] != cz[1]) {
                prevMark.current = [...mark.current]
                mark.current = cz
            }


            for (const property in points.current) {
                console.log(points.current[property]._lngLat.lat)
                console.log(mark.current[1])
                if ((points.current[property]._lngLat.lat === mark.current[1]) && points.current[property]._lngLat.lng === mark.current[0]) {
                    console.log("Found new!!")
                    //points.current[property].remove()
                    points.current[property] = new maptilersdk.Marker({ color: "#FF0000" })
                        .setLngLat([mark.current[0], mark.current[1]])
                        .addTo(map.current);

                }
                if ((points.current[property]._lngLat.lat === prevMark.current[1]) && points.current[property]._lngLat.lng === prevMark.current[0]) {
                    console.log("Found prev!!")
                    //points.current[property].remove()
                    points.current[property] = new maptilersdk.Marker({ color: "#989ca3" })
                        .setLngLat([prevMark.current[0], prevMark.current[1]])
                        .addTo(map.current);

                }

            }
        }


        console.log("Effect")

        if (map.current) {
            if ((mark.current[0] === cz[0]) && mark.current[1] === cz[1]) return
            updateMarkers()
            map.current.flyTo({
                center: cz
            })
            console.log(points)
            return;
        } // stops map from intializing more than once

        map.current = new maptilersdk.Map({
            container: mapContainer.current,
            style: maptilersdk.MapStyle.STREETS,
            center: [weligama.lng, weligama.lat],
            //center: weligama ? [weligama.lng, weligama.lat] : [80.430288, 5.971817],
            zoom: zoom
        });
        markers(coords)

        // new maptilersdk.Marker({ color: "#FF0000" })
        //     .setLngLat([80.4282318764493, 5.978403170674758])
        //     .addTo(map.current);

    }, [weligama, zoom]);




    return (
        <div className={styles.mapWrap}>
            <div ref={mapContainer} className={styles.map} />
        </div>
    )
}