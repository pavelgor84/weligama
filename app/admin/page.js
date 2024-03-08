"use client"



// import Image from 'next/image'

// import { Swiper, SwiperSlide } from 'swiper/react'
// import { Pagination, Navigation } from 'swiper/modules'

// import 'swiper/css'
// import 'swiper/css/navigation'
// import 'swiper/css/pagination'

// import { images } from './images'

// const images = require.context('../../public/images/south', true)
// const imageList = images.keys().map(image => images(image));

// imageList.map((image, index) => (
//     console.log(`   key=${index} src=${JSON.stringify(image.default.src)} alt=${'image' + index} `)
// ))



import { useEffect, useState } from 'react'
import styles from './list.module.css'


export default function list() {
    const [asset, setAsset] = useState([])
    const [property, setProperty] = useState(
        {
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

        // try {
        //     const res = await fetch('/api/create', {
        //         method: "POST",
        //         body: JSON.stringify(property)
        //     })
        //     console.log(res)

        // }
        // catch (e) {
        //     console.error(e)
        // }



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

    // useEffect(() => {
    //     fetch('/api')
    //         .then((response) => response.json())
    //         .then((json) => setAsset(json))
    // }, []);

    return (
        <section>
            <div className={styles.container}>
                <div className={styles.block}>
                    {/* {JSON.stringify(asset)} */}

                    <h2>Property Form</h2>
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

                </div>

            </div>

        </section>
    )
}