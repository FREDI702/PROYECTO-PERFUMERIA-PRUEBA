const API_URL = import.meta.env.VITE_API_URL;

export function obtenerPedidos() {
    return fetch(`${API_URL}/pedidos`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener pedidos de envío");
            }
            return response.json();
        });
}
