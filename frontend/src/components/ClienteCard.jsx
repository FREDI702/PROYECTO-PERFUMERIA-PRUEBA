function ClienteCard({ cliente, onEditar, onEliminar }) {
    return (
        <div className="cliente-card">
            <h3>{cliente.nombre} {cliente.apellido}</h3>
            <p>DNI/RUC: {cliente.dniRuc}</p>
            <p>Teléfono: {cliente.telefono}</p>
            <p>Correo electrónico: {cliente.email}</p>
            <p>Dirección: {cliente.direccion}</p>
            <div className="acciones">
                <button onClick={() => onEditar(cliente)}>Editar</button>
                <button className="peligro" onClick={() => onEliminar(cliente.id)}>Eliminar</button>
            </div>
            <hr />
        </div>
    );
}

export default ClienteCard;
