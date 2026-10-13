// Nombre legible de cada registro cuando se usa como opción de un <select>
export const etiqueta = {
    clientes: (c) => `${c.nombre} ${c.apellido}`,
    marcas: (m) => m.nombre,
    perfumes: (p) => p.nombre,
    ventas: (v) => `V-${String(v.id).padStart(5, "0")}`,
};

export const soles = (n) =>
    `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fecha = (f) => (f ? String(f).slice(0, 10).split("-").reverse().join("/") : "");

const buscar = (lista, id) => (lista || []).find((x) => x.id === id);
const iniciales = (t = "") => t.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

// Agrupa el campo "género" en categorías de tienda
export function categoriaDe(g = "") {
    const t = String(g).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (/\bnin|kid|infan/.test(t)) return "Niños";
    if (/unisex/.test(t)) return "Unisex";
    if (/fem|mujer|women|dama/.test(t)) return "Mujer";
    if (/masc|hombre|men|varon/.test(t)) return "Hombre";
    return g || "Otros";
}

const ESTADOS_ENVIO = ["En camino", "En proceso", "Entregado", "Cancelado"];
const ESTADOS_VENTA = ["Completada", "Pendiente", "Anulada"];

// Cada entidad: ruta de la API, campos del formulario y cómo se dibuja en la lista
export const ENTIDADES = {
    clientes: {
        ruta: "clientes", titulo: "Clientes", singular: "cliente", icono: "users", refs: [],
        campos: [
            { name: "nombre", label: "Nombre", required: true },
            { name: "apellido", label: "Apellido", required: true },
            { name: "dniRuc", label: "DNI/RUC", required: true },
            { name: "telefono", label: "Teléfono" },
            { name: "email", label: "Correo electrónico", type: "email" },
            { name: "direccion", label: "Dirección" },
        ],
        fila: (x) => ({
            avatar: iniciales(`${x.nombre} ${x.apellido}`),
            titulo: `${x.nombre} ${x.apellido}`,
            sub: `${x.email || ""}  |  ${x.telefono || ""}`,
            extra: x.dniRuc ? `DNI/RUC: ${x.dniRuc}` : "",
        }),
    },
    marcas: {
        ruta: "marcas", titulo: "Marcas", singular: "marca", icono: "tag", refs: [],
        campos: [
            { name: "nombre", label: "Nombre", required: true },
            { name: "paisOrigen", label: "País de origen" },
            { name: "descripcion", label: "Descripción" },
        ],
        fila: (x) => ({
            avatar: iniciales(x.nombre),
            titulo: x.nombre,
            sub: x.descripcion || "",
            derecha: x.paisOrigen,
        }),
    },
    perfumes: {
        ruta: "perfumes", titulo: "Perfumes", singular: "perfume", icono: "bottle", refs: ["marcas", "detalles"], vista: "catalogo",
        campos: [
            { name: "idMarca", label: "Marca", type: "select", source: "marcas", required: true },
            { name: "nombre", label: "Nombre", required: true },
            { name: "genero", label: "Género", options: ["Femenino", "Masculino", "Unisex", "Niños"] },
            { name: "concentracion", label: "Concentración", options: ["Eau de Parfum", "Eau de Toilette", "Parfum", "Eau de Cologne"] },
            { name: "mililitros", label: "Mililitros", type: "number" },
            { name: "precio", label: "Precio (S/)", type: "number", step: "0.01", required: true },
            { name: "stock", label: "Stock", type: "number" },
        ],
        fila: (x, ctx) => ({
            avatar: iniciales(x.nombre),
            titulo: x.nombre,
            sub: `${buscar(ctx.marcas, x.idMarca)?.nombre || "Sin marca"}${x.mililitros ? ` · ${x.mililitros} ml` : ""}`,
            derecha: soles(x.precio),
            extra: `Stock: ${x.stock ?? 0}`,
        }),
    },
    ventas: {
        ruta: "ventas", titulo: "Ventas", singular: "venta", icono: "cart", refs: ["clientes"],
        campos: [
            { name: "idCliente", label: "Cliente", type: "select", source: "clientes", required: true },
            { name: "fechaHora", label: "Fecha y hora", type: "datetime-local" },
            { name: "metodoPago", label: "Método de pago", options: ["Efectivo", "Tarjeta", "Yape", "Plin", "Transferencia"] },
            { name: "tipoComprobante", label: "Comprobante", options: ["Boleta", "Factura"] },
            { name: "montoTotal", label: "Monto total (S/)", type: "number", step: "0.01", required: true },
            { name: "estadoVenta", label: "Estado", options: ESTADOS_VENTA },
        ],
        fila: (x, ctx) => ({
            avatar: "V",
            titulo: etiqueta.ventas(x),
            sub: `${etiqueta.clientes(buscar(ctx.clientes, x.idCliente) || { nombre: "Cliente", apellido: "" })} · ${fecha(x.fechaHora)} · Pago: ${x.metodoPago || "No especificado"}`,
            derecha: soles(x.montoTotal),
            badge: x.estadoVenta,
        }),
    },
    detalles: {
        ruta: "detalle-ventas", titulo: "Detalle de venta", singular: "detalle", icono: "file", refs: ["ventas", "perfumes"],
        campos: [
            { name: "idVenta", label: "Venta", type: "select", source: "ventas", required: true },
            { name: "idPerfume", label: "Perfume", type: "select", source: "perfumes", required: true },
            { name: "cantidad", label: "Cantidad", type: "number", required: true },
            { name: "precioUnitario", label: "Precio unitario (S/)", type: "number", step: "0.01", required: true },
            { name: "descuento", label: "Descuento (S/)", type: "number", step: "0.01" },
        ],
        fila: (x, ctx) => ({
            avatar: "D",
            titulo: buscar(ctx.perfumes, x.idPerfume)?.nombre || "Perfume",
            sub: `Venta ${etiqueta.ventas({ id: x.idVenta })} · Cant. ${x.cantidad}`,
            derecha: soles(x.cantidad * x.precioUnitario - (x.descuento || 0)),
            extra: `P. unit. ${soles(x.precioUnitario)}`,
        }),
    },
    pedidos: {
        ruta: "pedidos", titulo: "Pedidos / Envíos", singular: "pedido", icono: "truck", refs: ["ventas", "clientes"],
        filtroEstado: "estadoEnvio",
        campos: [
            { name: "idVenta", label: "Venta", type: "select", source: "ventas", required: true },
            { name: "fechaPedido", label: "Fecha de pedido", type: "date" },
            { name: "fechaEntrega", label: "Fecha de entrega", type: "date" },
            { name: "estadoEnvio", label: "Estado del envío", options: ESTADOS_ENVIO },
        ],
        fila: (x, ctx) => {
            const venta = buscar(ctx.ventas, x.idVenta);
            const cli = buscar(ctx.clientes, venta?.idCliente);
            return {
                avatar: "P",
                titulo: `PED-${String(x.id).padStart(4, "0")}`,
                sub: `Cliente: ${cli ? etiqueta.clientes(cli) : "—"}`,
                extra: `Pedido: ${fecha(x.fechaPedido)}${x.fechaEntrega ? ` · Entrega: ${fecha(x.fechaEntrega)}` : ""}`,
                badge: x.estadoEnvio,
            };
        },
    },
    recepciones: {
        ruta: "recepciones", titulo: "Recepción de carga", singular: "recepción", icono: "box", refs: ["perfumes"],
        campos: [
            { name: "idPerfume", label: "Perfume", type: "select", source: "perfumes", required: true },
            { name: "numeroLote", label: "N° de lote", required: true },
            { name: "cantidadRecibida", label: "Cantidad recibida", type: "number", required: true },
            { name: "fechaRecepcion", label: "Fecha de recepción", type: "date" },
        ],
        fila: (x, ctx) => ({
            avatar: "R",
            titulo: buscar(ctx.perfumes, x.idPerfume)?.nombre || "Perfume",
            sub: `Lote: ${x.numeroLote} · ${fecha(x.fechaRecepcion)}`,
            derecha: `${x.cantidadRecibida} u.`,
        }),
    },
};
