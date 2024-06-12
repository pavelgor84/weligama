const Icon_cond = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
        <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M22 3.6V11H2V3.6a.6.6 0 0 1 .6-.6h18.8a.6.6 0 0 1 .6.6M18 7h1M2 11l.79 2.584A2 2 0 0 0 4.702 15H6m16-4-.79 2.584A2 2 0 0 1 19.298 15H18m-8.5-.5s0 7-3.5 7m8.5-7s0 7 3.5 7m-6-7v7"
        />
    </svg>
)
import * as React from "react"
const Icon_shower = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
        <path
            fill="currentColor"
            d="M21 14v1c0 1.91-1.07 3.57-2.65 4.41L19 22h-2l-.5-2h-9L7 22H5l.65-2.59A4.987 4.987 0 0 1 3 15v-1H2v-2h18V5a1 1 0 0 0-1-1c-.5 0-.88.34-1 .79.63.54 1 1.34 1 2.21h-6a3 3 0 0 1 3-3h.17c.41-1.16 1.52-2 2.83-2a3 3 0 0 1 3 3v9zm-2 0H5v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3z"
        />
    </svg>
)

const Icon_bed = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 32 32"
        {...props}
    >
        <title />
        <path
            d="M26.63 5H5.38A4.38 4.38 0 0 0 1 9.38V30a1 1 0 0 0 1 1h4a1 1 0 0 0 1-.76L7.78 27h16.44l.78 3.24a1 1 0 0 0 1 .76h4a1 1 0 0 0 1-1V9.38A4.38 4.38 0 0 0 26.63 5ZM7 25H3v-5h26v5H7Zm1-10.46v-1.08a.47.47 0 0 1 .46-.46h4.08a.47.47 0 0 1 .46.46v1.08a.47.47 0 0 1-.46.46H8.46a.47.47 0 0 1-.46-.46ZM6.31 17h19.38a.31.31 0 0 1 .31.31V18H6v-.69a.31.31 0 0 1 .31-.31ZM19 14.54v-1.08a.47.47 0 0 1 .46-.46h4.08a.47.47 0 0 1 .46.46v1.08a.47.47 0 0 1-.46.46h-4.08a.47.47 0 0 1-.46-.46ZM3 9.38A2.39 2.39 0 0 1 5.38 7h21.25A2.38 2.38 0 0 1 29 9.38V18h-1v-.69A2.3 2.3 0 0 0 26 15a2.63 2.63 0 0 0 .05-.49v-1.05A2.46 2.46 0 0 0 23.54 11h-4.08A2.46 2.46 0 0 0 17 13.46v1.08a2.31 2.31 0 0 0 .05.46H15a2.31 2.31 0 0 0 .05-.46v-1.08A2.46 2.46 0 0 0 12.54 11H8.46A2.46 2.46 0 0 0 6 13.46v1.08a2.63 2.63 0 0 0 0 .49 2.3 2.3 0 0 0-2 2.28V18H3ZM5.22 29H3v-2h2.72ZM29 29h-2.22l-.5-2H29Z"
            data-name="Layer 2"
        />
    </svg>
)
export { Icon_bed, Icon_cond, Icon_shower }
