const API_URL = import.meta.env.VITE_API_URL;

export function obtenerPerfumes() {
    return fetch(`${API_URL}/perfumes`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener perfumes");
            }
            return response.json();
        });
}
