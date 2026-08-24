"use client"


import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import styles from './admin_edit.module.css'
import { createEditProperty } from '../shared/defaultPropertyState'
import CoordinatePicker from '../coordinatePicker/maptiler'

export default function AdminEdit({ email }) {
    const router = useRouter()

    const [inDB, setInDB] = useState(true)
    const [asset, setAsset] = useState([])
    // console.log(asset)
    const [property, setProperty] = useState(() => ({
        ...createEditProperty(email),
        _id: '',           // edit-only field from DB
        images: '',         // UI only — actual image data loaded from API
        rooms: '',          // UI only — loaded as object array from API
    }));
    console.log(property)


    //console.log(JSON.stringify(currentRef.current))
    const propertyRef = useRef(0)
    const isOccupied = useRef([])

    const [loading, setLoading] = useState(false)

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

    async function send_data(data, where) {
        try {
            const response = await axios.post(where, data)
            const result = await response.data
            console.log({ result })
            fetch_data()

        }
        catch (e) {
            console.error(e)
        }
    }

    const handleFileRoomChange = (e) => { // SEND ROOM PICS
        //console.log(e.target.name)
        const fileList = e.target.files
        const data = new FormData()

        for (let i = 0; i < fileList.length; i++) {
            data.append(fileList[i].name, fileList[i])
        }
        let room_info = { "room": e.target.name, "id": property._id }
        data.append('room', JSON.stringify(room_info))
        send_data(data, '/api/upload_room')

    };
    const handleFileImagesChange = (e) => { // SEND IMAGES PICS
        console.log(e.target.name)
        const fileList = e.target.files
        const data = new FormData()

        for (let i = 0; i < fileList.length; i++) {
            data.append(fileList[i].name, fileList[i])
        }
        data.set('prop', JSON.stringify(property))

        try {
            setLoading(true)

            send_data(data, '/api/add_images')

        } catch (e) {
            console.log(e)
        } finally {

            setLoading(false)
        }

    };


    const handleInputChange = (e, index) => {
        console.log(e)
        const { name, value } = e.target;
        const newForms = [...property.rooms_info];
        newForms[index][name] = value;
        //setForms(newForms);
        setProperty(prevState => ({ ...prevState, rooms_info: newForms }));
    };

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
        }
        //console.log(property)// You can perform any necessary action with the form data here ;

        try {
            setLoading(true)

            const data = new FormData()
            let add_occupied = { ...property } //copy current state
            add_occupied.occupied_rooms = isOccupied.current // set Ref variable to occupied, because of async useState
            //console.log(add_occupied)

            // TRANSFORM coordinates: "lat, lng" string → DB [lng, lat] (GeoJSON/Maptiler standard)
            if (add_occupied.coordinates && typeof add_occupied.coordinates === 'string') {
                const parts = String(add_occupied.coordinates).split(',');
                if (parts.length >= 2) {
                    const lat = parseFloat(parts[0].trim());
                    const lng = parseFloat(parts[1].trim());
                    // Guard against NaN — don't store invalid coordinates
                    if (!isNaN(lat) && !isNaN(lng)) {
                        add_occupied.coordinates = [lng, lat];
                    } else {
                        add_occupied.coordinates = [];  // Invalid → empty array fallback
                    }
                }
            }

            data.set('prop', JSON.stringify(add_occupied))

            const response = await axios.post('/api/add_images', data)
            const result = await response.data
            console.log({ result })

        }
        catch (e) {
            console.error(e)
        } finally {

            setLoading(false)
        }

    };

    const handleCheckboxChange = (roomId) => {   // toggle Occupied room

        isOccupied.current = property.occupied_rooms //get current state of occupied rooms from state

        if (isOccupied.current.includes(roomId)) { //work with Ref variable
            isOccupied.current = isOccupied.current.filter((id) => id !== roomId)
        } else {
            isOccupied.current.push(roomId)
        }
        //console.log(isOccupied.current)

        setProperty((prevOccupied) => { //update current state. It's async updaing
            return { ...prevOccupied, occupied_rooms: isOccupied.current };
        });

        handleSubmit() // call submit after checkbox activation. The state is still in progress. Working with Ref variable

    };

    /** Convert any null/undefined values to safe defaults for controlled inputs. */
    const normalize = (obj) => {
        return {
            ...obj,
            name: obj.name ?? '',
            phone: obj.phone ?? '',
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
            rooms_info: Array.isArray(obj.rooms_info) ? obj.rooms_info : [],
            occupied_rooms: Array.isArray(obj.occupied_rooms) ? obj.occupied_rooms : [],
        }
    }

    function fetch_data() {
        //console.log('new fetch')
        fetch('/api/get_data_edit', {
            method: "POST",
            body: JSON.stringify(email)
        })
            .then((response) => response.json())
            .then((json) => {
                if (json.length) { //if no assents in DB, then do nothing
                    setAsset(json)

                    // TRANSFORM coordinates: Convert DB GeoJSON format to user-friendly string
                    const dbData = json[propertyRef.current];
                    if (!dbData) {
                        propertyRef.current = 0;
                        const empty = createEditProperty(email);
                    setProperty({ ...empty, _id: '', images: '', rooms: '', occupied_rooms: empty.occupied_rooms });
                        return;
                    }
                    if (dbData.coordinates && Array.isArray(dbData.coordinates)) {
                        const [lng, lat] = dbData.coordinates;
                        dbData.coordinates = `${lat}, ${lng}`;  // User-friendly format for display
                    }

                    setProperty(normalize(dbData));  // Include transformed coordinates
                }
                else {
                    console.log("no data")
                    setInDB(false)
                }
            })

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


    const rooms = property.rooms && property.rooms.length != 0 ? property.rooms.map((el, index) => {

        return (
            <div key={index} className={styles.form_section} style={{ backgroundColor: property.occupied_rooms.includes(index.toString()) && 'crimson' }}>
                <h2 className={styles.section_title}>Room {index + 1}</h2>

                <p className={styles.section_description}>Change photos of the room.</p>
                <div className={styles.images}>
                    {el.map((room) => {
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
                    <input className={styles.file_input} type="file" name={index} multiple onChange={handleFileRoomChange} />
                </div>
                <p className={styles.section_description}>Room description</p>

                <textarea className={styles.text_input} placeholder="Describe this room in detail..." rows="4" name="info" value={property.rooms_info[index]?.info || ''}
                    onChange={(e) => handleInputChange(e, index)} />
                <div className={styles.submit_room}>
                    <button className={styles.roomButton} disabled={loading} form="info_form" type="submit">Save</button>
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
    }) : null


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
        294|        setProperty(normalize(displayData));
        propertyRef.current = position // update ref to current property number in array

    }

    function handleDelete(itemName, index_of_arr) { //delete image
        console.log(itemName, index_of_arr)

        function sendForDelete(propertyState) {
            fetch('/api/delete', {
                method: "POST",
                body: JSON.stringify(propertyState)
            })
                .then((response) => response.json())
                .then((json) => {
                    console.log(json)
                    fetch_data()

                })
        }

        let checkForDeleteImages = property.images.find((item) => item.public_id === itemName)
        let flat_rooms_arr = property.rooms.flat()
        let checkToDeleteRoomsImages = flat_rooms_arr.find((item) => item.public_id === itemName)

        if (checkForDeleteImages) {
            const imageToFilter = property.images.filter((item) => item.public_id != itemName)
            let propertyState = { ...property }
            propertyState.images = imageToFilter
            propertyState.delete = checkForDeleteImages
            sendForDelete(propertyState)

        }
        if (checkToDeleteRoomsImages) {
            let propertyState = { ...property } // copy current state
            let delIndex = propertyState.rooms[index_of_arr].findIndex((item) => { // find the index of deleting img in subarray with index_of_arr
                return item.public_id == itemName
            })
            if (delIndex != -1) {
                propertyState.rooms[index_of_arr].splice(delIndex, 1)
            }
            else {
                console.log("IMAGE NOT FOUND!")
                return
            }

            propertyState.delete = checkToDeleteRoomsImages
            sendForDelete(propertyState)

        }
    }
    function handleDeleteProperty() {
        const confirmAction = confirm(`Are you sure to delete ${property.name}?`)
        if (confirmAction) {
            // console.log(property)
            fetch('/api/delete_asset', {
                method: "POST",
                body: JSON.stringify(property)
            })
                .then((response) => response.json())
                .then((json) => {
                    console.log(json)
                    propertyRef.current = 0 // reset to first remaining property before reload
                    
                    // If this was the last property, redirect to admin menu to create new one
                    const assetArray = Array.isArray(asset) ? asset : []
                    if (assetArray.length <= 1) {
                        router.push('/admin')
                    } else {
                        fetch_data()
                    }
                })
        }

    }
    const handleTogglechange = (e) => {
        console.log(e)
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
                                        <label className={styles.input_label}>View</label>
                                        <input className={styles.text_input} placeholder="e.g., Ocean View, City Skyline" type="text" name="view" value={property.view} onChange={handleChange} required />
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
                                    <label className={styles.input_label}>Price for a day</label>
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
                    {/* <!-- Rooms --> */}
                    <div className={styles.room_block}>

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