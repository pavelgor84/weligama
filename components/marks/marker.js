"use client"
import { useEffect, useRef } from "react"
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { createPortal } from "react-dom";


const Marker = ({ map, feature, viewport }) => {
    const { geometry, properties } = feature
    //console.log('All points', allPoints)

    const markerRef = useRef()
    const contentRef = useRef(document.createElement("div"));

    useEffect(() => {
        markerRef.current = new maptilersdk.Marker({ element: contentRef.current })
            .setLngLat([geometry.coordinates[0], geometry.coordinates[1]])
            .addTo(map)

        return () => {
            markerRef.current.remove()
        }
    }, [])

    if (viewport) {
        return (
            <>
                {createPortal(
                    <div
                        style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: "50px",
                            backgroundColor: "#fff",
                            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.5)",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#333",
                            textAlign: "center",
                        }}
                    >
                        {properties.price}
                    </div>,
                    contentRef.current
                )}
            </>
        );
    }
    else {
        return (
            <>
                {createPortal(
                    <div
                        style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: "50px",
                            backgroundColor: "#fff",
                            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.5)",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#333",
                            textAlign: "center",
                            opacity: "0.7"
                        }}
                    >
                        ...
                    </div>,
                    contentRef.current
                )}
            </>
        );
    }
}

export default Marker