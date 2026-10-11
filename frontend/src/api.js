const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

async function pedir(ruta, opciones, mensaje) {
    if (!API_URL) {
        throw new Error("Falta configurar VITE_API_URL para conectar con el servidor.");
    }

    let r;
    try {
        r = await fetch(`${API_URL}/${ruta}`, opciones);
    } catch (error) {
        throw new Error(`${mensaje}: no se pudo conectar con /${ruta}.`, { cause: error });
    }

    if (!r.ok) {
        throw new Error(`${mensaje}: la API respondió ${r.status} en /${ruta}.`);
    }
    return r.status === 204 ? null : r.json();
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export const api = {
    listar: (ruta) => pedir(ruta, undefined, "No se pudo cargar la información"),
    crear: (ruta, datos) =>
        pedir(ruta, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(datos) }, "No se pudo guardar"),
    actualizar: (ruta, id, datos) =>
        pedir(`${ruta}/${id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(datos) }, "No se pudo actualizar"),
    eliminar: (ruta, id) =>
        pedir(`${ruta}/${id}`, { method: "DELETE" }, "No se pudo eliminar (puede tener registros relacionados)"),
};
