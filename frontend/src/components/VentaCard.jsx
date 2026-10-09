function VentaCard({ venta }) {
    return (
        <div>
            <h3>Venta #{venta.id}</h3>
            <p>Cliente (ID): {venta.idCliente ?? "—"}</p>
            <p>Fecha y hora: {venta.fechaHora}</p>
            <p>Método de pago: {venta.metodoPago}</p>
            <p>Comprobante: {venta.tipoComprobante}</p>
            <p>Monto total: {venta.montoTotal}</p>
            <p>Estado: {venta.estadoVenta}</p>
            <hr />
        </div>
    );
}

export default VentaCard;

