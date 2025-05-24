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
                <div key={index} className={styles.images_container} style={{ backgroundColor: property.occupied_rooms.includes(index.toString()) && 'crimson' }}>
                    <span> Room {index}</span>
                    <label>
                        <input
                            type="checkbox"
                            checked={property.occupied_rooms.includes(index.toString())}
                            onChange={() => handleCheckboxChange(index.toString())}
                        />
                        Occupied
                    </label>
                    <div></div>
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
                        <label>Upload Images:</label>
                        <input type="file" name={index} multiple onChange={handleFileRoomChange} />
                    </div>
                    <label>Room {index} info:</label>


                    <textarea ref={el => inputRefs.current[index] = el} name="info" value={property.rooms_info[index]?.info || ''}
                        onChange={(e) => handleInputChange(e, index)} onFocus={handleFocus} />

                    <button disabled={loading} form="info_form" type="submit">Update info</button>


                </div>
            )
        })

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


    return (

        <div>

            <h2>No property added yet</h2>
            {email}
        </div>
    )

}