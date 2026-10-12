import { useState, useEffect } from "react";
import { api } from "../api.js";
import { soles, fecha } from "../config.js";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import GaleriaFragancias from "../components/GaleriaFragancias.jsx";

const FORMATO_DIA = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", year: "numeric" });
const FORMATO_CORTO = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit" });
const FORMATO_MES_CORTO = new Intl.DateTimeFormat("es-PE", { month: "short" });

function inicioSemana(fecha) {
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    return inicio;
}

function claveFecha(fecha) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function obtenerPeriodo(tipo, referencia) {
    if (tipo === "dia") {
        const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
        const puntos = Array.from({ length: 24 }, (_, hora) => ({
            clave: `${claveFecha(inicio)}-${String(hora).padStart(2, "0")}`,
            dia: hora % 6 === 0 ? `${String(hora).padStart(2, "0")}:00` : "",
            hora,
        }));
        return { inicio, fin: new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 1), puntos, titulo: FORMATO_DIA.format(inicio) };
    }

    if (tipo === "semana") {
        const inicio = inicioSemana(referencia);
        const puntos = Array.from({ length: 7 }, (_, indice) => {
            const dia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice);
            return {
                clave: claveFecha(dia),
                dia: new Intl.DateTimeFormat("es-PE", { weekday: "short", day: "2-digit" }).format(dia),
            };
        });
        const ultimoDia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
        return {
            inicio,
            fin: new Date(ultimoDia.getFullYear(), ultimoDia.getMonth(), ultimoDia.getDate() + 1),
            puntos,
            titulo: `${FORMATO_CORTO.format(inicio)} – ${FORMATO_CORTO.format(ultimoDia)}`,
        };
    }

    const inicio = new Date(referencia.getFullYear(), 0, 1);
    const puntos = Array.from({ length: 12 }, (_, mes) => ({
        clave: `${inicio.getFullYear()}-${String(mes + 1).padStart(2, "0")}`,
        dia: FORMATO_MES_CORTO.format(new Date(inicio.getFullYear(), mes, 1)).replace(".", ""),
    }));
    return {
        inicio,
        fin: new Date(inicio.getFullYear() + 1, 0, 1),
        puntos,
        titulo: String(inicio.getFullYear()),
    };
}

function clavePeriodo(tipo, fecha) {
    if (tipo === "dia") return claveFecha(fecha);
    if (tipo === "semana") return claveFecha(inicioSemana(fecha));
    return String(fecha.getFullYear());
}

function desplazarPeriodo(tipo, fecha, paso) {
    const siguiente = new Date(fecha);
    if (tipo === "dia") siguiente.setDate(siguiente.getDate() + paso);
    else if (tipo === "semana") siguiente.setDate(siguiente.getDate() + (7 * paso));
    else siguiente.setFullYear(siguiente.getFullYear() + paso);
    return siguiente;
}

function Grafico({ puntos, tipo }) {
    const W = 720, H = 220, P = 34;
    if (puntos.every((punto) => punto.cantidad === 0)) {
        return <p className="vacio">No hay ventas registradas en este periodo.</p>;
    }
    const max = Math.max(...puntos.map((p) => p.total), 1);
    const paso = puntos.length > 1 ? (W - 2 * P) / (puntos.length - 1) : 0;
    const xy = puntos.map((p, i) => [P + i * paso, H - P - (p.total / max) * (H - 2 * P)]);
    const linea = xy.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
    const area = `${linea} L${xy[xy.length - 1][0]} ${H - P} L${xy[0][0]} ${H - P} Z`;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="grafico">
            <path d={area} fill="rgba(124,58,237,.12)" />
            <path d={linea} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" />
            {xy.map(([x, y], i) => (
                <g key={i}>
                    <title>{`${puntos[i].dia || `${String(puntos[i].hora).padStart(2, "0")}:00`}: ${soles(puntos[i].total)} · ${puntos[i].cantidad} ${puntos[i].cantidad === 1 ? "venta" : "ventas"}`}</title>
                    <circle cx={x} cy={y} r="4" fill="#7c3aed" />
                    {puntos[i].dia && (
                        <text x={x} y={H - 7} textAnchor="middle" fontSize={tipo === "dia" ? "10" : "11"} fill="#8a84a3">{puntos[i].dia}</text>
                    )}
                </g>
            ))}
        </svg>
    );
}

