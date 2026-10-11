function tono(t = "") {
    const s = t.toLowerCase();
    if (/entreg|complet|pagad/.test(s)) return "verde";
    if (/cancel|anul/.test(s)) return "rojo";
    if (/camino|proceso|pend/.test(s)) return "azul";
    return "gris";
}

function Badge({ texto }) {
    if (!texto) return null;
    return <span className={`badge ${tono(texto)}`}>{texto}</span>;
}

export default Badge;
