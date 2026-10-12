const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
const AUTH_KEY = "perfume-store.authorization";

function authHeader() {
    return sessionStorage.getItem(AUTH_KEY);
}

function crearAuthHeader(usuario, clave) {
    const bytes = new TextEncoder().encode(`${usuario}:${clave}`);
    let texto = "";
    bytes.forEach((byte) => { texto += String.fromCharCode(byte); });
    return `Basic ${btoa(texto)}`;
}

async function pedir(ruta, opciones, mensaje) {
    if (!API_URL) {
        throw new Error("Falta configurar VITE_API_URL para conectar con el servidor.");
    }

    const headers = {
        ...(opciones?.headers || {}),
        ...(authHeader() ? { Authorization: authHeader() } : {}),
    };
    let respuesta;
    try {
        respuesta = await fetch(`${API_URL}/${ruta}`, { ...opciones, headers });
    } catch (error) {
        throw new Error(`${mensaje}: no se pudo conectar con /${ruta}.`, { cause: error });
    }

    if (!respuesta.ok) {
        const error = new Error(`${mensaje}: la API respondió ${respuesta.status} en /${ruta}.`);
        error.status = respuesta.status;
        throw error;
    }
    return respuesta.status === 204 ? null : respuesta.json();
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export const api = {
    iniciarSesion: async (usuario, clave) => {
        const authorization = crearAuthHeader(usuario, clave);
        const sesion = await pedir(
            "auth/me",
            { headers: { Authorization: authorization } },
            "No se pudo iniciar sesión",
        );
        sessionStorage.setItem(AUTH_KEY, authorization);
        return sesion;
    },
    restaurarSesion: async () => {
        if (!authHeader()) return null;
        try {
            return await pedir("auth/me", undefined, "No se pudo restaurar la sesión");
        } catch (error) {
            if (error.status === 401) {
                sessionStorage.removeItem(AUTH_KEY);
                return null;
            }
            throw error;
        }
    },
    crearCuenta: (usuario, correo, contrasena, confirmarContrasena) =>
        pedir(
            "auth/registro",
            {
                method: "POST",
                headers: JSON_HEADERS,
                body: JSON.stringify({ usuario, correo, contrasena, confirmarContrasena }),
            },
            "No se pudo crear la cuenta",
        ),
    cerrarSesion: () => sessionStorage.removeItem(AUTH_KEY),
    listar: (ruta) => pedir(ruta, undefined, "No se pudo cargar la información"),
    crear: (ruta, datos) =>
        pedir(ruta, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(datos) }, "No se pudo guardar"),
    actualizar: (ruta, id, datos) =>
        pedir(`${ruta}/${id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(datos) }, "No se pudo actualizar"),
    eliminar: (ruta, id) =>
        pedir(`${ruta}/${id}`, { method: "DELETE" }, "No se pudo eliminar (puede tener registros relacionados)"),
};
