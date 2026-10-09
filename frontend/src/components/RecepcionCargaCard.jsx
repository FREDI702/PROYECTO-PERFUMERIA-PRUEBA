function RecepcionCargaCard({ recepcion }) {
    return (
        <div>
            <h3>Lote {recepcion.numeroLote}</h3>
            <p>Perfume (ID): {recepcion.idPerfume}</p>
            <p>Cantidad recibida: {recepcion.cantidadRecibida}</p>
            <p>Fecha de recepción: {recepcion.fechaRecepcion}</p>
            <hr />
        </div>
    );
}

export default RecepcionCargaCard;
