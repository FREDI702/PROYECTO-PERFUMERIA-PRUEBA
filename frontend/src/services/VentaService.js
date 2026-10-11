const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export function obtenerVentas() {
    return fetch(`${API_URL}/ventas`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener ventas");
            }
            return response.json();
        });
}
