"use client"


import { useEffect, useState } from 'react'
import styles from './list.module.css'


export default function AdminEdit({ email }) {

    const [asset, setAsset] = useState([])
    console.log(asset)
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
            images: ''
        });
    const [file, setFile] = useState([])

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProperty(prevState => ({ ...prevState, [name]: value }));
    };
    const handleFileChange = (e) => {
        console.log(e.target.files)

        const _files = Array.from(e.target.files);
        setFile(_files);

        let imageset = []
        for (let i in e.target.files) {         // MAKE SANITY!!!
            if (!e.target.files[i].name) break
            console.log(e.target.files[i].name)
            imageset.push({ src: "/images/south/" + e.target.files[i].name, alt: "image number" + i })
        }
        setProperty(prevState => ({ ...prevState, images: imageset }));

    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(property)// You can perform any necessary action with the form data here ;
        //console.log(property.images[0])

        if (!file) {
            console.log("no file")
            return
        }



        try {
            const data = new FormData()
            //data.set('file', property.images)
            file.forEach((image, i) => {
                data.append(image.name, image)
            })


            console.log(property)
            data.set('prop', JSON.stringify(property))

            const res = await fetch('/api/upload', {
                method: "POST",
                body: data
            })
            console.log(res)
            if (!res.ok) throw new Error(await res.text())

        }
        catch (e) {
            console.error(e)
        }

    };

    useEffect(() => {
        fetch('/api/edit', {
            method: "POST",
            body: JSON.stringify(email)
        })
            .then((response) => response.json())
            .then((json) => {
                setAsset(json)
                setProperty(json[0])
            })
    }, []);

    //useEffect(() => { setProperty(prevState => (asset[0])) }, [asset])



    // const submitEmail = async (e) => {
    //     e.preventDefault();
    //     let mail = { "mail": email }
    //     const res = await fetch('/api/edit', {
    //         method: "POST",
    //         body: JSON.stringify(mail)
    //     })
    //     return console.log(res.json())
    //}

    const selection = asset.map((opt) => {
        return (<option key={opt._id} value={opt.name}>{opt.name}</option>)
    })

    const imageSet = property.images ? property.images.map((im) => {
        return (
            <div >
                <button id={im.alt} onClick={(e) => handleDelete(e.target.id)}> del</button>
                <img src={im.src} width='60px' height='60px' />
            </div>
        )
    }) : null


    function handleSelect(item) {
        let position = asset.findIndex(obj => obj.name == item)
        setProperty(prevState => (asset[position]))
    }

    function handleDelete(itemName) {
        console.log(itemName)
        let checkToDelete = property.images.find((item) => item.alt === itemName)
        if (checkToDelete) {
            const imageToFilter = property.images.filter((item) => item.alt != itemName)
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
                <label for="property">Choose your property:</label>

                <select name="property" id="property_list" onChange={e => handleSelect(e.target.value)}>
                    {selection}

                </select>

                <form className={styles.form} onSubmit={handleSubmit}>
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
                            <tr>
                                <th align='right'><label>Images:</label></th>
                                <th align='left'><input type="file" name="images" multiple value={file.images} onChange={handleFileChange} required /></th>
                            </tr>
                        </tbody>
                    </table>
                    <button type="submit">Submit</button>
                </form>

                {imageSet}

            </div>


        </section>
    )
}