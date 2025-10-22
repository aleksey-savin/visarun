const IconArrowsSort = ({
    size = 18
}: {
    size?: number | string
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            // className="icon icon-tabler icons-tabler-outline icon-tabler-arrows-sort"
        >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 9l4 -4l4 4m-4 -4v14"/>
            <path d="M21 15l-4 4l-4 -4m4 4v-14"/>
        </svg>
    );
};

export default IconArrowsSort;