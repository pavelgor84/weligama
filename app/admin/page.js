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
            bedrooms: '',
            bathrooms: '',
            ac: '',
            view: '',
            floorNumber: '',
            parking: '',
            price: '',
            available: '',
            images: ''
        });
    const [file, setFile] = useState({
        images: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProperty(prevState => ({ ...prevState, [name]: value }));
    };
    const handleFileChange = (e) => {
        console.log(e.target.files)

        const { name, value } = e.target;
        setFile(prevState => ({ ...prevState, [name]: value }));
        setProperty(prevState => ({ ...prevState, images: e.target.files }));

    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(property)// You can perform any necessary action with the form data here ;
        console.log(property.images[0])
        //const file = e.get('file')
        //console.log(e)
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
                                    <th align='left'><input type="number" name="bedrooms" max="99" value={property.bedrooms} onChange={handleChange} required /></th>
                                </tr>
                                <tr>
                                    <th align='right'> <label>Number of Bathrooms:</label> </th>
                                    <th align='left'> <input type="number" name="bathrooms" max="99" value={property.bathrooms} onChange={handleChange} required /></th>
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
                                    <th align='left'><input type="number" name="floorNumber" max="99" value={property.floorNumber} onChange={handleChange} required /></th>
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