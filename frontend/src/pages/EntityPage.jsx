import { useState, useEffect, useCallback } from "react";
import { api } from "../api.js";
import { ENTIDADES } from "../config.js";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import FormModal from "../components/FormModal.jsx";
import PerfumeImg from "../components/PerfumeImg.jsx";
import { soles, categoriaDe, etiqueta } from "../config.js";

const DESCRIPCIONES = {
    clientes: "Consulta y organiza la información de tus clientes.",
    perfumes: "Explora el catálogo y controla precios y existencias.",
    ventas: "Revisa las ventas registradas y su estado.",
};

function EntityPage({ clave, rol }) {
    const entidad = ENTIDADES[clave];
    const puedeGestionar = rol === "ADMIN";
    const [items, setItems] = useState([]);
    const [lookups, setLookups] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [errorForm, setErrorForm] = useState("");
    const [confirmandoPago, setConfirmandoPago] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("Todos");
    const [modal, setModal] = useState(null); // null | { item }
    const [categoria, setCategoria] = useState("Todos");
    const [marcaF, setMarcaF] = useState("");
    const [orden, setOrden] = useState("vendidos");

    // TC01 - LISTAR (y carga las tablas relacionadas para mostrar nombres)
    const cargar = useCallback(() => {
        const refs = entidad.refs;
        return Promise.all([
            api.listar(entidad.ruta),
            Promise.allSettled(refs.map((r) => api.listar(ENTIDADES[r].ruta))),
        ])
            .then(([lista, resultados]) => {
                setItems(lista);
                const fallidos = [];
                setLookups(Object.fromEntries(refs.map((r, i) => {
                    const resultado = resultados[i];
                    if (resultado.status === "fulfilled") {
                        return [r, resultado.value];
                    }
                    fallidos.push(resultado.reason.message);
                    return [r, []];
                })));
                setError(fallidos.join(" · "));
            })
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }, [entidad]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    // TC02 / TC03 - CREAR o EDITAR
    const guardar = async (datos, imagen) => {
        let guardado;
        try {
            if (modal.item) {
                await api.actualizar(entidad.ruta, modal.item.id, datos);
                guardado = modal.item;
            } else {
                guardado = await api.crear(entidad.ruta, datos);
            }
            if (entidad.ruta === "perfumes" && imagen) {
                await api.subirImagenPerfume(imagen, guardado.id);
            }
            setModal(null);
            setErrorForm("");
            await cargar();
        } catch (e) {
            if (guardado) {
                setModal({ item: guardado });
                await cargar();
            }
            setErrorForm(e.message);
        }
    };

    const confirmarPagoYape = async (venta) => {
        const confirmar = window.confirm(
            `Confirma que verificaste el pago de S/ ${Number(venta.montoTotal || 0).toFixed(2)} en Yape antes de marcar la venta #${venta.id} como completada.`,
        );
        if (!confirmar) return;

        setConfirmandoPago(venta.id);
        setError("");
        setMensaje("");
        try {
            await api.actualizar("ventas", venta.id, { ...venta, estadoVenta: "Completada" });
            setMensaje(`Pago Yape de la venta #${venta.id} confirmado. Las estadísticas ya lo cuentan como venta.`);
            await cargar();
        } catch (fallo) {
            setError(fallo.message);
        } finally {
            setConfirmandoPago(null);
        }
    };

    // TC04 - ELIMINAR
    const eliminar = async (item) => {
        if (!window.confirm(`¿Eliminar este ${entidad.singular}?`)) return;
        try {
            await api.eliminar(entidad.ruta, item.id);
            await cargar();
        } catch (e) {
            setError(e.message);
        }
    };

    const estados = entidad.filtroEstado
        ? ["Todos", ...new Set(items.map((x) => x[entidad.filtroEstado]).filter(Boolean))]
        : [];

    const visibles = items
        .filter((x) => !entidad.filtroEstado || filtro === "Todos" || x[entidad.filtroEstado] === filtro)
        .filter((x) => JSON.stringify(x).toLowerCase().includes(busqueda.toLowerCase()))
        .sort((a, b) => b.id - a.id);

    // ----- Catálogo: filtros por categoría y marca, y orden (como en una tienda) -----
    const esCatalogo = entidad.vista === "catalogo";
    const categorias = esCatalogo ? ["Todos", ...new Set(items.map((x) => categoriaDe(x.genero)))] : [];
    const vendidos = {};
    (lookups.detalles || []).forEach((d) => {
        vendidos[d.idPerfume] = (vendidos[d.idPerfume] || 0) + Number(d.cantidad || 0);
    });
    const productos = !esCatalogo
        ? visibles
        : visibles
              .filter((x) => categoria === "Todos" || categoriaDe(x.genero) === categoria)
              .filter((x) => !marcaF || String(x.idMarca) === marcaF)
              .sort((a, b) => {
                  if (orden === "precio-asc") return a.precio - b.precio;
                  if (orden === "precio-desc") return b.precio - a.precio;
                  if (orden === "nombre") return String(a.nombre).localeCompare(String(b.nombre));
                  return (vendidos[b.id] || 0) - (vendidos[a.id] || 0) || b.id - a.id;
              });

    return (
        <section className={`pagina pagina-${clave}`}>
            <div className="pagina-cab">
                <div className="pagina-titulos">
                    <span className="pagina-eyebrow">GESTIÓN DE {entidad.titulo.toUpperCase()}</span>
                    <h1>{entidad.titulo}</h1>
                    {DESCRIPCIONES[clave] && <p className="pagina-descripcion">{DESCRIPCIONES[clave]}</p>}
                </div>
                <span className="pagina-conteo">
                    {entidad.vista === "catalogo" ? productos.length : visibles.length}{" "}
                    {entidad.vista === "catalogo" ? "productos" : entidad.titulo.toLowerCase()}
                </span>
                {puedeGestionar && (
                    <button className="btn" onClick={() => { setErrorForm(""); setModal({ item: null }); }}>
                        <Icon nombre="plus" size={18} /> Agregar {entidad.singular}
                    </button>
                )}
            </div>

            <div className="buscador">
                <Icon nombre="search" size={18} />
                <input placeholder={`Buscar ${entidad.singular}...`} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>

            {estados.length > 0 && (
                <div className="chips">
                    {estados.map((s) => (
                        <button key={s} className={s === filtro ? "chip activo" : "chip"} onClick={() => setFiltro(s)}>{s}</button>
                    ))}
                </div>
            )}

            {error && <p className="error">{error}</p>}
            {mensaje && <p className="exito" role="status">{mensaje}</p>}
            {cargando && <p className="vacio">Cargando...</p>}
            {!cargando && !error && productos.length === 0 && <p className="vacio">No hay registros.</p>}

            <div className="lista" hidden={entidad.vista === "catalogo"}>
                {visibles.map((x) => {
                    const f = entidad.fila(x, lookups);
                    return (
                        <article className="fila" key={x.id}>
                            <div className="avatar">{f.avatar}</div>
                            <div className="fila-info">
                                <strong>{f.titulo}</strong>
                                <small>{f.sub}</small>
                                {f.extra && <small>{f.extra}</small>}
                            </div>
                            <div className="fila-der">
                                {f.derecha && <b>{f.derecha}</b>}
                                <Badge texto={f.badge} />
                            </div>
                            {clave === "ventas" && puedeGestionar
                                && String(x.metodoPago || "").toLowerCase() === "yape"
                                && String(x.estadoVenta || "").toLowerCase() === "pendiente" && (
                                    <button
                                        className="btn confirmar-pago"
                                        onClick={() => confirmarPagoYape(x)}
                                        disabled={confirmandoPago === x.id}
                                    >
                                        {confirmandoPago === x.id ? "Guardando..." : "Confirmar pago Yape"}
                                    </button>
                                )}
                            {puedeGestionar && (
                                <div className="fila-acc">
                                    <button className="icono" title="Editar" onClick={() => { setErrorForm(""); setModal({ item: x }); }}>
                                        <Icon nombre="edit" size={18} />
                                    </button>
                                    <button className="icono peligro" title="Eliminar" onClick={() => eliminar(x)}>
                                        <Icon nombre="trash" size={18} />
                                    </button>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>

            {entidad.vista === "catalogo" && (
                <>
                    <div className="cat-filtros">
                        <div className="chips">
                            {categorias.map((c) => (
                                <button key={c} className={c === categoria ? "chip activo" : "chip"} onClick={() => setCategoria(c)}>{c}</button>
                            ))}
                        </div>
                        <div className="cat-ctrl">
                            <label>Marca
                                <select value={marcaF} onChange={(e) => setMarcaF(e.target.value)}>
                                    <option value="">Todas</option>
                                    {(lookups.marcas || []).map((m) => <option key={m.id} value={m.id}>{etiqueta.marcas(m)}</option>)}
                                </select>
                            </label>
                            <label>Ordenar por
                                <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                                    <option value="vendidos">Más vendidos</option>
                                    <option value="precio-asc">Precio: menor a mayor</option>
                                    <option value="precio-desc">Precio: mayor a menor</option>
                                    <option value="nombre">Nombre (A-Z)</option>
                                </select>
                            </label>
                            <span className="cuenta">{productos.length} productos</span>
                        </div>
                    </div>
                    <div className="catalogo">
                        {productos.map((x) => (
                            <article className="producto" key={x.id}>
                                <div className="producto-img">
                                    {(x.stock ?? 0) <= 0 && <span className="etiqueta agotado">Agotado</span>}
                                    {(x.stock ?? 0) > 0 && x.stock <= 5 && <span className="etiqueta">Últimas unidades</span>}
                                    <PerfumeImg key={`${x.id}-${x.nombre}`} id={x.id} nombre={x.nombre} marca={(lookups.marcas || []).find((m) => m.id === x.idMarca)?.nombre} />
                                </div>
                                <small className="marca-t">{(lookups.marcas || []).find((m) => m.id === x.idMarca)?.nombre}</small>
                                <h3>{x.nombre}</h3>
                                <p className="conc">{[x.concentracion, x.mililitros && `${x.mililitros} ml`].filter(Boolean).join(" · ")}</p>
                                <p className="desde">desde</p>
                                <p className="precio">{soles(x.precio)}</p>
                                <small className="stock">Stock: {x.stock ?? 0}</small>
                                {puedeGestionar ? (
                                    <>
                                        <button className="ver" onClick={() => { setErrorForm(""); setModal({ item: x }); }}>Ver información ›</button>
                                        <div className="producto-acc">
                                            <button onClick={() => { setErrorForm(""); setModal({ item: x }); }}>Editar</button>
                                            <button className="peligro" onClick={() => eliminar(x)}>Eliminar</button>
                                        </div>
                                    </>
                                ) : (
                                    <span className="ver solo-consulta">Información del producto</span>
                                )}
                            </article>
                        ))}
                    </div>
                </>
            )}

            {modal && (
                <FormModal
                    key={modal.item ? modal.item.id : "nuevo"}
                    entidad={entidad}
                    item={modal.item}
                    lookups={lookups}
                    error={errorForm}
                    onGuardar={guardar}
                    onCerrar={() => setModal(null)}
                />
            )}
        </section>
    );
}

export default EntityPage;
