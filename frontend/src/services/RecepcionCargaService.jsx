const API_URL = import.meta.env.VITE_API_URL;

export function obtenerRecepciones() {
    return fetch(`${API_URL}/recepciones`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener recepción de carga");
            }
            return response.json();
        });
}
