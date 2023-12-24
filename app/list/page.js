"use client"

import SliderTest from '@/components/slider/SliderTest'

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



import styles from './list.module.css'

export default function list() {
    return (
        <section>
            <div className={styles.container}>
                <div className={styles.block}>
                    <SliderTest />
                </div>

            </div>
        </section>
    )
}