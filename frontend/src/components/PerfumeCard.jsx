function PerfumeCard({ perfume }) {
    return (
        <div>
            <h3>{perfume.nombre}</h3>
            <p>Marca (ID): {perfume.idMarca}</p>
            <p>Género: {perfume.genero}</p>
            <p>Concentración: {perfume.concentracion}</p>
            <p>Mililitros: {perfume.mililitros}</p>
            <p>Precio: {perfume.precio}</p>
            <p>Stock: {perfume.stock}</p>
            <hr />
        </div>
    );
}

export default PerfumeCard;
