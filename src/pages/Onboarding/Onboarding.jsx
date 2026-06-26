import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import { useNavigate } from "react-router-dom";
import onboardingData from "./onboardingData";

function Onboarding() {

  const swiperRef = useRef(null);
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);

  return (

    <div className="h-screen bg-white">

      <Swiper

        onSwiper={(swiper)=>{
          swiperRef.current = swiper;
        }}

        onSlideChange={(swiper)=>{
          setActiveIndex(swiper.activeIndex);
        }}

        slidesPerView={1}

      >

      {

      onboardingData.map((item,index)=>(

      <SwiperSlide key={item.id}>

      <div className="h-screen flex flex-col justify-between p-8">

      <div className="mt-10 flex justify-center">

      <img

      src={item.image}

      className="w-80 h-80 rounded-3xl object-cover shadow-xl"

      />

      </div>

      <div>

      <h1 className="text-4xl font-bold text-center">

      {item.title}

      </h1>

      <p className="text-center mt-4 text-gray-500">

      {item.description}

      </p>

      </div>

      <div>

      <div className="flex justify-center gap-2 mb-8">

      {onboardingData.map((_,i)=>(

      <div

      key={i}

      className={`h-2 rounded-full ${
      activeIndex===i
      ?"bg-indigo-600 w-8"
      :"bg-gray-300 w-2"
      }`}

      ></div>

      ))}

      </div>

      <div className="flex justify-between">

      <button

      onClick={()=>swiperRef.current.slideTo(2)}

      className="text-gray-400"

      >

      Skip

      </button>

      {

      activeIndex===2 ?

      <button

      onClick={()=>navigate("/home")}

      className="bg-indigo-600 text-white px-8 py-3 rounded-full"

      >

      Get Started

      </button>

      :

      <button

      onClick={()=>swiperRef.current.slideNext()}

      className="bg-indigo-600 text-white px-8 py-3 rounded-full"

      >

      Next

      </button>

      }

      </div>

      </div>

      </div>

      </SwiperSlide>

      ))

      }

      </Swiper>

    </div>

  )

}

export default Onboarding;