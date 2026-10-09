const API_URL = import.meta.env.VITE_API_URL;

export function obtenerMarcas() {
    return fetch(`${API_URL}/marcas`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener marcas");
            }
            return response.json();
        });
}
