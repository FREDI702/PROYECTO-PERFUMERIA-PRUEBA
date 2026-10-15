import { useState } from "react";
import Icon from "./Icon.jsx";
import { etiqueta } from "../config.js";
import PerfumeImg from "./PerfumeImg.jsx";

function aFormulario(campos, item) {
    const f = {};
    campos.forEach((c) => {
        let v = item ? item[c.name] : "";
        if (v === null || v === undefined) v = "";
        if (c.type === "datetime-local") v = String(v).slice(0, 16);
        f[c.name] = v;
    });
    return f;
}

function aDatos(campos, form) {
    const d = {};
    campos.forEach((c) => {
        const v = form[c.name];
        if (c.type === "number" || c.type === "select") d[c.name] = v === "" ? null : Number(v);
        else d[c.name] = v === "" ? null : v;
    });
    return d;
}

function FormModal({ entidad, item, lookups, onGuardar, onCerrar, error }) {
    const [form, setForm] = useState(() => aFormulario(entidad.campos, item));
    const [guardando, setGuardando] = useState(false);
    const [imagen, setImagen] = useState(null);
    const [errorImagen, setErrorImagen] = useState("");
    const esPerfume = entidad.ruta === "perfumes";

    const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const cambiarImagen = (evento) => {
        const archivo = evento.target.files?.[0] || null;
        if (!archivo) {
            setImagen(null);
            setErrorImagen("");
            return;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
            evento.target.value = "";
            setImagen(null);
            setErrorImagen("La imagen debe estar en formato JPG, PNG o WebP.");
            return;
        }
        if (archivo.size > 5 * 1024 * 1024) {
            evento.target.value = "";
            setImagen(null);
            setErrorImagen("La imagen no puede superar los 5 MB.");
            return;
        }
        setImagen(archivo);
        setErrorImagen("");
    };

    const enviar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await onGuardar(aDatos(entidad.campos, form), imagen);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
            <form className="modal" onSubmit={enviar} autoComplete="off">
                <div className="modal-cab">
                    <h3>{item ? "Editar" : "Registrar"} {entidad.singular}</h3>
                    <button type="button" className="icono" onClick={onCerrar}><Icon nombre="x" /></button>
                </div>

                {entidad.campos.map((c) => (
                    <label key={c.name}>
                        <span>{c.label}</span>
                        {c.type === "select" ? (
                            <select name={c.name} value={form[c.name]} onChange={cambiar} required={c.required}>
                                <option value="">Seleccionar...</option>
                                {(lookups[c.source] || []).map((o) => (
                                    <option key={o.id} value={o.id}>{etiqueta[c.source](o)}</option>
                                ))}
                            </select>
                        ) : (
                            <>
                                <input
                                    name={c.name}
                                    type={c.type || "text"}
                                    step={c.step}
                                    min={c.type === "number" ? 0 : undefined}
                                    list={c.options ? `op-${c.name}` : undefined}
                                    value={form[c.name]}
                                    onChange={cambiar}
                                    required={c.required}
                                />
                                {c.options && (
                                    <datalist id={`op-${c.name}`}>
                                        {c.options.map((o) => <option key={o} value={o} />)}
                                    </datalist>
                                )}
                            </>
                        )}
                    </label>
                ))}

                {esPerfume && (
                    <label>
                        <span>Foto del perfume (JPG, PNG o WebP; máximo 5 MB)</span>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={cambiarImagen}
                            disabled={guardando}
                        />
                        {imagen ? (
                            <img
                                className="modal-imagen-perfume"
                                src={URL.createObjectURL(imagen)}
                                alt="Vista previa de la imagen seleccionada"
                            />
                        ) : item ? (
                            <div className="modal-imagen-perfume">
                                <PerfumeImg id={item.id} nombre={item.nombre} marca={lookups.marcas?.find((marca) => marca.id === item.idMarca)?.nombre} />
                            </div>
                        ) : null}
                    </label>
                )}

                {errorImagen && <p className="error" role="alert">{errorImagen}</p>}
                {error && <p className="error">{error}</p>}

                <div className="modal-acc">
                    <button type="button" className="btn sec" onClick={onCerrar}>Cancelar</button>
                    <button type="submit" className="btn" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FormModal;
