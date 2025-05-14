"use client"

import React, { useState } from 'react'
import axios from 'axios'
import styles from './admin_menu.module.css'

export default function AdminMenu({ email }) {
    const defaul_state = { // make it imported!!!
        mail: email,
        phone: '',
        name: '',
        address: '',
        coordinates: '',
        bedroom: '',
        bath: '',
        ac: '',
        view: '',
        floor: '',
        parking: '',
        price: '',
        available: '',
        images: '',
        rooms_info: [],
        description: ''
    }

    const [asset, setAsset] = useState([])
    const [property, setProperty] = useState(
        {
            mail: email,
            phone: '',
            name: '',
            address: '',
            coordinates: '',
            bedroom: '',
            bath: '',
            ac: '',
            view: '',
            floor: '',
            parking: '',
            price: '',
            available: '',
            images: '',
            rooms_info: [],
            description: ''
        });
    console.log(property)
    const [file, setFile] = useState([])
    console.log(file)
    const [room, setRoom] = useState([])
    console.log(room)
    console.log(room.hasOwnProperty("room1") && room.room1.length != 0)
    const [loading, setLoading] = useState(false)

    const [forms, setForms] = useState([]);

    // const handleAddPerson = () => {
    //     setForms([...forms, { info: '', id: Date.now() }]);
    //     console.log(forms)
    // };
    const handleAddPerson = (e) => {
        e.preventDefault()
        //setForms([...forms, { info: '', id: Date.now() }]);
        setProperty(prevState => ({ ...prevState, rooms_info: [...prevState.rooms_info, { info: '', id: Date.now() }] }));
        console.log(forms)
    };

    console.log(forms)
    const handleInputChange = (e, index) => {
        console.log(e)
        const { name, value } = e.target;
        const newForms = [...property.rooms_info];
        newForms[index][name] = value;
        //setForms(newForms);
        setProperty(prevState => ({ ...prevState, rooms_info: newForms }));
    };
    // Обработчик события нажатия кнопки "Удалить форму"
    const handleDeleteRoom = (e, index) => {
        e.preventDefault()
        // Копируем массив форм и удаляем форму по указанному индексу
        const newForms = [...property.rooms_info];
        newForms.splice(index, 1);
        setProperty(prevState => ({ ...prevState, rooms_info: newForms }));
        const roomFiles = [...room]
        roomFiles.splice(index, 1)
        setRoom(roomFiles)
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setProperty(prevState => ({ ...prevState, [name]: value }));
    };


    const handleFileChange = (e) => {
        console.log(e)

        const _files = Array.from(e.target.files);
        setFile(_files);
    };
    const handleRoomChange = (e) => {
        //console.log(e)
        const _roomFiles = Array.from(e.target.files);
        const roomNumber = e.target.name

        setRoom(prevState => [...prevState, _roomFiles]);

    };
    const handleRoomInfoChange = (e) => {
        //console.log(e)
        const { name, value } = e.target;
        setProperty(prevState => ({ ...prevState, rooms_info: { ...prevState.rooms_info, [name]: value } }));
    }

    async function send_data(data) {
        try {
            const room_response = await axios.post('/api/upload_room', data)
            const room_result = await room_response.data
            console.log({ room_result })
            setProperty(defaul_state)
        }
        catch (e) {
            console.error(e)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(property)// You can perform any necessary action with the form data here ;
        //console.log(property.images[0])

        if (!file) {
            console.log("insufficient pics ")
            return
        }

        try {
            const data = new FormData()
            //data.set('file', property.images)
            //----------------------------------------add property----------------------
            file.forEach((image, i) => {
                data.append(image.name, image)
            })

            data.append('rooms', room)

            console.log(property)
            data.append('prop', JSON.stringify(property))

            const response = await axios.post('/api/upload', data)
            const result = await response.data
            console.log({ result })
            const id = result.msg._id
            //----------------------------------------add property----------------------

            //----------------------------------------add rooms-------------------------
            if (room[Object.keys(room)[0]] && room[Object.keys(room)[0]].length != 0) { //room.room1 && room.room1.length > 0
                for (const property in room) {
                    let room_data = new FormData()
                    let room_info = { "room": property, "id": id } //{ "room": "room1", "id": id }

                    room[property].forEach((image, i) => {
                        room_data.append(image.name, image)
                    })
                    room_data.append('room', JSON.stringify(room_info))
                    send_data(room_data)
                }
            }
            //----------------------------------------add rooms-------------------------

        }
        catch (e) {
            console.error(e)
        }

    };

    // useEffect(() => {
    //     fetch('/api')
    //         .then((response) => response.json())
    //         .then((json) => setAsset(json))
    // }, []);

    const [tabToggle, setTabToggle] = useState(1)

    return (
        <>
            <div className={styles.container}>
                <div className={styles.menu}>
                    <div className={styles.left_items}>
                        <div className={styles.logo}>
                            PropertyHub
                        </div>
                        <div className={styles.left_links}>
                            <a href='#'>Add property</a>
                            <a href='#'>Edit property</a>
                        </div>
                    </div>
                    <div className={styles.right_items}>
                        <div className={styles.email}>{email}</div>
                    </div>
                </div>
            </div>

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
                                    <input className={styles.text_input} ype="text" placeholder='5.9744140972131685, 80.43011706614641' name="coordinates" value={property.coordinates} onChange={handleChange} required />
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
                                <div className={styles.radio_option}>
                                    <label>Air Conditioner</label>
                                    <div className={styles.radio_buttons}>
                                        <label>
                                            <input name="ac" type="radio" value="Yes" checked={property.ac === "Yes"} onChange={handleChange} />
                                            <span>Yes</span>
                                        </label>
                                        <label>
                                            <input name="ac" type="radio" value="No" checked={property.ac === "No"} onChange={handleChange} />
                                            <span>No</span>
                                        </label>
                                    </div>
                                </div>
                                <div className={styles.radio_option}>
                                    <label>Parking</label>
                                    <div className={styles.radio_buttons}>
                                        <label>
                                            <input name="parking" type="radio" value="Yes" checked={property.parking === "Yes"} onChange={handleChange} />
                                            <span>Yes</span>
                                        </label>
                                        <label>
                                            <input name="parking" type="radio" value="No" checked={property.parking === "No"} onChange={handleChange} />
                                            <span>No</span>
                                        </label>
                                    </div>
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

                {/* <!-- Right Side: Pricing, Description, Images, and Search Visibility --> */}
                <div className={styles.right_section}>
                    {/* <!-- Images --> */}
                    <div className={styles.form_section}>
                        <h2 className={styles.section_title}>Property Images</h2>
                        <p className={styles.section_description}>
                            Upload nice photos of the property.
                        </p>
                        <input className={styles.file_input} type="file" name="images" multiple value={file.images} onChange={handleFileChange} required />
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
                                <input className={styles.toggle_input} type="checkbox" />
                                <div className={styles.toggle_slider}></div>
                            </label>
                        </div>
                    </div>
                </div>












            </div >

        </>
    )
}