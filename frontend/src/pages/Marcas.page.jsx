import { useState, useEffect } from "react";
import MarcaCard from "../components/MarcaCard.jsx";
import { obtenerMarcas } from "../services/MarcaService.jsx";

function MarcasPage() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        obtenerMarcas()
            .then((data) => setItems(data))
            .catch((err) => {
                console.error("Error:", err);
                setError("No se pudo cargar la información.");
            });
    }, []);

    return (
        <div>
            <h2>Marcas</h2>
            {error && <p>{error}</p>}
            <div className="cliente">
                {items.map((item) => (
                    <MarcaCard key={item.id} marca={item} />
                ))}
            </div>
        </div>
    );
}

export default MarcasPage;
