const c = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const ICONOS = {
    home: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
    users: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", c(9, 7, 4), "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    cart: [c(9, 21, 1), c(20, 21, 1), "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"],
    file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8M8 17h8"],
    tag: ["M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z", "M7 7h.01"],
    bottle: ["M9 2h6v3H9z", "M8 5h8v3l2 3v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9l2-3z"],
    truck: ["M1 3h15v13H1z", "M16 8h4l3 3v5h-7V8z", c(5.5, 18.5, 2.5), c(18.5, 18.5, 2.5)],
    box: ["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", "M3.27 6.96L12 12.01l8.73-5.05", "M12 22.08V12"],
    plus: ["M12 5v14M5 12h14"],
    search: [c(11, 11, 8), "M21 21l-4.35-4.35"],
    edit: ["M12 20h9", "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"],
    trash: ["M3 6h18", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6", "M10 11v6M14 11v6", "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"],
    x: ["M18 6L6 18M6 6l12 12"],
    logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
    grid: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
    lotus: ["M12 3c2 3 2 6 0 9-2-3-2-6 0-9z", "M12 12c-1-3-4-5-8-5 0 4 3 7 8 8", "M12 12c1-3 4-5 8-5 0 4-3 7-8 8", "M4 17c3 3 13 3 16 0"],
};

function Icon({ nombre, size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {(ICONOS[nombre] || []).map((d, i) => <path key={i} d={d} />)}
        </svg>
    );
}

export default Icon;
