import { useState } from "react";

const VACIO = {
    nombre: "",
    apellido: "",
    dniRuc: "",
    telefono: "",
    email: "",
    direccion: "",
};

// Sirve para CREAR (sin clienteInicial) y para EDITAR (con clienteInicial)
function ClienteForm({ clienteInicial, onGuardar, onCancelar }) {
    const [form, setForm] = useState(clienteInicial || VACIO);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar(form);
    };

    return (
        <form className="cliente-form" onSubmit={handleSubmit}>
            <h3>{clienteInicial ? "Editar cliente" : "Nuevo cliente"}</h3>
            <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
            <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} required />
            <input name="dniRuc" placeholder="DNI/RUC" value={form.dniRuc} onChange={handleChange} required />
            <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} />
            <input name="email" type="email" placeholder="Correo electrónico" value={form.email} onChange={handleChange} />
            <input name="direccion" placeholder="Dirección" value={form.direccion} onChange={handleChange} />
            <div className="acciones">
                <button type="submit">Guardar</button>
                <button type="button" onClick={onCancelar}>Cancelar</button>
            </div>
        </form>
    );
}

export default ClienteForm;