const Icon_cond = (props) => (
    <svg
        {...props}
        width={20}
        height={20}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* AC unit body */}
        <path d="M5 8h22a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 27 16H5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5 8z" />
        {/* vent slit */}
        <path d="M8 12h16" />
        {/* airflow */}
        <path d="M10 21v3" />
        <path d="M16 21v4" />
        <path d="M22 21v3" />
    </svg>
)

const Icon_shower = (props) => (
    <svg
        {...props}
        width={20}
        height={20}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* shower head */}
        <path d="M16 3v4" />
        <path d="M10 7h12l-2 5H12z" />
        {/* water drops */}
        <path d="M12 16v4" />
        <path d="M16 16v5" />
        <path d="M20 16v4" />
    </svg>
)

const Icon_bed = (props) => (
    <svg
        {...props}
        width={20}
        height={20}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* headboard post */}
        <path d="M3 5v21" />
        {/* frame + right side */}
        <path d="M3 11h24a2.5 2.5 0 0 1 2.5 2.5V26" />
        {/* mattress line */}
        <path d="M3 23h26" />
        {/* pillow divider */}
        <path d="M8 11v12" />
    </svg>
)

export { Icon_bed, Icon_cond, Icon_shower }
