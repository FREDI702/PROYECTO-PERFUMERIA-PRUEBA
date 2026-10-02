function ClienteCard({cliente}){
    return(
        <div>
            <h3>{cliente.nombre}</h3>
            <p>Categoria: {cliente.categoria}</p>
            <p>Precio: s/ {cliente.stock}</p>
            <p>Stock: {cliente.stock}</p>
            <hr />
        </div>
    );
}
export default ClienteCard;