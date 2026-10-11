import { useState, useEffect } from "react";
import ClienteCard from "../components/ClienteCard.jsx";
import ClienteForm from "../components/ClienteForm.jsx";
import {
    obtenerClientes,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
} from "../services/ClienteService.js";
import "../styles/Cliente.css";

function ClientePage() {
    const [clientes, setClientes] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [clienteEditando, setClienteEditando] = useState(null);
    const [error, setError] = useState("");

    const cargarClientes = () => {
        obtenerClientes()
            .then(setClientes)
            .catch((e) => setError(e.message));
    };

    useEffect(() => {
        cargarClientes();
    }, []);

    const cerrarForm = () => {
        setMostrarForm(false);
        setClienteEditando(null);
    };

    // Crear o editar según haya cliente en edición
    const handleGuardar = (datos) => {
        const peticion = clienteEditando
            ? actualizarCliente(clienteEditando.id, datos)
            : crearCliente(datos);

        peticion
            .then(() => {
                setError("");
                cerrarForm();
                cargarClientes(); // vuelve a leer de la BD
            })
            .catch((e) => setError(e.message));
    };

    const handleEditar = (cliente) => {
        setClienteEditando(cliente);
        setMostrarForm(true);
    };

    const handleEliminar = (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return;
        eliminarCliente(id)
            .then(() => {
                setError("");
                cargarClientes();
            })
            .catch((e) => setError(e.message));
    };

    return (
        <div>
            <h1>MichiTienda</h1>
            <h2>Clientes</h2>

            {error && <p className="error">{error}</p>}

            {!mostrarForm && (
                <button onClick={() => setMostrarForm(true)}>+ Nuevo cliente</button>
            )}

            {mostrarForm && (
                <ClienteForm
                    key={clienteEditando ? clienteEditando.id : "nuevo"}
                    clienteInicial={clienteEditando}
                    onGuardar={handleGuardar}
                    onCancelar={cerrarForm}
                />
            )}

            <div className="cliente">
                {clientes.map((cliente) => (
                    <ClienteCard
                        key={cliente.id}
                        cliente={cliente}
                        onEditar={handleEditar}
                        onEliminar={handleEliminar}
                    />
                ))}
            </div>
        </div>
    );
}

export default ClientePage;
