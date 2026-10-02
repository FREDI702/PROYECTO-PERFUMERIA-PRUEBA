const API_URL = ímport.meta.env.VITE_API; 

export function obtenerClientes() {
    return fetch('${API_URL}/Clientes')
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener clientes");
            }
            return response.json();
        });
}