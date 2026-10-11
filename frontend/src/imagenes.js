// Fotos de perfumes guardadas en public/perfumes/. Se asignan por palabras del nombre (y la marca).
const normal = (t = "") =>
    t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const TABLA = [
    { archivo: "natura-essencial-oud", todas: ["essencial", "oud"] },
    { archivo: "natura-essencial", todas: ["essencial"] },
    { archivo: "dior-sauvage", todas: ["sauvage"] },
    { archivo: "loccitane-rose", todas: ["occitane", "rose"] },
    { archivo: "esika-city-love", todas: ["city", "love"] },
    { archivo: "lbel-mithyka", todas: ["mithyka"] },
    { archivo: "lbel-mithyka", todas: ["encant"] },
    { archivo: "avon-spiderman", todas: ["spider"] },
    { archivo: "esika-comando-force", todas: ["comando"] },
    { archivo: "esika-vibranza", todas: ["vibranza"] },
    { archivo: "esika-expression", todas: ["expression"] },
    { archivo: "cyzone-nitro-night", todas: ["nitro"] },
    { archivo: "esika-pulso-absolute", todas: ["pulso"] },
    { archivo: "esika-vanilla", todas: ["vanilla"] },
    { archivo: "esika-salvaje", todas: ["salvaje"] },
    { archivo: "natura-homem-potence", todas: ["potence"] },
    { archivo: "cyzone-all-black", todas: ["all", "black"] },
    { archivo: "lattafa-khamrah-qahwa", todas: ["khamrah"] },
    { archivo: "lattafa-khamrah-qahwa", todas: ["qahwa"] },
    { archivo: "natura-homem-identidad", todas: ["identidad"] },
];

export function archivoDe(marca, nombre) {
    const texto = ` ${normal(`${marca || ""} ${nombre || ""}`)} `;
    const hallados = TABLA.filter((e) => e.todas.every((p) => texto.includes(` ${p} `)));
    hallados.sort((a, b) => b.todas.length - a.todas.length);
    return hallados[0]?.archivo || null;
}
