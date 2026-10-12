// Fotos de perfumes guardadas en public/perfumes/. Se asignan por palabras del nombre (y la marca).
const normal = (t = "") =>
    t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const TABLA = [
    { archivo: "chanel-no-5", todas: ["no", "5"] },
    { archivo: "calvin-klein-eternity", todas: ["eternity"] },
    { archivo: "calvin-klein-obsession", todas: ["obsession"] },
    { archivo: "dior-miss-dior", todas: ["miss", "dior"] },
    { archivo: "dior-joy", todas: ["joy"] },
    { archivo: "chanel-coco-mademoiselle", todas: ["coco", "mademoiselle"] },
    { archivo: "chanel-allure-homme-sport", todas: ["allure", "homme", "sport"] },
    { archivo: "calvin-klein-euphoria", todas: ["euphoria"] },
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

export const IMAGENES_DISPONIBLES = [
    { archivo: "avon-spiderman", nombre: "Avon Spiderman" },
    { archivo: "cyzone-all-black", nombre: "Cyzone All Black" },
    { archivo: "cyzone-nitro-night", nombre: "Cyzone Nitro Night" },
    { archivo: "dior-sauvage", nombre: "Dior Sauvage" },
    { archivo: "esika-city-love", nombre: "Ésika City Love" },
    { archivo: "esika-comando-force", nombre: "Ésika Comando Force" },
    { archivo: "esika-expression", nombre: "Ésika Expression" },
    { archivo: "esika-pulso-absolute", nombre: "Ésika Pulso Absolute" },
    { archivo: "esika-salvaje", nombre: "Ésika Salvaje" },
    { archivo: "esika-vanilla", nombre: "Ésika Vanilla" },
    { archivo: "esika-vibranza", nombre: "Ésika Vibranza" },
    { archivo: "lattafa-khamrah-qahwa", nombre: "Lattafa Khamrah Qahwa" },
    { archivo: "lbel-mithyka", nombre: "L'Bel Mithyka" },
    { archivo: "loccitane-rose", nombre: "L'Occitane Rose" },
    { archivo: "natura-essencial-oud", nombre: "Natura Essencial Oud" },
    { archivo: "natura-essencial", nombre: "Natura Essencial" },
    { archivo: "natura-homem-identidad", nombre: "Natura Homem Identidad" },
    { archivo: "natura-homem-potence", nombre: "Natura Homem Potence" },
];

export function archivoDe(marca, nombre) {
    const texto = ` ${normal(`${marca || ""} ${nombre || ""}`)} `;
    const hallados = TABLA.filter((e) => e.todas.every((p) => texto.includes(` ${p} `)));
    hallados.sort((a, b) => b.todas.length - a.todas.length);
    return hallados[0]?.archivo || null;
}
