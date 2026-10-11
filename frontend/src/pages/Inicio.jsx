import { useState, useEffect } from "react";
import { api } from "../api.js";
import { soles, fecha } from "../config.js";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";

function Grafico({ puntos }) {
    const W = 600, H = 170, P = 24;
    if (puntos.length === 0) return <p className="vacio">Aún no hay ventas registradas.</p>;
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
                    <circle cx={x} cy={y} r="4" fill="#7c3aed" />
                    <text x={x} y={H - 6} textAnchor="middle" fontSize="11" fill="#8a84a3">{puntos[i].dia}</text>
                </g>
            ))}
        </svg>
    );
}

function Inicio() {
    const [d, setD] = useState(null);
    const [errores, setErrores] = useState([]);

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

    const totalVentas = d.ventas.reduce((s, v) => s + Number(v.montoTotal || 0), 0);
    const enCamino = d.pedidos.filter((p) => !/entreg|cancel/i.test(p.estadoEnvio || "")).length;

    // Ventas agrupadas por día (últimos 7 días con ventas)
    const porDia = {};
    d.ventas.forEach((v) => {
        const k = String(v.fechaHora || "").slice(0, 10);
        if (k) porDia[k] = (porDia[k] || 0) + Number(v.montoTotal || 0);
    });
    const puntos = Object.keys(porDia).sort().slice(-7).map((k) => ({ dia: k.slice(8) + "/" + k.slice(5, 7), total: porDia[k] }));

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
        <section className="pagina">
            <div className="pagina-cab"><h1>Inicio</h1></div>

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
                <h3>Ventas recientes</h3>
                <Grafico puntos={puntos} />
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
        </section>
    );
}

export default Inicio;
