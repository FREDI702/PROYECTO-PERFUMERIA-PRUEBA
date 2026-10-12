import { useState, useEffect } from "react";
import { api } from "../api.js";
import { soles, fecha } from "../config.js";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import GaleriaFragancias from "../components/GaleriaFragancias.jsx";

const FORMATO_DIA = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", year: "numeric" });
const FORMATO_CORTO = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit" });
const FORMATO_MES_CORTO = new Intl.DateTimeFormat("es-PE", { month: "short" });
const COLORES_GRAFICO = ["#7c3aed", "#0e9f8a", "#f59e0b", "#e879a9", "#4385e5"];

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
    const W = 760, H = 270, IZQUIERDA = 62, DERECHA = 38, ARRIBA = 22, ABAJO = 45;
    const anchoGrafico = W - IZQUIERDA - DERECHA;
    const altoGrafico = H - ARRIBA - ABAJO;
    if (puntos.every((punto) => punto.cantidad === 0)) {
        return <p className="vacio">No hay ventas registradas en este periodo.</p>;
    }
    const maxTotal = Math.max(...puntos.map((p) => p.total), 1);
    const maxCantidad = Math.max(...puntos.map((p) => p.cantidad), 1);
    const anchoPunto = anchoGrafico / puntos.length;
    const xy = puntos.map((p, i) => [
        IZQUIERDA + (i + 0.5) * anchoPunto,
        ARRIBA + altoGrafico - (p.cantidad / maxCantidad) * altoGrafico,
    ]);
    const linea = xy.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
    const escalas = Array.from({ length: 5 }, (_, i) => {
        const proporcion = 1 - i / 4;
        return { y: ARRIBA + (altoGrafico * i) / 4, valor: maxTotal * proporcion };
    });
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="grafico" role="img" aria-label="Gráfico de ventas y cantidad de transacciones">
            {escalas.map((escala, i) => (
                <g key={i}>
                    <line x1={IZQUIERDA} x2={W - DERECHA} y1={escala.y} y2={escala.y} stroke="#eee8ee" strokeDasharray={i === 4 ? "0" : "3 5"} />
                    <text x={IZQUIERDA - 9} y={escala.y + 4} textAnchor="end" fontSize="10" fill="#8a84a3">
                        {i === 0 ? soles(escala.valor) : Math.round(escala.valor).toString()}
                    </text>
                </g>
            ))}
            {puntos.map((punto, i) => {
                const x = IZQUIERDA + i * anchoPunto + anchoPunto * 0.22;
                const alto = (punto.total / maxTotal) * altoGrafico;
                const etiqueta = punto.dia || `${String(punto.hora).padStart(2, "0")}:00`;
                return (
                    <g key={punto.clave}>
                        <title>{`${etiqueta}: ${soles(punto.total)} · ${punto.cantidad} ${punto.cantidad === 1 ? "venta" : "ventas"}`}</title>
                        <rect
                            x={x}
                            y={ARRIBA + altoGrafico - alto}
                            width={Math.max(2, anchoPunto * 0.56)}
                            height={Math.max(0, alto)}
                            rx="4"
                            fill="url(#ventas-barras)"
                        />
                        {punto.dia && (
                            <text x={IZQUIERDA + (i + 0.5) * anchoPunto} y={H - 14} textAnchor="middle" fontSize={tipo === "dia" ? "10" : "11"} fill="#8a84a3">{punto.dia}</text>
                        )}
                    </g>
                );
            })}
            <defs>
                <linearGradient id="ventas-barras" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#9c55dc" />
                    <stop offset="100%" stopColor="#7134b3" />
                </linearGradient>
            </defs>
            <path d={linea} fill="none" stroke="#0e9f8a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {xy.map(([x, y], i) => (
                <g key={`cantidad-${i}`}>
                    <circle cx={x} cy={y} r="4.5" fill="#fff" stroke="#0e9f8a" strokeWidth="3" />
                </g>
            ))}
            <text x={W - DERECHA + 9} y={ARRIBA + 4} fontSize="10" fill="#0e9f8a">{maxCantidad}</text>
            <text x={W - DERECHA + 9} y={ARRIBA + altoGrafico + 4} fontSize="10" fill="#0e9f8a">0</text>
        </svg>
    );
}

