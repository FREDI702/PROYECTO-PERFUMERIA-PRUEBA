import { IMAGENES_DISPONIBLES } from "../imagenes.js";

function GaleriaFragancias() {
    return (
        <section className="panel galeria-panel" aria-labelledby="galeria-titulo">
            <div className="galeria-cab">
                <div>
                    <h2 id="galeria-titulo">Fragancias disponibles</h2>
                    <p>Imágenes incluidas en el proyecto. El inventario de perfumes se muestra por separado.</p>
                </div>
                <span>{IMAGENES_DISPONIBLES.length} imágenes</span>
            </div>
            <div className="galeria-fragancias">
                {IMAGENES_DISPONIBLES.map((imagen) => (
                    <figure className="galeria-fragancia" key={imagen.archivo}>
                        <img
                            src={`/perfumes/${imagen.archivo}.jpg`}
                            alt={imagen.nombre}
                            loading="lazy"
                        />
                        <figcaption>{imagen.nombre}</figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}

export default GaleriaFragancias;