function Inicio() {
    const [d, setD] = useState(null);
    const [errores, setErrores] = useState([]);
    const [periodo, setPeriodo] = useState("semana");
    const [referencia, setReferencia] = useState(() => new Date());

    useEffect(() => {
        const recursos = ["ventas", "clientes", "pedidos", "detalle-ventas", "perfumes", "marcas"];
        Promise.allSettled(recursos.map((ruta) => api.listar(ruta)))
            .then((resultados) => {
                const datos = {};
                const fallos = [];
                resultados.forEach((resultado, indice) => {
                    const ruta = recursos[indice];
                    if (resultado.status === "fulfilled") {
                        datos[ruta] = resultado.value;
                    } else {
                        datos[ruta] = [];
                        fallos.push(resultado.reason.message);
                    }
                });
                setD({
                    ventas: datos.ventas,
                    clientes: datos.clientes,
                    pedidos: datos.pedidos,
                    detalles: datos["detalle-ventas"],
                    perfumes: datos.perfumes,
                    marcas: datos.marcas,
                });
                setErrores(fallos);
            });
    }, []);

    if (!d) return <section className="pagina"><p className="vacio">Cargando...</p></section>;

    const ventasValidas = d.ventas.filter((venta) => !/anulad|cancelad/i.test(venta.estadoVenta || ""));
    const totalVentas = ventasValidas.reduce((s, v) => s + Number(v.montoTotal || 0), 0);
    const enCamino = d.pedidos.filter((p) => !/entreg|cancel/i.test(p.estadoEnvio || "")).length;

    const definicionPeriodo = obtenerPeriodo(periodo, referencia);
    const acumulados = new Map(definicionPeriodo.puntos.map((punto) => [punto.clave, { total: 0, cantidad: 0 }]));
    ventasValidas.forEach((venta) => {
        const fechaVenta = new Date(venta.fechaHora);
        if (Number.isNaN(fechaVenta.getTime()) || fechaVenta < definicionPeriodo.inicio || fechaVenta >= definicionPeriodo.fin) return;
        const clave = periodo === "dia"
            ? `${claveFecha(fechaVenta)}-${String(fechaVenta.getHours()).padStart(2, "0")}`
            : periodo === "semana"
                ? claveFecha(fechaVenta)
                : `${fechaVenta.getFullYear()}-${String(fechaVenta.getMonth() + 1).padStart(2, "0")}`;
        const acumulado = acumulados.get(clave);
        if (acumulado) {
            acumulado.total += Number(venta.montoTotal || 0);
            acumulado.cantidad += 1;
        }
    });
    const puntos = definicionPeriodo.puntos.map((punto) => ({
        ...punto,
        ...acumulados.get(punto.clave),
    }));
    const ventasPeriodo = puntos.reduce((total, punto) => total + punto.total, 0);
    const cantidadPeriodo = puntos.reduce((total, punto) => total + punto.cantidad, 0);
    const promedioPeriodo = cantidadPeriodo ? ventasPeriodo / cantidadPeriodo : 0;
    const periodoActual = clavePeriodo(periodo, referencia) === clavePeriodo(periodo, new Date());

    // Productos más vendidos
    const vendidos = {};
    d.detalles.forEach((x) => { vendidos[x.idPerfume] = (vendidos[x.idPerfume] || 0) + Number(x.cantidad || 0); });
    const top = Object.entries(vendidos)
        .sort((a, b) => b[1] - a[1]).slice(0, 4)
        .map(([id, n]) => {
            const p = d.perfumes.find((x) => x.id === Number(id));
            return {
                id,
                nombre: p?.nombre || `Perfume #${id}`,
                marca: d.marcas.find((m) => m.id === p?.idMarca)?.nombre || "",
                n,
            };
        });

    const recientes = [...d.pedidos].sort((a, b) => b.id - a.id).slice(0, 4);

    const stats = [
        { t: "Total ventas", v: soles(totalVentas), i: "cart" },
        { t: "Pedidos en camino", v: enCamino, i: "truck" },
        { t: "Clientes activos", v: d.clientes.length, i: "users" },
    ];

    return (
        <section className="pagina pagina-inicio">
            <div className="pagina-cab inicio-cab">
                <div className="pagina-titulos">
                    <span className="pagina-eyebrow">PANEL DE CONTROL</span>
                    <h1>Inicio</h1>
                    <p className="pagina-descripcion">Un resumen rápido de la actividad de tu perfumería.</p>
                </div>
            </div>

            {errores.length > 0 && (
                <div className="error" role="alert">
                    <p>Algunos datos no están disponibles:</p>
                    <ul>{errores.map((mensaje) => <li key={mensaje}>{mensaje}</li>)}</ul>
                </div>
            )}

            <div className="stats">
                {stats.map((s) => (
                    <div className="stat" key={s.t}>
                        <div><small>{s.t}</small><strong>{s.v}</strong></div>
                        <span className="stat-ico"><Icon nombre={s.i} /></span>
                    </div>
                ))}
            </div>

            <div className="panel">
                <div className="ventas-cab">
                    <div>
                        <h3>Estadísticas de ventas</h3>
                        <p>{periodo === "dia" ? FORMATO_DIA.format(referencia) : periodo === "semana" ? `Semana del ${definicionPeriodo.titulo}` : `Año ${definicionPeriodo.titulo}`}</p>
                    </div>
                    <div className="ventas-periodos" role="group" aria-label="Periodo de estadísticas">
                        {[["dia", "Día"], ["semana", "Semana"], ["anio", "Año"]].map(([valor, texto]) => (
                            <button
                                className={periodo === valor ? "activo" : ""}
                                key={valor}
                                onClick={() => { setPeriodo(valor); setReferencia(new Date()); }}
                                aria-pressed={periodo === valor}
                            >
                                {texto}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="ventas-navegacion">
                    <button onClick={() => setReferencia((anterior) => desplazarPeriodo(periodo, anterior, -1))} aria-label="Ver periodo anterior">‹ Anterior</button>
                    <strong>{definicionPeriodo.titulo}</strong>
                    <button onClick={() => setReferencia((anterior) => desplazarPeriodo(periodo, anterior, 1))} disabled={periodoActual} aria-label="Ver periodo siguiente">Siguiente ›</button>
                    {!periodoActual && <button className="periodo-actual" onClick={() => setReferencia(new Date())}>Periodo actual</button>}
                </div>
                <div className="ventas-resumen">
                    <div><small>Ventas del periodo</small><strong>{soles(ventasPeriodo)}</strong></div>
                    <div><small>Transacciones</small><strong>{cantidadPeriodo}</strong></div>
                    <div><small>Promedio por venta</small><strong>{soles(promedioPeriodo)}</strong></div>
                </div>
                <Grafico puntos={puntos} tipo={periodo} />
                <p className="ventas-nota">Se excluyen ventas anuladas y canceladas. Los pagos pendientes aún pueden no estar confirmados.</p>
            </div>

            <div className="dos-col">
                <div className="panel">
                    <h3>Productos más vendidos</h3>
                    {top.length === 0 && <p className="vacio">Sin datos.</p>}
                    {top.map((t) => (
                        <div className="mini" key={t.id}>
                            <div className="avatar">{t.nombre[0]}</div>
                            <div className="fila-info"><strong>{t.nombre}</strong>{t.marca && <small>{t.marca}</small>}</div>
                            <small>{t.n} {t.n === 1 ? "venta" : "ventas"}</small>
                        </div>
                    ))}
                </div>
                <div className="panel">
                    <h3>Pedidos recientes</h3>
                    {recientes.length === 0 && <p className="vacio">Sin pedidos.</p>}
                    {recientes.map((p) => (
                        <div className="mini" key={p.id}>
                            <div className="fila-info">
                                <strong>#PED-{String(p.id).padStart(4, "0")}</strong>
                                <small>{fecha(p.fechaPedido)}</small>
                            </div>
                            <Badge texto={p.estadoEnvio} />
                        </div>
                    ))}
                </div>
            </div>

            <GaleriaFragancias />
        </section>
    );
}

export default Inicio;
