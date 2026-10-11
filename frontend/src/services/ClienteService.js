const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export function obtenerClientes() {
    return fetch(`${API_URL}/clientes`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al obtener clientes");
            }
            return response.json();
        });     
}
// TC02 - CREAR
export function crearCliente(cliente) {
    return fetch(`${API_URL}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente),
    }).then((response) => {
        if (!response.ok) throw new Error("Error al crear el cliente");
        return response.json();
    });
}

// TC03 - EDITAR
export function actualizarCliente(id, cliente) {
    return fetch(`${API_URL}/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente),
    }).then((response) => {
        if (!response.ok) throw new Error("Error al actualizar el cliente");
        return response.json();
    });
}

// TC04 - ELIMINAR
export function eliminarCliente(id) {
    return fetch(`${API_URL}/clientes/${id}`, { method: "DELETE" }).then(
        (response) => {
            if (!response.ok)
                throw new Error(
                    "No se pudo eliminar (puede tener ventas asociadas)"
                );
        }
    );
}
