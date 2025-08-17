"use client"


//import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useRef, useState } from 'react'
import styles from './map.module.css'
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
//import { createRoot } from 'react-dom/client';
//import Popup from '../popup/popup';
import Marker from '../marks/marker';


export default function Map({ clearId, centerZoom, coords, pointId, scroll_to, html_popup, setchangePoints }) {
    const geo = {
        "type": "FeatureCollection",
        "features": coords
    }

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
    const location = useRef(null)
    const saved_popup = useRef(null)
    const saved_html = useRef(null)
    const mark = useRef([0, 0])
    // const weligama = { lng: 80.430288, lat: 5.971817 };

    const lastPoint = useRef('')

    const lastPoints = useRef(null)

    const weligama = { lng: cz[1], lat: cz[0] };
    //console.log('map point id', pointId)


    maptilersdk.config.apiKey = process.env.MAPTILER_API;
    maptilersdk.config.caching = false;


    useEffect(() => {


        if (map.current) {

            return;
        } // stops map from intializing more than once

        map.current = new maptilersdk.Map({
            container: mapContainer.current,
            style: maptilersdk.MapStyle.STREETS,
            center: [weligama.lng, weligama.lat],
            zoom: zoom
        });

        map.current.on('load', async function () {

            // Create an image from SVG

            // const svgImage_selected = new Image(140, 140);
            // const svgImage = new Image(140, 140);

            // const pin_selected = `<?xml version="1.0" encoding="utf-8"?>
            // <svg xmlns="http://www.w3.org/2000/svg" viewBox="242.64 161.414 51.656 47.497" width="51.656px" height="47.497px">
            //   <path d="M 268.421 208.911 C 269.476 208.911 272.789 202.436 273.726 200.819 L 274.733 200.836 L 283.561 200.836 C 294.158 200.836 294.296 200.361 294.296 190.102 L 294.296 172.149 C 294.296 161.962 294.021 161.414 283.561 161.414 L 253.374 161.414 C 242.567 161.414 242.64 161.551 242.64 172.149 L 242.64 190.102 C 242.64 200.37 243.783 200.836 253.374 200.836 L 262.108 200.836 L 263.082 200.819 C 264.02 202.436 267.366 208.911 268.421 208.911 Z" style="stroke-width: 1;" fill="#fb6f92"/>
            // </svg>`;
            // const pin = `<?xml version="1.0" encoding="utf-8"?>
            // <svg xmlns="http://www.w3.org/2000/svg" viewBox="242.64 161.414 51.656 47.497" width="51.656px" height="47.497px">
            //   <path d="M 268.421 208.911 C 269.476 208.911 272.789 202.436 273.726 200.819 L 274.733 200.836 L 283.561 200.836 C 294.158 200.836 294.296 200.361 294.296 190.102 L 294.296 172.149 C 294.296 161.962 294.021 161.414 283.561 161.414 L 253.374 161.414 C 242.567 161.414 242.64 161.551 242.64 172.149 L 242.64 190.102 C 242.64 200.37 243.783 200.836 253.374 200.836 L 262.108 200.836 L 263.082 200.819 C 264.02 202.436 267.366 208.911 268.421 208.911 Z" style="stroke-width: 1;" fill="#4E5EF2"/>
            // </svg>`



            // svgImage_selected.onload = () => {
            //     map.current.addImage('svg_selected', svgImage_selected, {
            //         stretchX: [
            //             [25, 55],
            //             [85, 115]
            //         ],

            //         content: [25, 25, 115, 100],
            //         pixelRatio: 2
            //     })
            // }
            // svgImage.onload = () => {
            //     map.current.addImage('svg', svgImage, {
            //         stretchX: [
            //             [25, 55],
            //             [85, 115]
            //         ],

            //         content: [25, 25, 115, 100],
            //         pixelRatio: 2
            //     })
            // }


            // function svgStringToImageSrc(svgString) {
            //     return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
            // }

            // svgImage.src = svgStringToImageSrc(pin);
            // svgImage_selected.src = svgStringToImageSrc(pin_selected);

            map.current.addSource('marks', {
                type: 'geojson',
                generateId: true,
                data: geo
            });

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

            map.current.on('moveend', getCurrentPoints);
            //console.log(map.current)

            map.current.on('render', afterChangeComplete);


        })


    }, [weligama, zoom]);

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

        const allfeatures = getRenderedFeatures()
        console.log(allfeatures)
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
            return
        }


        let stayAdd = []
        let prevPoints = lastPoints.current.map((item) => item.properties.home_id)
        let freshPoints = newPoints.map((item) => item.properties.home_id)
        rezState.stay = prevPoints.filter((item) => freshPoints.includes(item))// A:12345, B:3456 -> 3,4,5
        rezState.add = freshPoints.filter((item) => !rezState.stay.includes(item))//B:3456, 345 -> 6
        stayAdd.push(...rezState.stay, ...rezState.add)
        rezState.del = prevPoints.filter((item) => !stayAdd.includes(item)) // A:12345, 345 & 6 -> 1,2
        // console.log("stay", rezState.stay)
        // console.log("add ", rezState.add)
        // console.log("del ", rezState.del)
        lastPoints.current = newPoints
        if (rezState.add.length != 0 || rezState.del.length != 0) {
            console.log("update!")
            setchangePoints(rezState)
        }
        //else { console.log("calm!") }


    }

    function afterChangeComplete() {
        if (!map.current.loaded()) { return } // still not loaded; bail out.

        // now that the map is loaded, it's safe to query the features:
        getCurrentPoints()

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

    // }

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
        // <div className={styles.mapWrap}>
        //     <div ref={mapContainer} className={styles.map} />
        //     {map.current && geo && geo.features?.map((feature) => {
        //         return (<Marker
        //             key={feature.id}
        //             map={map.current}
        //             feature={feature}
        //             allPoints={lastPoints.current}
        //         />)
        //     })}
        // </div>
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