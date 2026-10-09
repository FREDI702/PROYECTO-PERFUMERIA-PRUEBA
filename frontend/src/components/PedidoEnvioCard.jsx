function PedidoEnvioCard({ pedido }) {
    return (
        <div>
            <h3>Pedido #{pedido.id}</h3>
            <p>Venta (ID): {pedido.idVenta}</p>
            <p>Fecha de pedido: {pedido.fechaPedido}</p>
            <p>Fecha de entrega: {pedido.fechaEntrega}</p>
            <p>Estado: {pedido.estadoEnvio}</p>
            <hr />
        </div>
    );
}

export default PedidoEnvioCard;
