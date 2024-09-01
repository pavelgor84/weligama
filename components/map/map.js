"use client"


//import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useRef, useState } from 'react'
import styles from './map.module.css'
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { createRoot } from 'react-dom/client';
import Popup from '../popup/popup';


export default function Map({ centerZoom, coords = [[5.971817, 80.430288]], pointId, scroll_to, html_popup }) {
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
    const weligama = { lng: cz[1], lat: cz[0] };
    //console.log(weligama)

    const Roomz = () => {
        return (
            <div>
                <h3>Title</h3>
                <div> test div</div>
            </div>
        )
    }

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
            console.log("YEEEEEE")

            var image = await map.current.loadImage('/shoes.png');
            map.current.addImage('pinShoe', image.data);

            var imageSelected = await map.current.loadImage('/shoes_selected.png');
            map.current.addImage('pinShoeSelected', imageSelected.data);


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
                    'icon-image': 'pinShoe',
                },
                'paint': {}
            });


            map.current.on('mouseenter', 'points', (e) => {
                map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'points', (e) => {
                map.current.getCanvas().style.cursor = '';
            });

            map.current.on('click', getPoint);


        })


    }, [weligama, zoom]);

    useEffect(() => {
        if (html_popup !== '') {

            saved_html.current = html_popup

            show_popup()

        }

    }, [html_popup])

    function close_popup(e) {
        e.preventDefault()
        saved_popup.current.remove()
    }

    function show_popup() {
        //console.log(html_popup)
        let popupNode = document.createElement('div');
        const root = createRoot(popupNode);
        root.render(<Popup pop={saved_html.current} close={close_popup} />)
        saved_popup.current = new maptilersdk.Popup({ offset: 15 })
            .setLngLat(location.current)
            .setDOMContent(popupNode)
            .setMaxWidth(500)
            .addTo(map.current)
        saved_popup.current.addClassName(styles.visible)
    }


    function getRenderedFeatures(point) {
        //if the point is null, it is searched within the bounding box of the map view
        const features = map.current.queryRenderedFeatures(point, {
            layers: ['points']
        });
        return features;
    }

    function getPoint(e) {
        const features = getRenderedFeatures(e.point);


        if (features.length) {
            console.log("click")
            const element = features[0];
            location.current = element.geometry.coordinates
            scroll_to(element.properties.home_id)

            map.current.setLayoutProperty('points', 'icon-image',
                [
                    'match',
                    ['id'], // get the feature id (make sure your data has an id set or use generateIds for GeoJSON sources
                    element.id, 'pinShoeSelected', //image when id is the clicked feature id
                    'pinShoe' // default
                ]
            );

            //selectMapToList(element);
        } else {
            //cleanSelection();
        }

        if (saved_popup.current != null && !saved_popup.current.isOpen()) { //check if popup is closed and reopen it using useRef vars
            show_popup()
        }
    }
    if (map.current && pointId) { // LIST to MAP interaction
        function getFeatureOfPoint(point) {     //find features in the map viewport
            let feaurez = getRenderedFeatures()
            let find = feaurez.find((el) => {
                return el.properties.home_id == point
            })
            //console.log(find)
            if (find) {
                changeMarker(find.id) //if find then change color to selected
                // map.current.flyTo({
                //     center: find.geometry.coordinates
                // })
                return true
            }
            else return false
        }
        function changeMarker(id) {
            map.current.setLayoutProperty('points', 'icon-image',
                [
                    'match',
                    ['id'],
                    id, 'pinShoeSelected',
                    'pinShoe' // default
                ]
            );
        }


        const find_home = getFeatureOfPoint(pointId) // get features in the map viewport

        if (!find_home) { // if no then go search geojson
            const find_home_away = coords.find((el) => {
                return el.properties.home_id == pointId
            })
            if (find_home_away) {
                //map.current.setCenter(find_home_away.geometry.coordinates);
                let z = map.current.flyTo({ // go to geojson feature coordinates
                    center: find_home_away.geometry.coordinates
                })
                setTimeout(() => { //wait to load features to map viewport
                    getFeatureOfPoint(pointId) //call find features in the map viewport 
                }, 1000);

            }

        }

    }
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
        </div>
    )
}