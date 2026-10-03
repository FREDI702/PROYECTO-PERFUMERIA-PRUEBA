function ClienteCard({cliente}){
    return(
        <div>
            <h3>{cliente.nombre}{cliente.apellido}</h3>
            <p>DNI/RUC: {cliente.dniRuc}</p>
            <p>Teléfono: {cliente.telefono}</p>
            <p>Email: {cliente.email}</p>
            <p>Direción: {cliente.direccion}</p>
            <hr />
        </div>
    );
}
export default ClienteCard;