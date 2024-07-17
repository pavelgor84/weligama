"use client"


import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import styles from './list.module.css'


export default function AdminEdit({ email }) {

    const [asset, setAsset] = useState([])
    //console.log(asset)
    const [property, setProperty] = useState(
        {
            mail: email,
            name: '',
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
            rooms: '',
            rooms_info: {},
            _id: '',
        });
    //console.log(property)

    const inputRefs = useRef({});
    //console.log(inputRefs)
    const currentRef = useRef();
    //console.log(JSON.stringify(currentRef.current))

    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProperty(prevState => ({ ...prevState, [name]: value }));
    };
    const handleFileChange = (e) => {
        console.log(e.target.files)
        setFiles(prev => (e.target.files))
    };

    async function send_data(data) {
        try {
            const room_response = await axios.post('/api/upload_room', data)
            const room_result = await room_response.data
            console.log({ room_result })
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
        send_data(data)

    };

    const handleRoomInfoChange = (e) => {
        //console.log(e)
        const { name, value } = e.target;
        setProperty(prevState => ({ ...prevState, rooms_info: { ...prevState.rooms_info, [name]: value } }));
    }
    const handleFocus = (e) => {
        const { name } = e.target;
        currentRef.current = name
        //console.log(currentRef.current)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(property)// You can perform any necessary action with the form data here ;

        console.log(files)

        // if (files.length === 0) {
        //     console.log("no file")
        //     return
        // }

        try {
            setLoading(true)

            const data = new FormData()
            if (files.length != 0) {
                files.forEach((image, i) => {
                    data.append(image.name, image)
                })
            }


            console.log(property)
            data.set('prop', JSON.stringify(property))

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

    function fetch_data() {
        fetch('/api/get_data_edit', {
            method: "POST",
            body: JSON.stringify(email)
        })
            .then((response) => response.json())
            .then((json) => {
                setAsset(json)
                setProperty(json[0])
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



    const groupedByNumber = property.rooms ? property.rooms.reduce((acc, obj) => {
        // Если ключ для этого number уже есть, добавляем объект в массив
        if (!acc[obj.room_number]) {
            acc[obj.room_number] = []; // Если нет, создаем новый массив для этого number
        }
        acc[obj.room_number].push(obj);
        return acc;
    }, {}) : null

    let rooms = []
    let index = 0
    for (const item in groupedByNumber) {
        rooms.push(<div key={index++} className={styles.images_container}>
            <span> Room {item}</span>
            <div className={styles.images}>
                {groupedByNumber[item].map((room) => {
                    return (
                        <div key={room.public_id} >
                            <button id={room.public_id} onClick={(e) => handleDelete(e.target.id)} disabled={loading}> del</button>
                            <img src={room.src} width='60px' height='60px' />
                        </div>
                    )
                })}
            </div>

            <label>Upload Images:</label>
            <input type="file" name={item} multiple onChange={handleFileRoomChange} />
            <label>Room {item} info:</label>

            <input type="text" ref={el => inputRefs.current[item] = el} name={item} value={property.rooms_info[item] || ''}
                onChange={handleRoomInfoChange} onFocus={handleFocus} />

            <button disabled={loading} form="info_form" type="submit">Update info</button>


        </div>)
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
    }

    function handleDelete(itemName) {
        console.log(itemName)
        let checkToDelete = property.images.find((item) => item.public_id === itemName)
        if (checkToDelete) {
            const imageToFilter = property.images.filter((item) => item.public_id != itemName)
            let propertyState = { ...property }
            propertyState.images = imageToFilter
            propertyState.delete = checkToDelete

            fetch('/api/delete', {
                method: "POST",
                body: JSON.stringify(propertyState)
            })
                .then((response) => response.json())
                .then((json) => {
                    console.log(json)
                    // setAsset(json)
                    // setProperty(json[0])
                })

        }

    }

    return (
        <section>
            <div className={styles.block}>
                {/* {JSON.stringify(asset)} */}

                <h2>Edit property for {email}</h2>
                <label htmlFor="property">Choose your property:</label>

                <select name="property" id="property_list" onChange={e => handleSelect(e.target.value)}>
                    {selection}

                </select>

                <form id="info_form" className={styles.form} onSubmit={handleSubmit}>
                    <table>
                        <tbody>
                            <tr>
                                <th align='right'><label>Property Name:</label></th>
                                <th align='left'><input type="text" name="name" value={property.name} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Coordinates:</label></th>
                                <th align='left'><input type="text" name="coordinates" value={property.coordinates} onChange={handleChange} required /></th>
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
                                <th align='left'><label>
                                    <input type="radio" name="ac" value="Yes" checked={property.ac === "Yes"} onChange={handleChange} />
                                    Yes
                                </label>
                                    <label>
                                        <input type="radio" name="ac" value="No" checked={property.ac === "No"} onChange={handleChange} />
                                        No
                                    </label></th>
                            </tr>
                            <tr>
                                <th align='right'><label>View:</label></th>
                                <th align='left'><input type="text" name="view" value={property.view} onChange={handleChange} /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Floor Number:</label></th>
                                <th align='left'><input type="number" name="floor" max="99" value={property.floor} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Parking:</label></th>
                                <th align='left'><label>
                                    <input type="radio" name="parking" value="Yes" checked={property.parking === "Yes"} onChange={handleChange} />
                                    Yes
                                </label>
                                    <label>
                                        <input type="radio" name="parking" value="No" checked={property.parking === "No"} onChange={handleChange} />
                                        No
                                    </label></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Price:</label></th>
                                <th align='left'><input type="text" name="price" value={property.price} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Available:</label></th>
                                <th align='left'><label>
                                    <input type="radio" name="available" value="Yes" checked={property.available === "Yes"} onChange={handleChange} />
                                    Yes
                                </label>
                                    <label>
                                        <input type="radio" name="available" value="No" checked={property.available === "No"} onChange={handleChange} />
                                        No
                                    </label></th>
                            </tr>

                        </tbody>
                    </table>
                    <button disabled={loading} form="info_form" type="submit">Update</button>
                </form>
                <div className={styles.images_container}>
                    <span>Property images</span>
                    <div className={styles.images}>
                        {imageSet}
                    </div>

                    <label>Upload images:</label>
                    <input type="file" name="images" multiple onChange={handleFileChange} />

                </div>
                <span>Room images</span>
                <Rooms />
            </div>


        </section>
    )
}