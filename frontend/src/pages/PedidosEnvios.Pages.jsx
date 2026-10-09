import { useState, useEffect } from "react";
import PedidoEnvioCard from "../components/PedidoEnvioCard.jsx";
import { obtenerPedidos } from "../services/PedidoEnvioService.jsx";

function PedidosEnvioPage() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        obtenerPedidos()
            .then((data) => setItems(data))
            .catch((err) => {
                console.error("Error:", err);
                setError("No se pudo cargar la información.");
            });
    }, []);

    return (
        <div>
            <h2>Pedidos de envío</h2>
            {error && <p>{error}</p>}
            <div className="cliente">
                {items.map((item) => (
                    <PedidoEnvioCard key={item.id} pedido={item} />
                ))}
            </div>
        </div>
    );
}

export default PedidosEnvioPage;
