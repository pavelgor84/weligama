"use client"

import { useEffect, useRef, useState } from 'react'
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import styles from './maptiler.module.css';

export default function CoordinatePicker({ value, onChange }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const initCenterRef = useRef(null); // lazy-init on mount

    const [centerStr, setCenterStr] = useState('');

    useEffect(() => {
        maptilersdk.config.apiKey = process.env.MAPTILER_API;

        // Determine initial center from value or default to Weligama
        let startLng = 80.430288;
        let startLat = 5.971817;
        if (value) {
            const parts = value.split(',').map(s => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                [startLat, startLng] = parts; // value is "lat, lng" → GeoJSON uses [lng, lat]
            }
        }

        initCenterRef.current = { lng: startLng, lat: startLat };

        const map = new maptilersdk.Map({
            container: mapContainer.current,
            style: maptilersdk.MapStyle.STREETS,
            center: [startLng, startLat],
            zoom: 14,
            draggable: true,
            dragRotate: false,
        });

        // Add a draggable marker at the initial position
        const el = document.createElement('div');
        el.innerHTML = '<svg width="32" height="48" viewBox="0 0 32 48"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 32 16 32s16-20 16-32C32 7.2 24.8 0 16 0z" fill="#e74c3c"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>';
        el.style.cursor = 'grab';

        const marker = new maptilersdk.Marker({ element: el, draggable: true })
            .setLngLat([startLng, startLat])
            .addTo(map);
        markerRef.current = marker;

        marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            // lngLat is {lng, lat} → value format is "lat, lng"
            const coordStr = `${lngLat.lat.toFixed(8)}, ${lngLat.lng.toFixed(8)}`;
            setCenterStr(coordStr);
            onChange?.(coordStr);
        });

        mapRef.current = map;

        // Also allow clicking on the map to place the marker
        map.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            marker.setLngLat([lng, lat]);
            const coordStr = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
            setCenterStr(coordStr);
            onChange?.(coordStr);
        });

        return () => {
            map.remove();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (!value) return; // input cleared — keep marker where it is
        const parts = value.split(',').map(s => parseFloat(s.trim()));
        if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return;
        const [lat, lng] = parts;

        const current = markerRef.current?.getLngLat();
        if (current && Math.abs(current.lat - lat) < 1e-8 && Math.abs(current.lng - lng) < 1e-8) {
            return; // no visible change (e.g. value came from the drag itself)
        }

        // User typed coordinates into the input → move marker and pan the map
        markerRef.current?.setLngLat([lng, lat]);
        map.flyTo({ center: [lng, lat], essential: true });
        setCenterStr(value);
    }, [value]);

    return (
        <div className={styles.mapWrap}>
            <div ref={mapContainer} className={styles.map} />
            {centerStr && <span className={styles.info}>{centerStr}</span>}
        </div>
    );
}
