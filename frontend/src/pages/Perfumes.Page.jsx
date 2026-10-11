import { useState, useEffect } from "react";
import PerfumeCard from "../components/PerfumeCard.jsx";
import { obtenerPerfumes } from "../services/PerfumeService.js";

function PerfumesPage() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        obtenerPerfumes()
            .then((data) => setItems(data))
            .catch((err) => {
                console.error("Error:", err);
                setError("No se pudo cargar la información.");
            });
    }, []);

    return (
        <div>
            <h2>Perfumes</h2>
            {error && <p>{error}</p>}
            <div className="cliente">
                {items.map((item) => (
                    <PerfumeCard key={item.id} perfume={item} />
                ))}
            </div>
        </div>
    );
}

export default PerfumesPage;
