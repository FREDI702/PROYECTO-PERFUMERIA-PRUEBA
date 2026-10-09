import "../styles/Navbar.css";

const SECCIONES = [
    { id: "clientes", label: "Clientes" },
    { id: "marcas", label: "Marcas" },
    { id: "perfumes", label: "Perfumes" },
    { id: "ventas", label: "Ventas" },
    { id: "detalles", label: "Detalle de ventas" },
    { id: "pedidos", label: "Pedidos de envío" },
    { id: "recepciones", label: "Recepción de carga" },
];

function Navbar({ seccion, onCambiar }) {
    return (
        <header>
            <h1>MichiTienda</h1>
            <nav className="navbar">
                {SECCIONES.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        className={s.id === seccion ? "activo" : ""}
                        onClick={() => onCambiar(s.id)}
                    >
                        {s.label}
                    </button>
                ))}
            </nav>
        </header>
    );
}

export default Navbar;
