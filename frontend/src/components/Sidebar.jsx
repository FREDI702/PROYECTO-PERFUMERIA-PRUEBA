import Icon from "./Icon.jsx";
import { ENTIDADES } from "../config.js";

function Sidebar({ seccion, onCambiar, onSalir }) {
    return (
        <aside className="sidebar">
            <div className="marca">
                <Icon nombre="lotus" size={30} />
                <span>PerfumeStore</span>
            </div>
            <nav>
                <button className={seccion === "inicio" ? "activo" : ""} onClick={() => onCambiar("inicio")}>
                    <Icon nombre="home" /> <span>Inicio</span>
                </button>
                {Object.entries(ENTIDADES).map(([clave, e]) => (
                    <button key={clave} className={seccion === clave ? "activo" : ""} onClick={() => onCambiar(clave)}>
                        <Icon nombre={e.icono} /> <span>{e.titulo}</span>
                    </button>
                ))}
            </nav>
            <div className="perfil"><div className="avatar">AD</div><div><strong>Administrador</strong><small>PerfumeStore</small></div></div>
            <button className="salir" onClick={onSalir}>
                <Icon nombre="logout" /> <span>Salir del panel</span>
            </button>
        </aside>
    );
}

export default Sidebar;
