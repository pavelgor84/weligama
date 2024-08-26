"use client"


//import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useRef, useState } from 'react'
import styles from './map.module.css'
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";


export default function Map({ centerZoom, coords = [[5.971817, 80.430288]], pointId }) {
    const geo = {
        "type": "FeatureCollection",
        "features": coords
    }
    console.log(pointId)

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
    const points = useRef({})
    const mark = useRef([0, 0])
    const prevMark = useRef([0, 0])
    // const weligama = { lng: 80.430288, lat: 5.971817 };
    const weligama = { lng: cz[1], lat: cz[0] };
    //console.log(weligama)

    maptilersdk.config.apiKey = process.env.MAPTILER_API;
    maptilersdk.config.caching = false;


    useEffect(() => {

        function markers(coords) {
            console.log(coords)
            for (let i = 0; i < coords.length; i++) {
                points.current[i] = new maptilersdk.Marker({ color: "#989ca3" })
                    .setLngLat([coords[i][1], coords[i][0]])
                    .setPopup(new maptilersdk.Popup().setHTML("&lt;h1&gt;Hello World!&lt;/h1&gt;"))
                    .addTo(map.current);
            }
            // points.current[i] = new maptilersdk.Marker({ color: "#989ca3" })
            //     .setLngLat([coords[i][1], coords[i][0]])
            //     .addTo(map.current);

        }


        function updateMarkers() {
            if ((mark.current[0] != cz[0]) && mark.current[1] != cz[1]) {
                prevMark.current = [...mark.current]
                mark.current = cz
            }


            for (const property in points.current) {
                //console.log(points.current[property]._lngLat.lat)
                //console.log(mark.current[1])
                if ((points.current[property]._lngLat.lat === mark.current[0]) && points.current[property]._lngLat.lng === mark.current[1]) {
                    console.log("Found new!!")
                    //points.current[property].remove()
                    points.current[property] = new maptilersdk.Marker({ color: "#FF0000" })
                        .setLngLat([mark.current[1], mark.current[0]])
                        .addTo(map.current);

                }
                if ((points.current[property]._lngLat.lat === prevMark.current[0]) && points.current[property]._lngLat.lng === prevMark.current[1]) {
                    //console.log("Found prev!!")
                    //points.current[property].remove()
                    points.current[property] = new maptilersdk.Marker({ color: "#989ca3" })
                        .setLngLat([prevMark.current[1], prevMark.current[0]])
                        .addTo(map.current);

                }

            }
        }

        if (map.current) {
            if ((mark.current[0] === cz[0]) && mark.current[1] === cz[1]) return
            //updateMarkers()
            // map.current.flyTo({
            //     center: [cz[1], cz[0]]
            // })
            //console.log(points)
            return;
        } // stops map from intializing more than once

        map.current = new maptilersdk.Map({
            container: mapContainer.current,
            style: maptilersdk.MapStyle.STREETS,
            center: [weligama.lng, weligama.lat],
            //center: weligama ? [weligama.lng, weligama.lat] : [80.430288, 5.971817],
            zoom: zoom
        });
        //markers(coords)
        map.current.on('load', async function () {
            console.log("YEEEEEE")

            var image = await map.current.loadImage('/shoes.png');
            map.current.addImage('pinShoe', image.data);

            var imageSelected = await map.current.loadImage('/shoes_selected.png');
            map.current.addImage('pinShoeSelected', imageSelected.data);


            map.current.addSource('marks', {
                type: 'geojson',
                // promoteId: 'id',
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

        // new maptilersdk.Marker({ color: "#FF0000" })
        //     .setLngLat([80.4282318764493, 5.978403170674758])
        //     .addTo(map.current);

    }, [weligama, zoom]);

    function getRenderedFeatures(point) {
        //if the point is null, it is searched within the bounding box of the map view
        const features = map.current.queryRenderedFeatures(point, {
            layers: ['points']
        });
        return features;
    }

    function getPoint(e) {
        const features = getRenderedFeatures(e.point);
        // const feaurez = getRenderedFeatures()
        // console.log(feaurez)
        console.log(features)
        if (features.length) {
            const element = features[0];
            //selectedItem = element.id;
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
    }
    if (map.current && pointId) { // LIST to MAP interaction
        const feaurez = getRenderedFeatures()
        const find_home = feaurez.find((el) => {
            return el.properties.home_id == pointId
        })
        console.log(find_home.id)
        console.log(feaurez)
        map.current.setLayoutProperty('points', 'icon-image',
            [
                'match',
                ['id'], // get the feature id (make sure your data has an id set or use generateIds for GeoJSON sources
                find_home.id, 'pinShoeSelected', //image when id is the clicked feature id
                'pinShoe' // default
            ]
        );
        //map.setCenter(item.dataset.lnglat.split(','));  < ----- make it life
        map.current.flyTo({
            center: find_home.geometry.coordinates
        })


    }

    return (
        <div className={styles.mapWrap}>
            <div ref={mapContainer} className={styles.map} />
        </div>
    )
}