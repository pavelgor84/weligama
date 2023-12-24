'use client'
//import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

import './styles.css';

// import required modules
import { Navigation } from 'swiper/modules';

import { images } from './images';

// const images = require.context('@/public/images/south', true)
// const imageList = images.keys().map(image => images(image));
// imageList.map((image, index) => (
//   console.log(`   key=${index} src=${JSON.stringify(image.default.src)} alt=${'image' + index} `)
// ))

// images.map((image, index) => {
//   console.log(image)

// })

const slide = images.map((image, index) => {
  return (
    <SwiperSlide key={index}>
      <Image
        src={image.src}
        alt={image.alt}
        width={300}
        height={300}
      />
    </SwiperSlide>
  )
})


export default function SliderTest() {
  return (
    <>
      <Swiper navigation={true} modules={[Navigation]} className="mySwiper">

        {
          slide
        }

        {/* <SwiperSlide>
          <Image
            src={'/images/south/one.jpg'}
            alt={'one'}
            width={300}
            height={300}
          />
        </SwiperSlide>
        <SwiperSlide>
          <Image
            src={'/images/south/two.jpg'}
            alt={'two'}
            width={300}
            height={300}
          />
        </SwiperSlide> */}


      </Swiper>
    </>
  );
}
