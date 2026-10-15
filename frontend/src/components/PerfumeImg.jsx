import { useEffect, useState } from "react";
import { api } from "../api.js";
import { archivoDe } from "../imagenes.js";

// Color del frasco según el nombre (cada perfume se ve distinto)
const PALETAS = [
    ["#f6b73c", "#e08a00"], ["#f4efd8", "#d8d2b0"], ["#f4a79a", "#e57f6d"],
    ["#b9a0ff", "#7c3aed"], ["#9ad7e8", "#4aa3c0"], ["#c9e7b5", "#7fb069"],
];
// La configuración de Cloudinary se pide una sola vez y se comparte entre todas las tarjetas
let configuracionEnCache = null;
const obtenerConfiguracion = () => {
    if (!configuracionEnCache) {
        configuracionEnCache = api.configuracionImagenes().catch((error) => {
            configuracionEnCache = null;
            throw error;
        });
    }
    return configuracionEnCache;
};

const tono = (t = "") => PALETAS[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETAS.length];

export function Frasco({ nombre }) {
    const [c1, c2] = tono(nombre);
    const id = `g${[...nombre].reduce((a, c) => a + c.charCodeAt(0), 0)}`;
    return (
        <svg viewBox="0 0 200 260" className="frasco" aria-label={nombre}>
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={c1} />
                    <stop offset="1" stopColor={c2} />
                </linearGradient>
            </defs>
            <ellipse cx="100" cy="240" rx="62" ry="9" fill="rgba(0,0,0,.08)" />
            <rect x="78" y="14" width="44" height="34" rx="4" fill="#1b1b1b" />
            <rect x="90" y="48" width="20" height="14" fill="#cfcfcf" />
            <rect x="46" y="62" width="108" height="170" rx="14" fill={`url(#${id})`} stroke="rgba(0,0,0,.15)" />
            <rect x="60" y="72" width="14" height="150" rx="7" fill="rgba(255,255,255,.35)" />
            <rect x="72" y="120" width="68" height="64" fill="rgba(255,255,255,.92)" />
            <text x="106" y="158" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1b1b1b" letterSpacing="1">
                {(nombre || "").split(" ")[0].slice(0, 8).toUpperCase()}
            </text>
        </svg>
    );
}

// Foto real (por nombre) -> foto por id (public/perfumes/<id>.jpg|png) -> frasco dibujado
function PerfumeImg({ id, nombre, marca }) {
    const [intento, setIntento] = useState(0);
    const [cloudName, setCloudName] = useState("");
    const archivo = archivoDe(marca, nombre);
    useEffect(() => {
        let activa = true;
        obtenerConfiguracion()
            .then((configuracion) => {
                if (activa) setCloudName(configuracion.cloudName || "");
            })
            .catch((error) => {
                console.error("No se pudo cargar la configuración de imágenes.", error);
            });
        return () => { activa = false; };
    }, []);
    const candidatas = [
        archivo && `/perfumes/${archivo}.jpg`,
        archivo && `/perfumes/${archivo}.png`,
        cloudName && id ? `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/f_auto,q_auto/perfume-${id}` : null,
        `/perfumes/${id}.jpg`,
        `/perfumes/${id}.png`,
    ].filter(Boolean);
    if (intento >= candidatas.length) return <Frasco nombre={nombre} />;
    return <img className="foto" src={candidatas[intento]} alt={nombre} onError={() => setIntento(intento + 1)} />;
}

export default PerfumeImg;
