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
            phone: '',
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
            occupied_rooms: [],
            images: '',
            rooms: '',
            description: '',
            rooms_info: [],
            _id: '',
        });
    //console.log(property)

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
        rooms.push(<div key={index++} className={styles.images_container} style={{ backgroundColor: property.occupied_rooms.includes(item) && 'crimson' }}>
            <span> Room {item}</span>
            <label>
                <input
                    type="checkbox"
                    checked={property.occupied_rooms.includes(item)}
                    onChange={() => handleCheckboxChange(item)}
                />
                Occupied
            </label>
            <div></div>
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

            <textarea ref={el => inputRefs.current[item] = el} name={item} value={property.rooms_info[item] || ''}
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


    return (asset.length ?
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
                            <tr>
                                <th align='right'><label>Property Name:</label></th>
                                <th align='left'><input type="text" name="name" value={property.name} onChange={handleChange} required /></th>
                            </tr>
                            <tr>
                                <th align='right'><label>Phone number:</label></th>
                                <th align='left'><input type="text" name="phone" value={property.phone} onChange={handleChange} required /></th>
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
                                <th align='right'><label>Property description:</label></th>
                                <th align='left'><textarea name="description" value={property.description || ''} onChange={handleChange} /> </th>
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
                    <input type="file" name="images" multiple disabled={loading} onChange={handleFileImagesChange} />

                </div>
                <span>Room images</span>
                <Rooms />
            </div>
            <button className={styles.del_button} disabled={loading} onClick={() => handleDeleteProperty()}>Delete Property</button>


        </section> :
        <div className={styles.block}>

            <h2>No property added yet</h2>
        </div>
    )

}