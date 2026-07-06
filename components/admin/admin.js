"use client"

import React, { useState } from 'react'
import styles from './list.module.css'
import axios from 'axios'
import { createAddProperty } from '../shared/defaultPropertyState'

/** Transform UI coordinate string "lat, lng" → DB array [lng, lat] */
function transformCoordinatesForDB(coords) {
    if (!coords || typeof coords !== 'string') return []
    const parts = String(coords).split(',').map(s => parseFloat(s.trim()))
    // Return [lng, lat] for GeoJSON/Maptiler storage format
    return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])
        ? [parts[1], parts[0]]   // DB stores [lng, lat]
        : []
}

export default function Admin({ email }) {
    const [property, setProperty] = useState(createAddProperty(email))
    const [file, setFile] = useState([])
    const [room, setRoom] = useState([])
    const [loading, setLoading] = useState(false)

    // Add a new room entry
    const handleAddPerson = (e) => {
        e.preventDefault()
        setProperty(prevState => ({
            ...prevState,
            rooms_info: [...prevState.rooms_info, { info: '', id: Date.now() }]
        }))
    }

    // Update text field — coerce number fields to actual Numbers for DB schema
    const handleChange = (e) => {
        const { name, value } = e.target
        if (['bedroom', 'bath', 'floor'].includes(name)) {
            setProperty(prev => ({ ...prev, [name]: Number(value) || 0 }))
        } else if (name === 'price') {
            setProperty(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }))
        } else {
            setProperty(prev => ({ ...prev, [name]: value }))
        }
    }

    // Boolean toggle handler — sets true/false to match DB schema (not "Yes"/"No")
    const handleBooleanChange = (e) => {
        const { name } = e.target
        // For radio buttons: value is "true"/"false", convert to actual boolean
        setProperty(prev => ({ ...prev, [name]: e.target.value === 'true' }))
    }

    const handleFileChange = (e) => {
        const _files = Array.from(e.target.files)
        setFile(_files)
    }

    const handleRoomChange = (e) => {
        const _roomFiles = Array.from(e.target.files)
        setRoom(prevState => [...prevState, _roomFiles])
    }

    // Update room info text field
    const handleInputChange = (e, index) => {
        const { name, value } = e.target
        const newForms = [...property.rooms_info]
        newForms[index][name] = value
        setProperty(prevState => ({ ...prevState, rooms_info: newForms }))
    }

    // Delete a room entry
    const handleDeleteRoom = (e, index) => {
        e.preventDefault()
        const newForms = [...property.rooms_info]
        newForms.splice(index, 1)
        setProperty(prevState => ({ ...prevState, rooms_info: newForms }))
        const roomFiles = [...room]
        roomFiles.splice(index, 1)
        setRoom(roomFiles)
    }

    // Send room images to server
    async function sendRoomData(data) {
        try {
            await axios.post('/api/upload_room', data)
        } catch (e) {
            console.error(e)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!file || file.length === 0) {
            console.log("insufficient pics")
            return
        }

        setLoading(true)

        try {
            // Deep clone and transform coordinates before sending to DB
            const submissionData = JSON.parse(JSON.stringify(property))
            submissionData.coordinates = transformCoordinatesForDB(submissionData.coordinates)

            const data = new FormData()

            // Append property images
            file.forEach((image, i) => {
                data.append(image.name, image)
            })

            // Append room images (array of FileLists)
            data.append('rooms', room)

            // Send property JSON with proper types and transformed coordinates
            data.append('prop', JSON.stringify(submissionData))

            const response = await axios.post('/api/upload', data)
            const result = await response.data
            console.log({ result })

            // Extract property ID for room uploads
            const id = result.msg._id

            // Upload room images with associated property ID
            if (room.length > 0) {
                for (const key in room) {
                    if (Array.isArray(room[key]) && room[key].length > 0) {
                        const roomData = new FormData()
                        const roomInfo = { "room": `room${Number(key) + 1}`, "id": id }

                        room[key].forEach((image, i) => {
                            roomData.append(image.name, image)
                        })
                        roomData.append('room', JSON.stringify(roomInfo))
                        await sendRoomData(roomData)
                    }
                }
            }

            // Reset form to empty state matching schema defaults
            setProperty(createAddProperty(email))

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className={styles.section}>
            <div className={styles.block}>
                <h2>Add property for {email}</h2>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <table>
                        <tbody>
                            <tr>
                                <th align='right'><label>Available:</label></th>
                                <th align='left'>
                                    <label>
                                        <input type="radio" name="available" value="true" checked={property.available === true} onChange={handleBooleanChange} /> Yes
                                    </label>
                                    <label>
                                        <input type="radio" name="available" value="false" checked={property.available === false} onChange={handleBooleanChange} /> No
                                    </label>
                                </th>
                            </tr>

                            <tr>
                                <th align='right'><label>Property Name:</label></th>
                                <th align='left'><input type="text" placeholder='Villa South' name="name" value={property.name} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Phone number:</label></th>
                                <th align='left'><input type="text" placeholder='+190****7474' name="phone" value={property.phone} onChange={handleChange} required /></th>
                            </tr>
                            <tr align='right'>
                                <th align='right'></th>
                                <th align='left' className={styles.info}> Copy and paste coordinates from Google maps. Like 5.9744140972131685, 80.43011706614641</th>
                            </tr>
                            <tr>
                                <th align='right'><label>Coordinates:</label></th>
                                <th align='left'><input type="text" placeholder='5.9744140972131685, 80.43011706614641' name="coordinates" value={property.coordinates} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Number of Bedrooms:</label></th>
                                <th align='left'><input type="number" name="bedroom" max="99" value={property.bedroom} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'> <label>Number of Bathrooms:</label> </th>
                                <th align='left'> <input type="number" name="bath" max="99" value={property.bath} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>A/C:</label></th>
                                <th align='left'>
                                    <label>
                                        <input type="radio" name="ac" value="true" checked={property.ac === true} onChange={handleBooleanChange} /> Yes
                                    </label>
                                    <label>
                                        <input type="radio" name="ac" value="false" checked={property.ac === false} onChange={handleBooleanChange} /> No
                                    </label>
                                </th>
                            </tr>
                            <tr>
                                <th align='right'><label>View:</label></th>
                                <th align='left'><input type="text" name="view" value={property.view} onChange={handleChange} /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Number of floors:</label></th>
                                <th align='left'><input type="number" name="floor" max="99" value={property.floor} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Parking:</label></th>
                                <th align='left'>
                                    <label>
                                        <input type="radio" name="parking" value="true" checked={property.parking === true} onChange={handleBooleanChange} /> Yes
                                    </label>
                                    <label>
                                        <input type="radio" name="parking" value="false" checked={property.parking === false} onChange={handleBooleanChange} /> No
                                    </label>
                                </th>
                            </tr>

                            <tr>
                                <th align='right'><label>Price:</label></th>
                                <th align='left'><input type="text" placeholder='Price for a day' name="price" value={property.price} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Property description:</label></th>
                                <th align='left'><textarea name="description" value={property.description || ''} onChange={handleChange} /> </th>
                            </tr>
                            <tr>
                                <th align='right'><label>Images:</label></th>
                                <th align='left'><input type="file" name="images" multiple onChange={handleFileChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'></th>
                                <th align='left'>If you have separate rooms:</th>

                            </tr>
                            <tr>
                                <th align='right'></th>
                                <th align='left'><button onClick={(e) => handleAddPerson(e)}>Add room</button></th>
                            </tr>
                            {property.rooms_info.map((form, index) => (
                                <React.Fragment key={form.id} >
                                    <tr >
                                        <th align='right'><label>Room {index + 1}:</label></th>
                                        <th align='left'><input type="file" name={`room_${index}`} multiple onChange={handleRoomChange} /></th>
                                    </tr>
                                    <tr >
                                        <th align='right'><label>Room {index + 1} description:</label></th>
                                        <th align='left'><textarea name='info' value={form.info} onChange={(e) => handleInputChange(e, index)} /></th>
                                    </tr>
                                    <tr >
                                        <th align='right'><label>Delete room {index + 1}</label></th>
                                        <th align='left'><button onClick={(e) => handleDeleteRoom(e, index)}>Delete </button></th>
                                    </tr>
                                </React.Fragment>


                            ))}

                        </tbody>
                    </table>
                    <div>


                    </div>


                    <button className={styles.button} disabled={loading} type="submit">Submit</button>
                </form>

            </div>


        </section>
    )
}
