const Icon_bed = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
        <path
            fill="black"
            d="M2 19v-6q0-.675.275-1.225T3 10.8V8q0-1.25.875-2.125T6 5h4q.575 0 1.075.213T12 5.8q.425-.375.925-.587T14 5h4q1.25 0 2.125.875T21 8v2.8q.45.425.725.975T22 13v6h-2v-2H4v2H2Zm11-9h6V8q0-.425-.288-.712T18 7h-4q-.425 0-.712.288T13 8v2Zm-8 0h6V8q0-.425-.288-.712T10 7H6q-.425 0-.712.288T5 8v2Zm-1 5h16v-2q0-.425-.288-.712T19 12H5q-.425 0-.712.288T4 13v2Zm16 0H4h16Z"
        />
    </svg>
)
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

export { Icon_bed, Icon_cond, Icon_shower }
