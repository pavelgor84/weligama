"use client"


//import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useRef, useState } from 'react'
import styles from './map.module.css'
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";


export default function Map() {
    const [center, setCenter] = useState({ lat: 5.971817, lng: 80.430288 })
    const [zoom, setZoom] = useState(14);
    const mapContainer = useRef(null);
    const map = useRef(null);
    const weligama = { lng: 80.430288, lat: 5.971817 };
    maptilersdk.config.apiKey = 'AxnWhpldVUbU3HG2NB2E';

    useEffect(() => {
        if (map.current) return; // stops map from intializing more than once

        map.current = new maptilersdk.Map({
            container: mapContainer.current,
            style: maptilersdk.MapStyle.STREETS,
            center: [weligama.lng, weligama.lat],
            zoom: zoom
        });

    }, [weligama.lng, weligama.lat, zoom]);

    new maptilersdk.Marker({ color: "#FF0000" })
        .setLngLat([80.4282318764493, 5.978403170674758])
        .addTo(map.current);


    return (
        <div className={styles.mapWrap}>
            <div ref={mapContainer} className={styles.map} />
        </div>
    )
}