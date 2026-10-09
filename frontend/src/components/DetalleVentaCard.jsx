function DetalleVentaCard({ detalle }) {
    return (
        <div>
            <h3>Detalle #{detalle.id}</h3>
            <p>Venta (ID): {detalle.idVenta}</p>
            <p>Perfume (ID): {detalle.idPerfume}</p>
            <p>Cantidad: {detalle.cantidad}</p>
            <p>Precio unitario: {detalle.precioUnitario}</p>
            <p>Descuento: {detalle.descuento}</p>
            <p>Subtotal: {detalle.subtotal}</p>
            <hr />
        </div>
    );
}

export default DetalleVentaCard;
