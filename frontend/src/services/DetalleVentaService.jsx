const API_URL = import.meta.env.VITE_API_URL;

export function obtenerDetallesVenta() {
    return fetch(`${API_URL}/detalle-ventas`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener detalle de ventas");
            }
            return response.json();
        });
}
