"use client"


import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import styles from './admin_edit.module.css'
import { createEditProperty } from '../shared/defaultPropertyState'
import { BED_TYPES, MAX_BEDS_PER_ROOM } from '../shared/bedTypes'
import { COUNTRIES } from '../shared/countries'
import { ADDRESS_LIMITS } from '../shared/addressValidation'
import { ALL_AMENITY_IDS } from '../shared/roomAmenityCatalog'
import RoomAmenities from '../shared/RoomAmenities'
import CoordinatePicker from '../coordinatePicker/maptiler'
import MessageBox from '../shared/MessageBox'

// Total rooms per property: max(1, added rooms) (matches server-side cap)
const MAX_ROOMS = 10
const MAX_IMAGES = 15
const MAX_IMAGES_PER_ROOM = 15

export default function AdminEdit({ email }) {
    const router = useRouter()

    const [inDB, setInDB] = useState(true)
    const [asset, setAsset] = useState([])
    const [property, setProperty] = useState(() => ({
        ...createEditProperty(email),
        _id: '',           // edit-only field from DB
        images: '',         // UI only — actual image data loaded from API
        rooms: '',          // UI only — loaded as object array from API
        totalRooms: 1,      // total rooms = max(1, added rooms)
        availableRooms: 1,  // currently unoccupied rooms
    }))

    const propertyRef = useRef(0)
    const isOccupied = useRef([])

    const [loading, setLoading] = useState(false)
    // Feedback message box: { id, type: 'success' | 'error', message } | null
    const [notice, setNotice] = useState(null)
    // Per-room bed-type <select> elements, read by the "Add the bed" button
    const bedSelectRefs = useRef({})

    const showNotice = (type, message) => setNotice({ id: Date.now(), type, message })
    const closeNotice = () => setNotice(null)

    const serverError = (e) => e?.response?.data?.error || e?.message || 'Unknown error'

    /**
     * Convert the current UI state into the DB-ready payload:
     * - coordinates "lat, lng" string → GeoJSON [lng, lat] array
     * - numRooms / availableRooms recomputed from rooms_info / occupied_rooms
     * Used by EVERY write path (info save, image upload, image delete) so a
     * pending text edit is never dropped by an image operation.
     */
    const buildPayload = (state) => {
        const payload = { ...state }

        if (payload.coordinates && typeof payload.coordinates === 'string') {
            const parts = payload.coordinates.split(',')
            if (parts.length >= 2) {
                const lat = parseFloat(parts[0].trim())
                const lng = parseFloat(parts[1].trim())
                payload.coordinates = (!isNaN(lat) && !isNaN(lng)) ? [lng, lat] : []
            }
        }

        const roomsInfo = Array.isArray(payload.rooms_info) ? payload.rooms_info : []
        const occupied = Array.isArray(payload.occupied_rooms) ? payload.occupied_rooms : []
        payload.numRooms = Math.max(1, roomsInfo.length)
        payload.availableRooms = Math.max(0, payload.numRooms - occupied.length)
        return payload
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['bedroom', 'bath', 'floor'].includes(name)) {
            setProperty(prev => ({ ...prev, [name]: Number(value) || 0 }))
        } else if (name === 'price') {
            setProperty(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }))
        } else {
            setProperty(prev => ({ ...prev, [name]: value }))
        }
    };

    // Nested address subdocument — generic handleChange only handles top-level names
    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setProperty(prev => ({ ...prev, address: { ...prev.address, [name]: value } }))
    };

    /**
     * Persist the property info (no images). Overrides let a handler save a
     * state change that has not been committed to React state yet.
     * After a successful save the form is reloaded from the DB so the page
     * always shows the stored values.
     */
    const saveInfo = async (overrides = {}, successMessage = 'Property information updated successfully.') => {
        try {
            setLoading(true)
            const payload = buildPayload({ ...property, ...overrides })
            const data = new FormData()
            data.set('prop', JSON.stringify(payload))
            const response = await axios.post('/api/add_images', data)
            await response.data
            await fetch_data()
            if (successMessage) showNotice('success', successMessage)
            return true
        } catch (e) {
            console.error('Save failed:', e)
            showNotice('error', serverError(e))
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleFileRoomChange = async (e) => { // SEND ROOM PICS
        const inputEl = e.target
        const fileList = Array.from(inputEl.files || [])
        if (fileList.length === 0) return

        const roomIndex = inputEl.name
        const roomImages = property.rooms && property.rooms[roomIndex] ? property.rooms[roomIndex] : []
        const existingCount = Array.isArray(roomImages) ? roomImages.length : 0
        const totalAfter = existingCount + fileList.length

        if (totalAfter > MAX_IMAGES_PER_ROOM) {
            alert('Maximum ' + MAX_IMAGES_PER_ROOM + ' images per room allowed. Room ' + (parseInt(roomIndex) + 1) + ' already has ' + existingCount + ', cannot add ' + fileList.length + '.');
            inputEl.value = ''
            return
        }

        const data = new FormData()

        for (let i = 0; i < fileList.length; i++) {
            data.append(fileList[i].name, fileList[i])
        }
        data.append('room', JSON.stringify({ "room": roomIndex, "id": property._id }))
        // Pending text edits (property/room descriptions, composition) are
        // saved in the same request — otherwise the reload below would
        // overwrite them with the stale values from the DB.
        data.append('prop', JSON.stringify(buildPayload(property)))

        try {
            setLoading(true)
            const response = await axios.post('/api/upload_room', data)
            await response.data
            inputEl.value = ''
            await fetch_data()
            showNotice('success', 'Room images uploaded successfully.')
        } catch (err) {
            console.error('Room image upload failed:', err)
            showNotice('error', serverError(err))
        } finally {
            setLoading(false)
        }
    };

    const handleFileImagesChange = async (e) => { // SEND IMAGES PICS
        const inputEl = e.target
        const fileList = Array.from(inputEl.files || [])
        if (fileList.length === 0) return

        const existingCount = property.images ? property.images.length : 0
        const totalAfter = existingCount + fileList.length

        if (totalAfter > MAX_IMAGES) {
            alert('Maximum ' + MAX_IMAGES + ' property images allowed. You already have ' + existingCount + ', cannot add ' + fileList.length + '.');
            inputEl.value = ''
            return
        }

        const data = new FormData()

        for (let i = 0; i < fileList.length; i++) {
            data.append(fileList[i].name, fileList[i])
        }
        // Full payload so pending text edits survive the image upload
        data.set('prop', JSON.stringify(buildPayload(property)))

        try {
            setLoading(true)
            const response = await axios.post('/api/add_images', data)
            await response.data
            inputEl.value = ''
            await fetch_data()
            showNotice('success', 'Property images uploaded successfully.')
        } catch (err) {
            console.error('Property image upload failed:', err)
            showNotice('error', serverError(err))
        } finally {
            setLoading(false)
        }
    };


    const handleInputChange = (e, index) => {
        const { name, value } = e.target;
        // Immutable update — never mutate an object held by state
        setProperty(prev => {
            const next = [...prev.rooms_info]
            next[index] = { ...next[index], [name]: value }
            return { ...prev, rooms_info: next }
        })
    };

    // Add a bed of the selected type to a room (max MAX_BEDS_PER_ROOM per room)
    const handleAddBed = (e, index) => {
        e.preventDefault()
        const beds = property.rooms_info[index].beds || []
        if (beds.length >= MAX_BEDS_PER_ROOM) {
            alert('Maximum ' + MAX_BEDS_PER_ROOM + ' beds per room allowed.')
            return
        }
        const selectEl = bedSelectRefs.current[index]
        const bedType = selectEl ? selectEl.value : ''
        if (!BED_TYPES.includes(bedType)) {
            alert('Please select a bed type first.')
            return
        }
        const newForms = [...property.rooms_info]
        newForms[index] = { ...newForms[index], beds: [...beds, bedType] }
        setProperty(prevState => ({ ...prevState, rooms_info: newForms }))
    }

    // Remove a bed by its position in the room's beds array
    const handleRemoveBed = (e, index, bedIndex) => {
        e.preventDefault()
        const beds = property.rooms_info[index].beds || []
        const newForms = [...property.rooms_info]
        newForms[index] = { ...newForms[index], beds: beds.filter((_, i) => i !== bedIndex) }
        setProperty(prevState => ({ ...prevState, rooms_info: newForms }))
    }

    // Replace a room's selected amenities (full id list from the modal Confirm
    // or a single-item remove — both arrive as the complete new list)
    const handleRoomAmenities = (index, ids) => {
        const newForms = [...property.rooms_info]
        newForms[index] = { ...newForms[index], amenities: ids }
        setProperty(prevState => ({ ...prevState, rooms_info: newForms }))
    }

    // --- Housing composition (add / remove rooms) in edit mode -------------

    const handleAddRoom = (e) => {
        e.preventDefault()
        const roomsInfo = Array.isArray(property.rooms_info) ? property.rooms_info : []
        if (roomsInfo.length >= MAX_ROOMS) {
            alert('Maximum ' + MAX_ROOMS + ' rooms per property allowed.')
            return
        }
        const next = [...roomsInfo, { info: '', id: Date.now(), beds: [], amenities: [] }]
        setProperty(prev => ({ ...prev, rooms_info: next }))
        // Persist the composition change immediately so it is never lost by a
        // later image upload/delete, and report it.
        saveInfo({ rooms_info: next }, `Room ${next.length} added successfully.`)
    }

    const handleDeleteRoom = async (e, index) => {
        e.preventDefault()
        const roomsInfo = Array.isArray(property.rooms_info) ? property.rooms_info : []
        const roomImages = (property.rooms && property.rooms[index]) ? property.rooms[index] : []
        const deleteIds = (Array.isArray(roomImages) ? roomImages : [])
            .map((img) => img?.public_id)
            .filter(Boolean)

        if (!confirm(`Delete room ${index + 1}?` + (deleteIds.length ? ' Its photos will be deleted too.' : ''))) {
            return
        }

        const nextRoomsInfo = roomsInfo.filter((_, i) => i !== index)
        const nextRooms = (Array.isArray(property.rooms) ? property.rooms : []).filter((_, i) => i !== index)
        // Occupancy is stored as room index strings — renumber after the shift
        const nextOccupied = (Array.isArray(property.occupied_rooms) ? property.occupied_rooms : [])
            .map(Number)
            .filter((n) => n !== index)
            .map((n) => String(n > index ? n - 1 : n))

        isOccupied.current = nextOccupied
        const payload = buildPayload({ ...property, rooms_info: nextRoomsInfo, rooms: nextRooms, occupied_rooms: nextOccupied })
        payload.deleteRoomImages = deleteIds

        try {
            setLoading(true)
            const response = await fetch('/api/delete', {
                method: "POST",
                body: JSON.stringify(payload)
            })
            if (!response.ok) throw new Error(await response.text())
            await response.json()
            await fetch_data()
            showNotice('success', `Room ${index + 1} deleted successfully.`)
        } catch (err) {
            console.error('Delete room failed:', err)
            showNotice('error', serverError(err))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
        }
        await saveInfo()
    };

    const handleCheckboxChange = (roomId) => {   // toggle Occupied room
        const current = Array.isArray(property.occupied_rooms) ? property.occupied_rooms : []
        // Never mutate the state array in place — build a new one
        const next = current.includes(roomId)
            ? current.filter((id) => id !== roomId)
            : [...current, roomId]

        isOccupied.current = next
        setProperty((prev) => ({ ...prev, occupied_rooms: next }))

        // Auto-save the availability change (silent — no success box)
        saveInfo({ occupied_rooms: next }, null)
    };

    /** Convert any null/undefined values to safe defaults for controlled inputs. */
    const normalize = (obj) => {
        return {
            ...obj,
            name: obj.name ?? '',
            phone: obj.phone ?? '',
            // Legacy docs may have no address (or a partial one) — merge over the
            // empty shape so controlled inputs never see undefined.
            address: {
                country: '', region: '', city: '', district: '',
                street: '', houseNumber: '', postalCode: '',
                ...(obj.address && typeof obj.address === 'object' ? obj.address : {}),
            },
            coordinates: obj.coordinates ?? '',
            bedroom: obj.bedroom ?? 0,
            bath: obj.bath ?? 0,
            ac: typeof obj.ac === 'boolean' ? obj.ac : false,
            view: obj.view ?? '',
            floor: obj.floor ?? 0,
            parking: typeof obj.parking === 'boolean' ? obj.parking : false,
            price: obj.price ?? 0,
            available: typeof obj.available === 'boolean' ? obj.available : true,
            description: obj.description ?? '',
            images: Array.isArray(obj.images) ? obj.images : [],
            rooms: Array.isArray(obj.rooms) ? obj.rooms : [],
            rooms_info: Array.isArray(obj.rooms_info)
                ? obj.rooms_info.map(r => ({
                    ...r,
                    info: r.info ?? '',
                    beds: Array.isArray(r.beds) ? r.beds : [],
                    // Safeguard for legacy DB documents that predate the
                    // amenities field (undefined → []), and filter out any
                    // unknown/stale ids so only valid catalog ids reach the UI.
                    amenities: Array.isArray(r.amenities)
                        ? r.amenities.filter(id => ALL_AMENITY_IDS.has(id))
                        : [],
                }))
                : [],
            occupied_rooms: Array.isArray(obj.occupied_rooms) ? obj.occupied_rooms : [],
            totalRooms: typeof obj.totalRooms === 'number' ? obj.totalRooms : 1,
            availableRooms: typeof obj.availableRooms === 'number' ? obj.availableRooms : 1,
        }
    }

    async function fetch_data() {
        try {
            const response = await fetch('/api/get_data_edit', {
                method: "POST",
                body: JSON.stringify(email)
            })
            const json = await response.json()

            if (!Array.isArray(json) || json.length === 0) { // no assets in DB → empty state
                console.log("no data")
                setInDB(false)
                return
            }

            setAsset(json)

            // Stale index guard: the pointed property may have been deleted
            let dbData = json[propertyRef.current]
            if (!dbData) {
                propertyRef.current = 0
                dbData = json[0]
            }
            if (!dbData) {
                const empty = createEditProperty(email);
                setProperty({ ...empty, _id: '', images: '', rooms: '', occupied_rooms: empty.occupied_rooms });
                return
            }

            // TRANSFORM coordinates: DB GeoJSON [lng, lat] → user-friendly "lat, lng"
            if (dbData.coordinates && Array.isArray(dbData.coordinates)) {
                const [lng, lat] = dbData.coordinates;
                dbData.coordinates = `${lat}, ${lng}`;
            }

            const normalized = normalize(dbData)
            // Keep the occupancy ref in sync with the loaded property, otherwise
            // the next save would wipe the stored occupancy list.
            isOccupied.current = normalized.occupied_rooms
            setProperty(normalized)
        } catch (e) {
            console.error('Failed to load properties:', e)
            showNotice('error', 'Failed to load property data.')
        }
    }

    useEffect(() => {
        fetch_data()
    }, []);

    const selection = asset.map((opt) => {
        return (<option key={opt._id} value={opt.name}>{opt.name}</option>)
    })

    const imageSet = property.images ? property.images.map((im) => {
        return (
            <div className={styles.thumbnail_container} key={im.public_id} >
                <button className={styles.delete_btn} id={im.public_id} onClick={(e) => handleDelete(e.target.id)} disabled={loading}>x</button>
                <img src={im.src} width='60px' height='60px' />
            </div>
        )
    }) : null


    // Rooms are rendered from rooms_info (the housing composition), NOT from
    // the rooms image arrays — a room added in edit mode has no image array
    // yet and still needs its description/beds/amenities block.
    const rooms = (property.rooms_info || []).map((roomInfo, index) => {
        const roomImages = (property.rooms && property.rooms[index]) || []

        return (
            <div key={roomInfo.id ?? index} className={styles.form_section} style={{ backgroundColor: property.occupied_rooms.includes(index.toString()) && 'crimson' }}>
                <div className={styles.room_header}>
                    <h2 className={styles.section_title}>Room {index + 1}</h2>
                    <button type="button" className={styles.roomButton_del} onClick={(e) => handleDeleteRoom(e, index)} disabled={loading}>Delete room</button>
                </div>

                <p className={styles.section_description}>Change photos of the room.</p>
                <div className={styles.images}>
                    {roomImages.map((room) => {
                        return (
                            <div className={styles.thumbnail_container} key={room.public_id} >
                                <button className={styles.delete_btn} id={room.public_id} onClick={(e) => handleDelete(e.target.id, index)} disabled={loading}>x</button>
                                <img src={room.src} width='60px' height='60px' />
                            </div>
                        )
                    })}
                </div>
                <div className={styles.inputRoomImages}>
                    <p className={styles.section_description}> Upload new images </p>
                    <input className={styles.file_input} type="file" name={index} multiple onChange={handleFileRoomChange} disabled={loading} />
                </div>
                <p className={styles.section_description}>Room description</p>

                <textarea className={styles.text_input} placeholder="Describe this room in detail..." rows="4" name="info" value={roomInfo.info || ''}
                    onChange={(e) => handleInputChange(e, index)} />

                {/* <!-- Beds --> */}
                <div className={styles.beds_section}>
                    <p className={styles.section_description}>Beds</p>
                    <ul className={styles.beds_list}>
                        {(roomInfo.beds || []).map((bed, bedIndex) => (
                            <li key={bedIndex} className={styles.bed_item}>
                                {bed}
                                <button type="button" className={styles.bed_remove} onClick={(e) => handleRemoveBed(e, index, bedIndex)} disabled={loading} aria-label={'Remove ' + bed}>x</button>
                            </li>
                        ))}
                    </ul>
                    <div className={styles.bed_add_row}>
                        <select
                            className={styles.beds_select}
                            name={'bed_type_' + index}
                            ref={(el) => { bedSelectRefs.current[index] = el }}
                            defaultValue=""
                            disabled={loading || (roomInfo.beds || []).length >= MAX_BEDS_PER_ROOM}
                        >
                            <option value="">Select bed type</option>
                            {BED_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <button type="button" className={styles.roomButton} onClick={(e) => handleAddBed(e, index)} disabled={loading || (roomInfo.beds || []).length >= MAX_BEDS_PER_ROOM}>Add the bed</button>
                    </div>
                </div>

                {/* <!-- Additional amenities in this room --> */}
                <RoomAmenities
                    amenities={roomInfo.amenities || []}
                    onConfirm={(ids) => handleRoomAmenities(index, ids)}
                    disabled={loading}
                />

                <div className={styles.submit_room}>
                    <button className={styles.roomButton} disabled={loading} form="submit_form" type="submit">Save</button>
                </div>

                <div className={styles.occupied} >
                    <label>
                        <input
                            type="checkbox"
                            checked={property.occupied_rooms.includes(index.toString())}
                            onChange={() => handleCheckboxChange(index.toString())}
                        />
                        Occupied
                    </label>
                </div>

            </div>
        )
    })


    function handleSelect(item) {
        let position = asset.findIndex(obj => obj.name == item)
        const dbData = asset[position];
        if (!dbData) return;
        // TRANSFORM coordinates: Convert DB GeoJSON format to user-friendly string (same as fetch_data)
        const displayData = { ...dbData };
        if (displayData.coordinates && Array.isArray(displayData.coordinates)) {
            const [lng, lat] = displayData.coordinates;
            displayData.coordinates = `${lat}, ${lng}`;  // User-friendly format for display
        }
        const normalized = normalize(displayData)
        isOccupied.current = normalized.occupied_rooms
        setProperty(normalized);
        propertyRef.current = position // update ref to current property number in array

    }

    function handleDelete(itemName, index_of_arr) { //delete image

        function sendForDelete(propertyState) {
            fetch('/api/delete', {
                method: "POST",
                body: JSON.stringify(propertyState)
            })
                .then((response) => {
                    if (!response.ok) return response.text().then(text => { throw new Error(text) })
                    return response.json()
                })
                .then(async () => {
                    await fetch_data()
                })
                .catch((err) => {
                    console.error('Delete failed:', err)
                    showNotice('error', 'Failed to delete image: ' + serverError(err))
                })
        }

        const currentImages = Array.isArray(property.images) ? property.images : []
        const currentRooms = Array.isArray(property.rooms) ? property.rooms : []

        let checkForDeleteImages = currentImages.find((item) => item.public_id === itemName)
        let flat_rooms_arr = currentRooms.flat()
        let checkToDeleteRoomsImages = flat_rooms_arr.find((item) => item.public_id === itemName)

        if (checkForDeleteImages) {
            const imageToFilter = currentImages.filter((item) => item.public_id != itemName)
            // buildPayload keeps pending text edits in the same request
            let propertyState = buildPayload({ ...property, images: imageToFilter })
            propertyState.delete = checkForDeleteImages
            sendForDelete(propertyState)

        }
        if (checkToDeleteRoomsImages) {
            const roomArr = Array.isArray(currentRooms[index_of_arr]) ? currentRooms[index_of_arr] : []
            const delIndex = roomArr.findIndex((item) => item.public_id == itemName)
            if (delIndex == -1) {
                console.log("IMAGE NOT FOUND!")
                return
            }
            // Copy instead of mutating state in place
            const nextRooms = currentRooms.map((arr, i) =>
                i === index_of_arr ? arr.filter((item) => item.public_id !== itemName) : arr
            )
            let propertyState = buildPayload({ ...property, rooms: nextRooms })
            propertyState.delete = checkToDeleteRoomsImages
            sendForDelete(propertyState)

        }
    }
    function handleDeleteProperty() {
        const confirmAction = confirm(`Are you sure to delete ${property.name}?`)
        if (confirmAction) {
            fetch('/api/delete_asset', {
                method: "POST",
                body: JSON.stringify(property)
            })
                .then((response) => {
                    if (!response.ok) return response.text().then(text => { throw new Error(text) })
                    return response.json()
                })
                .then(async () => {
                    propertyRef.current = 0 // reset to first remaining property before reload

                    // If this was the last property, redirect to admin menu to create new one
                    const assetArray = Array.isArray(asset) ? asset : []
                    if (assetArray.length <= 1) {
                        router.push('/admin')
                    } else {
                        await fetch_data()
                        showNotice('success', 'Property deleted successfully.')
                    }
                })
                .catch((err) => {
                    console.error('Delete property failed:', err)
                    showNotice('error', serverError(err))
                })
        }

    }
    const handleTogglechange = (e) => {
        const { name } = e.target;
        setProperty(prevState => ({ ...prevState, [name]: !prevState[name] }));
    }


    if (!inDB) {
        return (
            <>
                <div className={styles.container}>
                    <div className={styles.menu}>
                        <div className={styles.left_items}>
                            <div className={styles.logo}>
                                PropertyHub
                            </div>
                            <div className={styles.left_links}>
                                <a href='/admin'>Add property</a>

                            </div>
                        </div>
                        <div className={styles.right_items}>
                            <div className={styles.email}>{email}</div>
                        </div>
                    </div>
                </div>
                <div className={styles.main_content_noDB}>
                    <div className={styles.form_section}>
                        <h2 className={styles.section_title}>You have no properties added yet.</h2>
                    </div>
                </div>
            </>
        )

    }
    if (asset.length != 0) {
        return (

            <>
                <MessageBox notice={notice} onClose={closeNotice} />
                <div className={styles.container}>
                    <div className={styles.menu}>
                        <div className={styles.left_items}>
                            <div className={styles.logo}>
                                PropertyHub
                            </div>
                            <div className={styles.left_links}>
                                <a href='/admin'>Add property</a>
                                <div className={styles.select_container}>
                                    Select
                                    <div className={styles.dropdown_container}>
                                        <select className={styles.dropdown_select} name="property" id="property_list" onChange={e => handleSelect(e.target.value)}>
                                            {selection}
                                        </select>
                                        <div className={styles.dropdown_icon}>
                                            <svg className={styles.dropdown_svg} fill="currentColor" viewBox="0 0 20 20">
                                                <path clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" fillRule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.right_items}>
                            <div className={styles.email}>{email}</div>
                        </div>
                    </div>
                </div>

                {/* <!-- Main Content --> */}
                <div className={styles.main_content}>
                    <div>
                        <form id='submit_form' className={styles.form_space} onSubmit={handleSubmit}>
                            {/* <!-- Basic Information --> */}
                            <div className={styles.form_section}>
                                <h2 className={styles.section_title}>Basic Information</h2>
                                <p className={styles.section_description}>
                                    Essential details about the property.
                                </p>
                                <div className={styles.input_group}>
                                    <div>
                                        <label className={styles.input_label}>Property Name</label>
                                        <input className={styles.text_input} type="text" placeholder='e.g., Villa South' name="name" value={property.name} onChange={handleChange} required />
                                    </div>
                                    {/* Address — all parts optional, country is an ISO alpha-2 code */}
                                    <div className={styles.address_grid}>
                                        <div>
                                            <label className={styles.input_label}>Country</label>
                                            <select className={styles.text_input} name="country" value={property.address.country} onChange={handleAddressChange}>
                                                <option value="">Select country</option>
                                                {COUNTRIES.map((c) => (
                                                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={styles.input_label}>Region</label>
                                            <input className={styles.text_input} type="text" placeholder='e.g., Galle' name="region" value={property.address.region} onChange={handleAddressChange} maxLength={ADDRESS_LIMITS.region} />
                                        </div>
                                        <div>
                                            <label className={styles.input_label}>City</label>
                                            <input className={styles.text_input} type="text" placeholder='e.g., Weligama' name="city" value={property.address.city} onChange={handleAddressChange} maxLength={ADDRESS_LIMITS.city} />
                                        </div>
                                        <div>
                                            <label className={styles.input_label}>District</label>
                                            <input className={styles.text_input} type="text" placeholder='e.g., Matara' name="district" value={property.address.district} onChange={handleAddressChange} maxLength={ADDRESS_LIMITS.district} />
                                        </div>
                                        <div>
                                            <label className={styles.input_label}>Street</label>
                                            <input className={styles.text_input} type="text" placeholder='e.g., Galle Road' name="street" value={property.address.street} onChange={handleAddressChange} maxLength={ADDRESS_LIMITS.street} />
                                        </div>
                                        <div>
                                            <label className={styles.input_label}>House number</label>
                                            <input className={styles.text_input} type="text" placeholder='e.g., 12' name="houseNumber" value={property.address.houseNumber} onChange={handleAddressChange} maxLength={ADDRESS_LIMITS.houseNumber} />
                                        </div>
                                        <div>
                                            <label className={styles.input_label}>Postal code</label>
                                            <input className={styles.text_input} type="text" placeholder='e.g., 81200' name="postalCode" value={property.address.postalCode} onChange={handleAddressChange} maxLength={ADDRESS_LIMITS.postalCode} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={styles.input_label}>Phone Number</label>
                                        <input className={styles.text_input} placeholder="e.g., +1 555 123 4567" type="tel" name="phone" value={property.phone} onChange={handleChange} required />
                                    </div>
                                    <div className={styles.coordinates_wrapper}>
                                        <label className={styles.input_label}>Coordinates</label>
                                        <input className={styles.text_input} type="text" placeholder='e.g., 5.9744140972131685, 80.43011706614641' name="coordinates" value={property.coordinates} onChange={handleChange} required />
                                        <CoordinatePicker value={property.coordinates} onChange={(coordStr) => handleChange({ target: { name: 'coordinates', value: coordStr } })} />
                                    </div>
                                </div>
                            </div>

                            {/* <!-- Spatial & Features --> */}
                            <div className={styles.form_section}>
                                <h2 className={styles.section_title}>
                                    Spatial &amp; Features
                                </h2>
                                <div className={styles.grid_inputs}>
                                    <div>
                                        <label className={styles.input_label}>Number of Bedrooms</label>
                                        <input className={styles.text_input} placeholder="e.g., 3" type="number" name="bedroom" max="99" value={property.bedroom} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className={styles.input_label}>Number of Bathrooms</label>
                                        <input className={styles.text_input} placeholder="e.g., 2" type="number" name="bath" max="99" value={property.bath} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className={styles.input_label}>Number of Floors</label>
                                        <input className={styles.text_input} placeholder="e.g., 2" type="number" name="floor" max="99" value={property.floor} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className={styles.input_label}>Number of Rooms</label>
                                        <input className={styles.text_input} type="number" readOnly value={Math.max(1, (property.rooms_info || []).length)} title="Updates automatically when you add rooms" />
                                    </div>
                                    <div>
                                        <label className={styles.input_label}>View</label>
                                        <select className={styles.text_input} name="view" value={property.view} onChange={handleChange} required>
                                            <option value="">Select view</option>
                                            <option value="Ocean">Ocean</option>
                                            <option value="Beach">Beach</option>
                                            <option value="Lake">Lake</option>
                                            <option value="Lagoon">Lagoon</option>
                                            <option value="City">City</option>
                                            <option value="Mountain">Mountain</option>
                                            <option value="River">River</option>
                                            <option value="Forest">Forest</option>
                                            <option value="Sunset">Sunset</option>
                                            <option value="Garden">Garden</option>
                                            <option value="Road">Road</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.radio_group}>
                                    <div className={styles.toggle_container}>
                                        <div>
                                            <p className={styles.section_description}>
                                                Air Conditioner
                                            </p>
                                        </div>
                                        <label className={styles.toggle_switch}>
                                            <input className={styles.toggle_input} type="checkbox" name='ac' checked={property.ac} onChange={handleTogglechange} />
                                            <div className={styles.toggle_slider}></div>
                                        </label>
                                    </div>

                                    <div className={styles.toggle_container}>
                                        <div>
                                            <p className={styles.section_description}>
                                                Parking
                                            </p>
                                        </div>
                                        <label className={styles.toggle_switch}>
                                            <input className={styles.toggle_input} type="checkbox" name='parking' checked={property.parking} onChange={handleTogglechange} />
                                            <div className={styles.toggle_slider}></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {/* <!-- Pricing --> */}
                            <div className={styles.form_section}>
                                <h2 className={styles.section_title}>Pricing</h2>
                                <div>
                                    <label className={styles.input_label}>Price for a day (USD)</label>
                                    <div className={styles.price_input}>
                                        <input className={styles.text_input} placeholder="e.g., 15000" type="text" name="price" value={property.price} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>
                            {/* <!-- Description --> */}
                            <div className={styles.form_section}>
                                <h2 className={styles.section_title}>Property Description</h2>
                                <textarea className={styles.text_input} placeholder="Describe the property in detail..." rows="4" name="description" value={property.description || ''} onChange={handleChange} required></textarea>
                            </div>


                        </form>
                    </div >
                    {/* <!-- Rooms / housing composition --> */}
                    <div className={styles.room_block}>
                        <div className={styles.add_rooms_block}>
                            <h2 className={styles.section_title}>If you have separate rooms:</h2>
                            <button type="button" className={styles.roomButton} disabled={loading || (property.rooms_info || []).length >= MAX_ROOMS} onClick={handleAddRoom}>Add room</button>
                        </div>
                        {rooms}
                    </div>

                    {/* <!-- Right Side: Pricing, Description, Images, and Search Visibility --> */}
                    <div className={styles.right_section}>
                        {/* <!-- Images --> */}
                        <div className={styles.form_section}>
                            <h2 className={styles.section_title}>Property Images</h2>
                            <p className={styles.section_description}>
                                Change photos of the property.
                            </p>

                            <div className={styles.images_container}>
                                <div className={styles.images}>
                                    {imageSet}
                                </div>
                            </div>
                            <p className={styles.section_description}>
                                Upload new images.
                            </p>
                            <input className={styles.file_input} type="file" name="images" multiple disabled={loading} onChange={handleFileImagesChange} />
                        </div>

                        {/* <!-- Search Visibility Toggle --> */}
                        <div className={styles.form_section}>
                            <div className={styles.toggle_container}>
                                <div>
                                    <h2 className={styles.section_title}>
                                        Show in Search Results
                                    </h2>
                                    <p className={styles.section_description}>
                                        Control listing visibility
                                    </p>
                                </div>
                                <label className={styles.toggle_switch}>
                                    <input className={styles.toggle_input} type="checkbox" name='available' checked={property.available} onChange={handleTogglechange} />
                                    <div className={styles.toggle_slider}></div>
                                </label>
                            </div>
                        </div>
                        <button className={styles.submit_button} form='submit_form' disabled={loading} type="submit">Update Property Information</button>
                    </div>
                    <button className={styles.del_button} disabled={loading} onClick={() => handleDeleteProperty()}>Delete Property</button>


                </div >
            </>
        )
    }
    else {
        return (
            <>
                <div className={styles.container}>
                    <div className={styles.menu}>
                        <div className={styles.left_items}>
                            <div className={styles.logo}>
                                PropertyHub
                            </div>
                            <div className={styles.left_links}>
                                <a href='/admin'>Add property</a>

                            </div>
                        </div>
                        <div className={styles.right_items}>
                            <div className={styles.email}>{email}</div>
                        </div>
                    </div>
                </div>
                <div className={styles.main_content_noDB}>
                    <div className={styles.form_section}>
                        <h2 className={styles.section_title}>Checking...</h2>
                    </div>
                </div>
            </>
        )

    }

}
