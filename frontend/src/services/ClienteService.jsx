const API_URL = import.meta.env.VITE_API_URL;

export function obtenerClientes() {
    return fetch(`${API_URL}/clientes`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener clientes");
            }
            return response.json();
        });
}