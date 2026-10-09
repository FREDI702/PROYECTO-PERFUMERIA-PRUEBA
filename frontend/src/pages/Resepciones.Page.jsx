import { useState, useEffect } from "react";
import RecepcionCargaCard from "../components/RecepcionCargaCard.jsx";
import { obtenerRecepciones } from "../services/RecepcionCargaService.jsx";

function RecepcionesPage() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        obtenerRecepciones()
            .then((data) => setItems(data))
            .catch((err) => {
                console.error("Error:", err);
                setError("No se pudo cargar la información.");
            });
    }, []);

    return (
        <div>
            <h2>Recepción de carga</h2>
            {error && <p>{error}</p>}
            <div className="cliente">
                {items.map((item) => (
                    <RecepcionCargaCard key={item.id} recepcion={item} />
                ))}
            </div>
        </div>
    );
}

export default RecepcionesPage;
