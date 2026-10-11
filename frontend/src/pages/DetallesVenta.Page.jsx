import { useState, useEffect } from "react";
import DetalleVentaCard from "../components/DetalleVentaCard.jsx";
import { obtenerDetallesVenta } from "../services/DetalleVentaService.js";

function DetallesVentaPage() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        obtenerDetallesVenta()
            .then((data) => setItems(data))
            .catch((err) => {
                console.error("Error:", err);
                setError("No se pudo cargar la información.");
            });
    }, []);

    return (
        <div>
            <h2>Detalle de ventas</h2>
            {error && <p>{error}</p>}
            <div className="cliente">
                {items.map((item) => (
                    <DetalleVentaCard key={item.id} detalle={item} />
                ))}
            </div>
        </div>
    );
}

export default DetallesVentaPage;
