"use client"


import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import styles from './admin_edit.module.css'


export default function AdminEdit({ email }) {

    const [asset, setAsset] = useState([])
    //console.log(asset)
    const [property, setProperty] = useState(
        {
            mail: email,
            name: '',
            phone: '',
            address: '',
            coordinates: '',
            bedroom: '',
            bath: '',
            ac: false,
            view: '',
            floor: '',
            parking: false,
            price: '',
            available: true,
            occupied_rooms: [],
            images: '',
            rooms: '',
            description: '',
            rooms_info: [],
            _id: '',
        });
    console.log(property)

    const inputRefs = useRef({});
    //console.log(inputRefs)
    const currentRef = useRef();
    //console.log(JSON.stringify(currentRef.current))
    const propertyRef = useRef(0)
    const isOccupied = useRef([])

    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProperty(prevState => ({ ...prevState, [name]: value }));
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
    const handleFocus = (e) => {
        console.log(e)
        const { name } = e.target;
        currentRef.current = name
        console.log(currentRef.current)
    }

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
                    setProperty(json[propertyRef.current])//useRef <----
                }
            })

    }

    useEffect(() => {
        fetch_data()
    }, []);
    useEffect(() => {
        Object.keys(inputRefs.current).forEach(key => {
            if (key == currentRef.current) {
                inputRefs.current[key].focus();
            }
        });

    }, [property.rooms_info]);

    const selection = asset.map((opt) => {
        return (<option key={opt._id} value={opt.name}>{opt.name}</option>)
    })

    const imageSet = property.images ? property.images.map((im) => {
        return (
            <div key={im.public_id} >
                <button id={im.public_id} onClick={(e) => handleDelete(e.target.id)} disabled={loading}> del</button>
                <img src={im.src} width='60px' height='60px' />
            </div>
        )
    }) : null

    let rooms
    if (property.rooms && property.rooms.length != 0) {
        rooms = property.rooms.map((el, index) => {
            return (
                <div key={index} className={styles.form_section} style={{ backgroundColor: property.occupied_rooms.includes(index.toString()) && 'crimson' }}>
                    <h2 className={styles.section_title}>Room {index + 1}</h2>

                    <p className={styles.section_description}>Change photos of the room.</p>
                    <div className={styles.images}>
                        {el.map((room) => {
                            return (
                                <div key={room.public_id} >
                                    <button id={room.public_id} onClick={(e) => handleDelete(e.target.id)} disabled={loading}> del</button>
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

                    <textarea className={styles.text_input} placeholder="Describe this room in detail..." rows="4" ref={el => inputRefs.current[index] = el} name="info" value={property.rooms_info[index]?.info || ''}
                        onChange={(e) => handleInputChange(e, index)} onFocus={handleFocus} />
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
        })

    }
    function Rooms() {
        return (
            <>
                {rooms}

            </>
        );
    }


    function handleSelect(item) {
        let position = asset.findIndex(obj => obj.name == item)
        setProperty(prevState => (asset[position]))
        propertyRef.current = position // update ref to current property number in array

    }

    function handleDelete(itemName) {
        console.log(itemName)

        function sendForDelete(propertyState) {
            fetch('/api/delete', {
                method: "POST",
                body: JSON.stringify(propertyState)
            })
                .then((response) => response.json())
                .then((json) => {
                    console.log(json)
                    fetch_data()
                    // setAsset(json)
                    // setProperty(json[0])
                })
        }

        let checkForDeleteImages = property.images.find((item) => item.public_id === itemName)
        let checkToDeleteRoomsImages = property.rooms.find((item) => item.public_id === itemName)

        if (checkForDeleteImages) {
            const imageToFilter = property.images.filter((item) => item.public_id != itemName)
            let propertyState = { ...property }
            propertyState.images = imageToFilter
            propertyState.delete = checkForDeleteImages
            sendForDelete(propertyState)

        }
        if (checkToDeleteRoomsImages) {
            const imageToFilter = property.rooms.filter((item) => item.public_id != itemName)
            let propertyState = { ...property }
            propertyState.rooms = imageToFilter
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
                    fetch_data()
                })
        }

    }
    const handleTogglechange = (e) => {
        console.log(e)
        const { name } = e.target;
        setProperty(prevState => ({ ...prevState, [name]: !prevState[name] }));
    }


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
                    <div className={styles.right_items}>
                        <div className={styles.email}>{email}</div>
                    </div>
                </div>
            </div>

            {/* <!-- Main Content --> */}
            <div className={styles.main_content}>
                <div>
                    <form className={styles.form_space} onSubmit={handleSubmit}>
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
                                <div>
                                    <label className={styles.input_label}>Coordinates</label>
                                    <input className={styles.text_input} ype="text" placeholder='e.g., 5.9744140972131685, 80.43011706614641' name="coordinates" value={property.coordinates} onChange={handleChange} required />
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
                                    <label className={styles.input_label}>Number of Bathrooms</label>
                                    <input className={styles.text_input} placeholder="e.g., 3" type="number" name="bath" max="99" value={property.bath} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className={styles.input_label}>View</label>
                                    <input className={styles.text_input} placeholder="e.g., Ocean View, City Skyline" type="text" name="view" value={property.view} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className={styles.input_label}>Number of Floors</label>
                                    <input className={styles.text_input} placeholder="e.g., 2" type="number" name="floor" max="99" value={property.floor} onChange={handleChange} required />
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
                        {/* <!-- Add rooms --> */}
                        {/* <div className={styles.add_rooms_block}>
                            <h2 className={styles.section_title}>If you have separate rooms:</h2>
                            <button className={styles.roomButton} onClick={(e) => handleAddPerson(e)}>Add room</button>
                        </div>
                        {property.rooms_info.map((form, index) => (
                            <React.Fragment key={form.id} >
                                <div className={styles.form_section}>
                                    <h2 className={styles.section_title}>Room {index + 1}</h2>
                                    <p className={styles.section_description}>Upload nice photos of the room.</p>
                                    <input className={styles.file_input} type="file" name={index} multiple value={room.images} onChange={handleRoomChange} required />

                                    <h2 className={styles.section_title}>Room {index + 1} description</h2>
                                    <textarea className={styles.text_input} placeholder="Describe this room in detail..." rows="4" name='info' value={form.info} onChange={(e) => handleInputChange(e, index)} required />
                                    <div className={styles.room_del_container}>
                                        <p className={styles.section_description}>Remove this room</p>
                                        <button className={styles.roomButton_del} onClick={(e) => handleDeleteRoom(e, index)}>Delete</button>
                                    </div>

                                </div>
                            </React.Fragment>


                        ))} */}

                        <Rooms />

                    </form>
                </div >

                {/* <!-- Right Side: Pricing, Description, Images, and Search Visibility --> */}
                <div className={styles.right_section}>
                    {/* <!-- Images --> */}
                    <div className={styles.form_section}>
                        <h2 className={styles.section_title}>Property Images</h2>
                        <p className={styles.section_description}>
                            Change photos of the property.
                        </p>
                        {/* <input className={styles.file_input} type="file" name="images" multiple value={file.images} onChange={handleFileChange} required /> */}
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
                    <button className={styles.submit_button} disabled={loading} type="submit">Save Property</button>

                </div>


            </div >





        </>
    )

}