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


import SliderTest from '@/components/slider/SliderTest'
import { useEffect, useState } from 'react'
import styles from './list.module.css'


export default function list() {
    const [asset, setAsset] = useState([])
    //console.log(asset[0])

    useEffect(() => {
        fetch('/api')
            .then((response) => response.json())
            .then((json) => setAsset(json))
    }, []);

    return (
        <section>
            <div className={styles.container}>
                <div className={styles.block}>
                    {asset[0] && <SliderTest img={asset[0].images} />}
                </div>
                <div>
                    {/* {asset[0] && JSON.stringify(asset[0].images)} */}
                </div>

            </div>
        </section>
    )
}