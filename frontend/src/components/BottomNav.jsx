import { useState } from "react";
import Icon from "./Icon.jsx";
import { ENTIDADES } from "../config.js";

const PRINCIPALES = [
    { clave: "inicio", titulo: "Inicio", icono: "home" },
    { clave: "clientes", titulo: "Clientes", icono: "users" },
    { clave: "perfumes", titulo: "Perfumes", icono: "bottle" },
    { clave: "ventas", titulo: "Ventas", icono: "cart" },
];

// Menú inferior para celular (como en el diseño): 4 accesos + "Más"
function BottomNav({ seccion, onCambiar, onSalir }) {
    const [abierto, setAbierto] = useState(false);
    const resto = Object.entries(ENTIDADES).filter(([k]) => !PRINCIPALES.some((p) => p.clave === k));
    const enMas = resto.some(([k]) => k === seccion);

    return (
        <>
            {abierto && (
                <div className="mas-fondo" onMouseDown={() => setAbierto(false)}>
                    <div className="mas-hoja" onMouseDown={(e) => e.stopPropagation()}>
                        {resto.map(([k, e]) => (
                            <button key={k} className={seccion === k ? "activo" : ""} onClick={() => { onCambiar(k); setAbierto(false); }}>
                                <Icon nombre={e.icono} /> {e.titulo}
                            </button>
                        ))}
                        <button onClick={onSalir}><Icon nombre="logout" /> Cerrar sesión</button>
                    </div>
                </div>
            )}
            <nav className="tabbar">
                {PRINCIPALES.map((p) => (
                    <button key={p.clave} className={seccion === p.clave ? "activo" : ""} onClick={() => onCambiar(p.clave)}>
                        <Icon nombre={p.icono} size={22} /><span>{p.titulo}</span>
                    </button>
                ))}
                <button className={enMas || abierto ? "activo" : ""} onClick={() => setAbierto(!abierto)}>
                    <Icon nombre="grid" size={22} /><span>Más</span>
                </button>
            </nav>
        </>
    );
}

export default BottomNav;
