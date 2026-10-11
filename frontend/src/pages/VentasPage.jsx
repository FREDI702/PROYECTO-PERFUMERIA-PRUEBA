import { useState, useEffect } from "react";
import VentaCard from "../components/VentaCard.jsx";
import { obtenerVentas } from "../services/VentaService.js";

function VentasPage() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        obtenerVentas()
            .then((data) => setItems(data))
            .catch((err) => {
                console.error("Error:", err);
                setError("No se pudo cargar la información.");
            });
    }, []);

    return (
        <div>
            <h2>Ventas</h2>
            {error && <p>{error}</p>}
            <div className="cliente">
                {items.map((item) => (
                    <VentaCard key={item.id} venta={item} />
                ))}
            </div>
        </div>
    );
}

export default VentasPage;
