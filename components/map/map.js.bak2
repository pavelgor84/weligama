"use client"


//import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useMemo, useRef, useState } from 'react'
import { debounce, throttle } from '@/utils/debounce';
import styles from './map.module.css'
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
//import { createRoot } from 'react-dom/client';
//import Popup from '../popup/popup';
import Marker from '../marks/marker';



export default function Map({ clearId, centerZoom, coords, pointId, scroll_to, html_popup, setchangePoints, onViewportReady }) {
    // Memoize FeatureCollection so it keeps a stable reference when coords haven't changed.
    const geo = useMemo(
        () => ({ "type": "FeatureCollection", features: coords }),
        [coords]
    );

    var cz
    if (centerZoom == '' || !centerZoom) {
        cz = [5.971817, 80.430288]
    }
    else {
        cz = centerZoom
    }

    const [zoom, setZoom] = useState(14);
    const mapContainer = useRef(null);
    const map = useRef(null);
    // Stable ref for the initial center — never changes after first render.
    // This prevents React from re-running the effect on every parent re-render.
    const initCenterRef = useRef({ lng: cz[1], lat: cz[0] });

    const location = useRef(null)
    const saved_popup = useRef(null)
    const saved_html = useRef(null)
    const mark = useRef([0, 0])

    const lastPoint = useRef('')

    const lastPoints = useRef(null)

    // Track whether we've already synced lastPoints for initial load (prevents double-sync on every coords ref change).
    const hasSyncedInitialPointsRef = useRef(false);
    const hasNotifiedInitialViewportRef = useRef(false);

    //console.log('map point id', pointId)



    maptilersdk.config.apiKey = process.env.MAPTILER_API;
    maptilersdk.config.caching = false;


    useEffect(() => {

        // Destroy old map instance if it exists (handles Fast Refresh + dependency changes)
        if (map.current && typeof map.current.remove === 'function') {
            try { map.current.remove(); } catch (_) { }
        }

        const center = initCenterRef.current;
        map.current = new maptilersdk.Map({
            container: mapContainer.current,
            style: maptilersdk.MapStyle.STREETS,
            center: [center.lng, center.lat],
            zoom: zoom
        });

        map.current.on('load', async function () {


            map.current.addSource('marks', {
                type: 'geojson',
                generateId: true,
                data: geo
            });

            console.log('[MAP-SOURCE] GeoJSON source added with', geo?.features?.length || 0, 'features');

            // Trigger initial viewport fetch if we have no data yet — prevents blank map on first load.
            // Without this, handleViewportReady only fires from moveend events after user interaction.
            if (geo?.features?.length === 0 && typeof onViewportReady === 'function') {
                const bounds = map.current.getBounds();
                console.log('[MAP] Initial load: triggering viewport query for initial data fetch');
                onViewportReady(bounds);
            }

            map.current.addLayer({
                'id': 'points',
                'type': 'symbol',
                'source': 'marks',
                'layout': {
                    'icon-image': 'svg',
                    'icon-text-fit': 'both',
                    'text-field': ['get', 'price'],
                    'text-size': 14,
                    'text-font': ['Open Sans Semibold',
                        'Arial Unicode MS Bold'],


                },
                'paint': {
                    'text-color': '#fff',

                }
            });



            map.current.on('mouseenter', 'points', (e) => {
                map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'points', (e) => {
                map.current.getCanvas().style.cursor = '';
            });

            //map.current.on('click', getPoint);


            let viewportTimerRef = null;

            function handleViewportMove() {
                clearTimeout(viewportTimerRef);
                // Debounce: wait 300ms after user stops panning/zooming before querying rendered features.
                // This avoids spamming the API during rapid movement and aligns with the document's recommendation to use idle + debounce.
                viewportTimerRef = setTimeout(() => {
                    if (map.current && map.current.loaded()) {
                        getCurrentPoints();
                        // Notify parent so it can fetch any new regions from DB
                        const bounds = map.current.getBounds();
                        if (typeof onViewportReady === 'function') {
                            onViewportReady(bounds);
                        }
                    }
                }, 300);
            }

            // MapTiler SDK: use 'moveend' for pan/zoom completion events.
            // The debounce above ensures we only query after movement settles,
            // matching the document's recommendation (idle + debounce).
            map.current.on('moveend', handleViewportMove);
            //console.log(map.current)

            map.current.on('render', afterChangeComplete);



        }); // Close async function() and close map.on('load') handler

        return () => {
            if (map.current && typeof map.current.remove === 'function') {
                try { map.current.remove(); } catch (_) { }
            }
        };
    }, [zoom]); // Only re-init when zoom actually changes

    // Update GeoJSON source when coords prop changes — avoids destroying/rebuilding the entire source
    useEffect(() => {
        if (!map.current || !map.current.getSource) return;
        const source = map.current.getSource('marks');
        if (source && Array.isArray(coords)) {
            source.setData({ type: 'FeatureCollection', features: coords });

            // After new data loads, sync lastPoints.current so JSX doesn't show "..." for all markers.
            // CRITICAL: do this synchronously — if we wait for a timeout + MapTiler rendering,
            // After new data loads, sync lastPoints.current so JSX doesn't show "..." for all markers.
            if (!hasSyncedInitialPointsRef.current) {
                const featuresToSet = coords.map(c => ({ properties: { home_id: c.id } }));
                lastPoints.current = featuresToSet;
                hasSyncedInitialPointsRef.current = true;
                console.log('[MAP] Synced lastPoints synchronously:', featuresToSet.length, 'features');

                // Send sidebar update immediately — use coords data directly instead of waiting for MapTiler.
                // This avoids the race where getRenderedFeatures() returns empty (MapTiler not painted yet)
                // and overwrites our correct sync with stale/empty data.
                setchangePoints({ stay: featuresToSet.map(f => f.properties.home_id), add: [], del: [] });
            } else {
                // Subsequent viewport changes — wait for MapTiler to render, then diff rendered vs previous.
                setTimeout(() => {
                    if (!map.current || !map.current.loaded()) return;
                    const rendered = getRenderedFeatures();
                    console.log('[MAP] Re-querying features after coords updated:', rendered.length);

                    if (rendered.length > 0) {
                        splitPoints(rendered);
                    }
                }, 150); // give maptiler a tick to render the new markers before querying
            }
        }
    }, [coords]);


    // useEffect(() => {
    //     if (html_popup !== '') {

    //         saved_html.current = html_popup

    //         show_popup()

    //     }

    // }, [html_popup])



    // useEffect(() => { //clear the markers when no pointId and mouse is over the list
    //     if (map.current.style.map.isReady && !pointId) {
    //         //map.current.setLayoutProperty('points', 'icon-image', 'svg');
    //     }

    // }, [pointId])

    // function close_popup(e) {
    //     e.preventDefault()
    //     saved_popup.current.remove()
    // }

    // function cleanSelection() {
    //     map.current.setLayoutProperty('points', 'icon-image', 'svg');
    // }

    // function show_popup() {
    //     //console.log(html_popup)
    //     let popupNode = document.createElement('div');
    //     const root = createRoot(popupNode);
    //     root.render(<Popup pop={saved_html.current} close={close_popup} />)
    //     saved_popup.current = new maptilersdk.Popup({ offset: 15 })
    //         .setLngLat(location.current)
    //         .setDOMContent(popupNode)
    //         .setMaxWidth(500)
    //         .addTo(map.current)
    //     saved_popup.current.addClassName(styles.visible)
    // }




    function getRenderedFeatures(point) {
        //if the point is null, it is searched within the bounding box of the map view
        const features = map.current.queryRenderedFeatures(point, {
            layers: ['points']
        });
        return features;
    }

    function getCurrentPoints() {
        const allfeatures = getRenderedFeatures();
        console.log('[MAP-FEATURES] Rendered features (in viewport):', allfeatures.length, 'Total map features:', geo?.features?.length);
        if (allfeatures.length > 0) {
            console.log('[MAP-FEATURES] Sample feature ids:', allfeatures.slice(0, 3).map(f => f.properties.home_id));
        }
        splitPoints(allfeatures)
    }

    function splitPoints(newPoints) {

        let rezState = {
            stay: [],
            add: [],
            del: []
        }

        if (!lastPoints.current) {
            let firstPoints = newPoints.map((item) => item.properties.home_id)
            rezState.stay = firstPoints
            lastPoints.current = newPoints
            setchangePoints(rezState)
            console.log('[MAP-SPLIT] Initial load:', firstPoints.length, 'points into viewport');
            return
        }



        let prevPoints = new Set(lastPoints.current.map(item => item.properties.home_id));
        let freshPoints = new Set(newPoints.map(item => item.properties.home_id));

        // Остаются - пересечение множеств
        rezState.stay = [...prevPoints].filter(id => freshPoints.has(id)); // A:12345, B:3456 -> 3,4,5
        // Добавляются - есть в fresh, но нет в prev
        rezState.add = [...freshPoints].filter(id => !prevPoints.has(id)); //B:3456, 345 -> 6
        // Удаляются - есть в prev, но нет в fresh
        rezState.del = [...prevPoints].filter(id => !freshPoints.has(id)); // A:12345, 345 & 6 -> 1,2

        console.log('[MAP-SPLIT] Viewport change — stay:', rezState.stay.length, 'add:', rezState.add.length, 'del:', rezState.del.length);
        lastPoints.current = newPoints;

        if (rezState.add.length || rezState.del.length) {
            console.log("[MAP-SPLIT] Sending to sidebar: add", rezState.add.length, "del", rezState.del.length);
            setchangePoints(rezState)
        }
        //else { console.log("calm!") }

    }

    function afterChangeComplete() {
        if (!map.current.loaded()) { return } // still not loaded; bail out.

        // CRITICAL FIX: Notify parent of initial viewport bounds so it can trigger an API fetch.
        if (!hasNotifiedInitialViewportRef.current && typeof onViewportReady === 'function') {
            hasNotifiedInitialViewportRef.current = true;
            const bounds = map.current.getBounds();
            console.log('[MAP] Initial viewport ready, notifying parent to fetch data');
            onViewportReady(bounds);
        }

        // NOTE: do NOT call getCurrentPoints() here — this event fires during React's render phase
        // BEFORE maptiler actually paints anything. getRenderedFeatures() would return empty or stale
        // features. Let the 150ms timeout in the coords useEffect handle viewport sync after both
        // React and maptiler have finished rendering. Removing getCurrentPoints here prevents an
        // infinite loop where: afterChangeComplete → getCurrentPoints(splitPoints([])) → setchangePoints
        // → parent re-render → new coords prop → Map re-renders → more render events.
        map.current.off('render', afterChangeComplete); // remove this handler now that we're done.
    }

    // function getPoint(e) {
    //     const features = getRenderedFeatures(e.point);

    //     if (features.length) {
    //         //console.log("click")
    //         const element = features[0];
    //         // lastPoint.current = element.properties.home_id
    //         lastPoint.current = pointId
    //         location.current = element.geometry.coordinates

    //         console.log('element id', element.id)

    //         map.current.setLayoutProperty('points', 'icon-image',
    //             [
    //                 'match',
    //                 ['id'], // get the feature id (make sure your data has an id set or use generateIds for GeoJSON sources
    //                 element.id, 'svg_selected', //image when id is the clicked feature id
    //                 'svg' // default
    //             ]
    //         );

    //         scroll_to(element.properties.home_id)
    //         clearId(false)

    //         // if (saved_popup.current != null && (saved_html.current._id == element.properties.home_id) && !saved_popup.current.isOpen()) { //check if popup is closed and reopen it using useRef vars
    //         //     show_popup()
    //         // }
    //     }
    // }

    // if (map.current && pointId) { // LIST to MAP interaction
    //     function getFeatureOfPoint(point) {     //find features in the map viewport
    //         let feaurez = getRenderedFeatures()
    //         let find = feaurez.find((el) => {
    //             return el.properties.home_id == point
    //         })

    //         if (find) {
    //             changeMarker(find.id) //if find then change color to selected
    //             // map.current.flyTo({
    //             //     center: find.geometry.coordinates
    //             // })
    //             return true
    //         }
    //         else return false
    //     }
    //     function changeMarker(id) {
    //         //console.log(id)
    //         map.current.setLayoutProperty('points', 'icon-image',
    //             [
    //                 'match',
    //                 ['id'],
    //                 id, 'svg_selected',
    //                 'svg' // default
    //             ]
    //         );
    //     }


    //     getFeatureOfPoint(pointId) // get features in the map viewport




    //     // lastPoint.current = pointId

    //     // if (!find_home) { // if no then go search geojson
    //     //     const find_home_away = coords.find((el) => {
    //     //         return el.properties.home_id == pointId
    //     //     })
    //     //     if (find_home_away) {
    //     //         //map.current.setCenter(find_home_away.geometry.coordinates);
    //     //         let z = map.current.flyTo({ // go to geojson feature coordinates
    //     //             center: find_home_away.geometry.coordinates
    //     //         })
    //     //         setTimeout(() => { //wait to load features to map viewport
    //     //             getFeatureOfPoint(pointId) //call find features in the map viewport 
    //     //         }, 1000);

    //     //     }

    //     // }

    //     // }

    // const debounce = (mainFunction, delay) => {
    //     let timer;

    //     return function (...args) {
    //         clearTimeout(timer);

    //         timer = setTimeout(() => {
    //             mainFunction(...args);
    //         }, delay);
    //     };
    // };
    // const test = function () {
    //     console.log("TEST")
    // }
    // const testdata = debounce(test, 3000)
    // testdata()

    return (
        <div className={styles.mapWrap}>
            <div ref={mapContainer} className={styles.map} />
            {map.current && lastPoints.current && geo && geo.features?.map((feature) => {
                let find_viewport_point = lastPoints.current.find((el) => {
                    return el.properties.home_id == feature.id
                })
                if (find_viewport_point) {
                    return (<Marker
                        key={feature.id}
                        map={map.current}
                        feature={feature}
                        viewport={true} //if marker in current viewport then show it
                        selected={pointId}
                    />)
                }
                else {
                    return (<Marker
                        key={feature.id}
                        map={map.current}
                        feature={feature}
                        viewport={false} // if marker isn't in current viewport then show it inactive
                    />)
                }

            })}
        </div>

    )
}