function GraficoAnillo({ datos }) {
    const radio = 39;
    const circunferencia = 2 * Math.PI * radio;
    const total = datos.reduce((suma, dato) => suma + dato.total, 0);

    if (total === 0) return <p className="vacio">Sin ventas registradas en este periodo.</p>;

    return (
        <div className="metodos-grafico">
            <svg viewBox="0 0 120 120" role="img" aria-label="Distribución de ventas por método de pago">
                <circle cx="60" cy="60" r={radio} fill="none" stroke="#f0edf1" strokeWidth="18" />
                {datos.map((dato, indice) => {
                    const longitud = (dato.total / total) * circunferencia;
                    const desplazamiento = datos
                        .slice(0, indice)
                        .reduce((suma, anterior) => suma + (anterior.total / total) * circunferencia, 0);
                    return (
                        <circle
                            key={dato.nombre}
                            cx="60"
                            cy="60"
                            r={radio}
                            fill="none"
                            stroke={COLORES_GRAFICO[indice % COLORES_GRAFICO.length]}
                            strokeWidth="18"
                            strokeDasharray={`${longitud} ${circunferencia - longitud}`}
                            strokeDashoffset={-desplazamiento}
                            transform="rotate(-90 60 60)"
                        />
                    );
                })}
                <text x="60" y="57" textAnchor="middle" fontSize="10" fill="#857983">Total</text>
                <text x="60" y="72" textAnchor="middle" fontSize="12" fontWeight="700" fill="#332a31">{soles(total)}</text>
            </svg>
            <div className="metodos-leyenda">
                {datos.map((dato, indice) => (
                    <div className="metodo-item" key={dato.nombre}>
                        <span className="metodo-color" style={{ backgroundColor: COLORES_GRAFICO[indice % COLORES_GRAFICO.length] }} />
                        <span className="metodo-nombre">{dato.nombre}</span>
                        <strong>{soles(dato.total)}</strong>
                    </div>
                ))}
            </div>
        </div>
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
    const ventasDelPeriodo = [];
    ventasValidas.forEach((venta) => {
        const fechaVenta = new Date(venta.fechaHora);
        if (Number.isNaN(fechaVenta.getTime()) || fechaVenta < definicionPeriodo.inicio || fechaVenta >= definicionPeriodo.fin) return;
        ventasDelPeriodo.push(venta);
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
    const maxUnidadesTop = Math.max(...top.map((producto) => producto.n), 1);
    const metodosPago = Object.values(ventasDelPeriodo.reduce((acumulado, venta) => {
        const metodo = String(venta.metodoPago || "No especificado").trim();
        if (!acumulado[metodo]) acumulado[metodo] = { nombre: metodo, total: 0, cantidad: 0 };
        acumulado[metodo].total += Number(venta.montoTotal || 0);
        acumulado[metodo].cantidad += 1;
        return acumulado;
    }, {})).sort((a, b) => b.total - a.total);

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
                <div className="ventas-leyenda">
                    <span><i className="leyenda-ventas" /> Monto vendido</span>
                    <span><i className="leyenda-transacciones" /> Número de ventas</span>
                </div>
                <Grafico puntos={puntos} tipo={periodo} />
                <p className="ventas-nota">Se excluyen ventas anuladas y canceladas. Los pagos pendientes aún pueden no estar confirmados.</p>
            </div>

            <div className="analisis-ventas">
                <div className="panel">
                    <div className="panel-grafico-cab">
                        <h3>Ventas por método de pago</h3>
                        <small>En el periodo seleccionado</small>
                    </div>
                    <GraficoAnillo datos={metodosPago} />
                </div>
                <div className="panel">
                    <div className="panel-grafico-cab">
                        <h3>Productos más vendidos</h3>
                        <small>Unidades registradas</small>
                    </div>
                    {top.length === 0 && <p className="vacio">Sin datos.</p>}
                    {top.map((t) => (
                        <div className="producto-estadistica" key={t.id}>
                            <div className="producto-estadistica-cab">
                                <span>{t.nombre}</span>
                                <strong>{t.n} {t.n === 1 ? "unidad" : "unidades"}</strong>
                            </div>
                            <div className="producto-barra"><span style={{ width: `${(t.n / maxUnidadesTop) * 100}%` }} /></div>
                            {t.marca && <small>{t.marca}</small>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="dos-col">
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
