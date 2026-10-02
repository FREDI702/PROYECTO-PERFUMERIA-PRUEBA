import { useState, useEffect } from "react";
import ClienteCard from "../components/ClienteCard.jsx";
import { obtenerClientes } from "../services/ClienteService.jsx"; // Verifica la ruta y nombre correcto de tu archivo

function ClientePage() {
    // 1. En React los componentes deben iniciar con mayúscula (ClientePage)
    const [clientes, setClientes] = useState([]); // Usamos plural para arreglos

    useEffect(() => {
        obtenerClientes()
            .then((data) => setClientes(data))
            .catch((error) => console.error("Error:", error));
    }, []);

    return (
        <div>
            <h1>MichiStore</h1>
            <h2>Clientes</h2>
            <div className="cliente">
                {clientes.map((cliente) => (
                    <ClienteCard
                        key={cliente.id} // Accedemos a la iteración actual (cliente.id, no el arreglo)
                        cliente={cliente}
                    />
                ))}
            </div>
        </div>
    );
}

export default ClientePage;