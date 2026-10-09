function MarcaCard({ marca }) {
    return (
        <div>
            <h3>{marca.nombre}</h3>
            <p>País de origen: {marca.paisOrigen}</p>
            <p>Descripción: {marca.descripcion}</p>
            <hr />
        </div>
    );
}

export default MarcaCard;
