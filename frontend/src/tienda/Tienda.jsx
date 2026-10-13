import { useEffect, useMemo, useState } from 'react';
import Ubigeoperu from 'peru-ubigeo';
import { api } from '../api.js';
import { soles } from '../config.js';
import PerfumeImg from '../components/PerfumeImg.jsx';
import GaleriaFragancias from '../components/GaleriaFragancias.jsx';
import './tienda.css';

// Llamadas de la tienda: usan el mismo "api" del panel (que ya envía la sesión).
const obtenerPerfumes = () => api.listar('perfumes');
const obtenerMarcas = () => api.listar('marcas');
const obtenerCatalogo = () => Promise.all([obtenerPerfumes(), obtenerMarcas()]);
const crearPedido = (pedido) => api.crear('tienda/pedidos', pedido);
const consultarPedido = (idVenta, dni) =>
  api.listar(`tienda/pedidos/${encodeURIComponent(idVenta)}?dni=${encodeURIComponent(dni)}`);

const GENEROS = ['Todos', 'Masculino', 'Femenino', 'Unisex'];
const PAISES = [
  'Perú', 'Argentina', 'Bolivia', 'Brasil', 'Canadá', 'Chile', 'China', 'Colombia',
  'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'España', 'Estados Unidos',
  'Francia', 'Guatemala', 'Honduras', 'Italia', 'Japón', 'México', 'Nicaragua',
  'Panamá', 'Paraguay', 'Reino Unido', 'República Dominicana', 'Uruguay',
  'Venezuela', 'Alemania', 'Australia', 'Bélgica', 'Corea del Sur', 'India',
  'Países Bajos', 'Portugal', 'Suiza',
];
const PAGOS = [
  { valor: 'yape', texto: 'Yape' },
  { valor: 'plin', texto: 'Plin' },
  { valor: 'tarjeta', texto: 'Tarjeta' },
  { valor: 'efectivo', texto: 'Efectivo contra entrega' },
];
const OPCIONES_TARJETA = [
  { valor: 'visa', nombre: 'Visa', marca: 'VISA' },
  { valor: 'bcp', nombre: 'BCP', marca: 'BCP' },
  { valor: 'nacion', nombre: 'Banco de la Nación', marca: 'Banco de la Nación' },
  { valor: 'bbva', nombre: 'BBVA', marca: 'BBVA' },
];
const PASOS_ENVIO = [
  { clave: 'PENDIENTE', texto: 'Pedido recibido' },
  { clave: 'EN TRANSITO', texto: 'En camino' },
  { clave: 'ENTREGADO', texto: 'Entregado' },
];
const MAX_POR_PERFUME = 20;
const CLAVE_CARRITO = 'nectar_carrito';
const UBIGEO = new Ubigeoperu();

function claveCarrito(usuario) {
  return `${CLAVE_CARRITO}:${encodeURIComponent(usuario)}`;
}

function leerCarrito(clave) {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave) || '[]');
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

function Cerrar({ onClick }) {
  return (
    <button type="button" className="nt-cerrar" onClick={onClick} aria-label="Cerrar">
      ×
    </button>
  );
}

function IconoNav({ nombre }) {
  const rutas = {
    inicio: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
    perfumes: <><path d="M9 3h6M10 3v4l-4 3v10h12V10l-4-3V3" /><path d="M6 11h12M9 15h6" /></>,
    tu: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    carrito: <><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 9H6" /><circle cx="10" cy="21" r="1" /><circle cx="18" cy="21" r="1" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{rutas[nombre]}</svg>;
}

function IconoAgregarCarrito() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 9H6" />
      <circle cx="10" cy="21" r="1" />
      <circle cx="18" cy="21" r="1" />
      <path d="M14 6v6m-3-3h6" />
    </svg>
  );
}

function FiltrosCatalogo({ genero, onSeleccionarGenero, marcas, marcaSel, onMarca, orden, onOrden, variante }) {
  return (
    <section className={`nt-controles-catalogo ${variante}`} aria-label="Filtros de perfumes">
      <div className="nt-chips" role="tablist" aria-label="Filtrar por género">
        {GENEROS.map((g) => (
          <button key={g} type="button" role="tab" aria-selected={genero === g}
                  className={genero === g ? 'nt-chip nt-chip-activo' : 'nt-chip'} onClick={() => onSeleccionarGenero(g)}>
            {g === 'Masculino' ? 'Hombre' : g === 'Femenino' ? 'Mujer' : g}
          </button>
        ))}
      </div>

      <div className="nt-filtros">
        <label className="nt-campo"><span>Marca</span>
          <select value={marcaSel} onChange={(e) => onMarca(e.target.value)}>
            <option value="">Todas</option>
            {marcas.map((m) => <option key={m.id} value={String(m.id)}>{m.nombre}</option>)}
          </select></label>
        <label className="nt-campo"><span>Ordenar por</span>
          <select value={orden} onChange={(e) => onOrden(e.target.value)}>
            <option value="destacados">Destacados</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre (A–Z)</option>
          </select></label>
      </div>
    </section>
  );
}

// ---------- Tarjeta de perfume ----------
function TarjetaPerfume({ perfume, marca, onVer, onAgregar }) {
  const agotado = perfume.stock <= 0;
  return (
    <article className="nt-tarjeta">
      <button type="button" className="nt-tarjeta-img" onClick={() => onVer(perfume)} aria-label={`Ver ${perfume.nombre}`}>
        <PerfumeImg id={perfume.id} nombre={perfume.nombre} marca={marca} />
        {agotado && <span className="nt-sello">Agotado</span>}
      </button>
      <p className="nt-marca">{marca}</p>
      <h3 className="nt-tarjeta-nombre">{perfume.nombre}</h3>
      <p className="nt-tarjeta-meta">
        {perfume.concentracion} · {perfume.mililitros} ml
      </p>
      <p className="nt-precio">{soles(perfume.precio)}</p>
      <p className={`nt-stock ${perfume.stock > 0 && perfume.stock <= 5 ? 'nt-stock-bajo' : ''}`}>
        {agotado ? 'Sin stock' : perfume.stock <= 5 ? `Últimas ${perfume.stock} unidades` : 'Disponible'}
      </p>
      <div className="nt-tarjeta-acciones">
        <button type="button" className="nt-btn nt-btn-suave" onClick={() => onVer(perfume)}>
          Ver información
        </button>
        <button type="button" className="nt-btn nt-btn-agregar-carrito" disabled={agotado}
                onClick={() => onAgregar(perfume, 1)} aria-label={`Agregar ${perfume.nombre} al carrito`}
                title="Agregar al carrito">
          <IconoAgregarCarrito />
        </button>
      </div>
    </article>
  );
}

// ---------- Modal de detalle ----------
function ModalPerfume({ perfume, marca, onCerrar, onAgregar }) {
  const [cantidad, setCantidad] = useState(1);
  const tope = Math.min(perfume.stock, MAX_POR_PERFUME);
  const agotado = perfume.stock <= 0;
  return (
    <div className="nt-overlay" onClick={onCerrar}>
      <div className="nt-modal nt-modal-detalle" role="dialog" aria-modal="true" aria-label={perfume.nombre}
           onClick={(e) => e.stopPropagation()}>
        <Cerrar onClick={onCerrar} />
        <div className="nt-detalle-img">
          <PerfumeImg id={perfume.id} nombre={perfume.nombre} marca={marca} />
        </div>
        <div className="nt-detalle-info">
          <p className="nt-marca">{marca}</p>
          <h2 className="nt-detalle-titulo">{perfume.nombre}</h2>
          <dl className="nt-ficha">
            <div><dt>Para</dt><dd>{perfume.genero}</dd></div>
            <div><dt>Concentración</dt><dd>{perfume.concentracion}</dd></div>
            <div><dt>Contenido</dt><dd>{perfume.mililitros} ml</dd></div>
            <div><dt>Disponibles</dt><dd>{perfume.stock}</dd></div>
          </dl>
          <p className="nt-precio nt-precio-grande">{soles(perfume.precio)}</p>
          {!agotado && (
            <div className="nt-cantidad">
              <button type="button" onClick={() => setCantidad(Math.max(1, cantidad - 1))} aria-label="Menos">−</button>
              <span>{cantidad}</span>
              <button type="button" onClick={() => setCantidad(Math.min(tope, cantidad + 1))} aria-label="Más">+</button>
            </div>
          )}
          <button
            type="button"
            className="nt-btn nt-btn-primario nt-ancho"
            disabled={agotado}
            onClick={() => { onAgregar(perfume, cantidad); onCerrar(); }}
          >
            {agotado ? 'Agotado' : `Agregar al carrito · ${soles(Number(perfume.precio) * cantidad)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Carrito ----------
function Carrito({ lineas, total, onCerrar, onCambiar, onQuitar, onContinuar }) {
  return (
    <div className="nt-overlay nt-overlay-lado" onClick={onCerrar}>
      <aside className="nt-drawer" role="dialog" aria-modal="true" aria-label="Carrito de compras"
             onClick={(e) => e.stopPropagation()}>
        <header className="nt-drawer-cab">
          <h2>Tu carrito</h2>
          <Cerrar onClick={onCerrar} />
        </header>

        {lineas.length === 0 ? (
          <p className="nt-vacio">Aún no agregaste perfumes. ¡Explora el catálogo!</p>
        ) : (
          <ul className="nt-lineas">
            {lineas.map((l) => (
              <li key={l.id} className="nt-linea">
                <div className="nt-linea-mini">
                  <PerfumeImg id={l.id} nombre={l.nombre} marca={l.marca} />
                </div>
                <div className="nt-linea-info">
                  <p className="nt-linea-nombre">{l.nombre}</p>
                  <p className="nt-linea-meta">{soles(l.precio)} c/u</p>
                  <div className="nt-cantidad nt-cantidad-chica">
                    <button type="button" onClick={() => onCambiar(l.id, l.cantidad - 1)} aria-label="Menos">−</button>
                    <span>{l.cantidad}</span>
                    <button type="button" onClick={() => onCambiar(l.id, l.cantidad + 1)}
                            disabled={l.cantidad >= Math.min(l.stock, MAX_POR_PERFUME)} aria-label="Más">+</button>
                  </div>
                </div>
                <div className="nt-linea-der">
                  <p className="nt-linea-sub">{soles(l.precio * l.cantidad)}</p>
                  <button type="button" className="nt-btn-link" onClick={() => onQuitar(l.id)}>Quitar</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <footer className="nt-drawer-pie">
          <div className="nt-total"><span>Total</span><strong>{soles(total)}</strong></div>
          <button type="button" className="nt-btn nt-btn-primario nt-ancho" disabled={lineas.length === 0} onClick={onContinuar}>
            Continuar con el pedido
          </button>
        </footer>
      </aside>
    </div>
  );
}

// ---------- Datos de entrega y pago ----------
function Checkout({ lineas, total, onVolver, onCerrar, onListo }) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', dniRuc: '', telefono: '', email: '', direccion: '', referencia: '',
    pais: 'Perú', departamento: '', provincia: '', distrito: '', codigoPostal: '',
    metodoPago: 'yape', tipoComprobante: 'boleta',
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [opcionTarjeta, setOpcionTarjeta] = useState('visa');
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [mensajeUbicacion, setMensajeUbicacion] = useState('');
  const departamentoSeleccionado = form.departamento
    ? UBIGEO.getRegions(form.departamento)
    : undefined;
  const provincias = departamentoSeleccionado?.provinces() || [];
  const provinciaSeleccionada = provincias.find((item) => item.name === form.provincia);
  const distritos = provinciaSeleccionada?.districts() || [];

  function cambiar(campo) {
    return (e) => setForm((actual) => ({ ...actual, [campo]: e.target.value }));
  }

  function cambiarDepartamento(e) {
    const departamento = e.target.value;
    setForm((actual) => ({ ...actual, departamento, provincia: '', distrito: '' }));
  }

  function cambiarProvincia(e) {
    const provincia = e.target.value;
    setForm((actual) => ({ ...actual, provincia, distrito: '' }));
  }

  function agregarUbicacionActual() {
    if (!navigator.geolocation) {
      setMensajeUbicacion('Este navegador no permite obtener la ubicación.');
      return;
    }

    setObteniendoUbicacion(true);
    setMensajeUbicacion('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const ubicacion = `Ubicación GPS: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        setForm((actual) => ({
          ...actual,
          direccion: actual.direccion.trim()
            ? `${actual.direccion.trim()} · ${ubicacion}`
            : ubicacion,
        }));
        setMensajeUbicacion('Ubicación agregada a la dirección. Completa también ciudad y datos de entrega.');
        setObteniendoUbicacion(false);
      },
      (fallo) => {
        const mensaje = fallo.code === fallo.PERMISSION_DENIED
          ? 'No se autorizó el acceso a la ubicación. Permítelo en el navegador e inténtalo otra vez.'
          : fallo.code === fallo.TIMEOUT
            ? 'La ubicación tardó demasiado. Inténtalo otra vez.'
            : 'No se pudo obtener la ubicación actual.';
        setMensajeUbicacion(mensaje);
        setObteniendoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    const dni = form.dniRuc.trim();
    const telefono = form.telefono.replace(/[^\d]/g, '');
    if (!/^(\d{8}|\d{11})$/.test(dni)) return setError('El DNI debe tener 8 dígitos (o RUC de 11).');
    if (form.tipoComprobante === 'factura' && dni.length !== 11) return setError('Para factura necesitas un RUC de 11 dígitos.');
    if (!/^\+?[\d\s().-]{7,20}$/.test(form.telefono.trim()) || !/^\d{7,15}$/.test(telefono)) {
      return setError('Ingresa un teléfono válido con código de país, por ejemplo +51 952 411 480.');
    }
    const codigoPostal = form.codigoPostal.trim();
    if (form.pais === 'Perú' ? !/^\d{5}$/.test(codigoPostal) : !/^[\p{L}\d][\p{L}\d -]{1,11}$/u.test(codigoPostal)) {
      return setError(form.pais === 'Perú'
        ? 'El código postal de Perú debe tener 5 dígitos.'
        : 'Ingresa un código postal válido para el país seleccionado.');
    }

    const ubicacionSeleccionada = form.pais === 'Perú'
      ? {
          departamento: departamentoSeleccionado?.name,
          provincia: provinciaSeleccionada?.name,
          distrito: form.distrito,
        }
      : {
          departamento: form.departamento.trim(),
          provincia: form.provincia.trim(),
          distrito: form.distrito.trim(),
        };
    const direccionCompleta = [
      form.direccion.trim(),
      form.referencia.trim() && `Referencia: ${form.referencia.trim()}`,
      `Distrito: ${ubicacionSeleccionada.distrito}`,
      `Provincia: ${ubicacionSeleccionada.provincia}`,
      `Departamento/estado: ${ubicacionSeleccionada.departamento}`,
      `Código postal: ${codigoPostal}`,
      form.pais,
    ].filter(Boolean).join(', ');
    if (direccionCompleta.length > 255) {
      return setError('La dirección completa supera el límite permitido. Acorta la dirección o los datos de ubicación.');
    }

    setEnviando(true);
    try {
      const pedido = await crearPedido({
        cliente: {
          nombre: form.nombre, apellido: form.apellido, dniRuc: dni,
          telefono, email: form.email, direccion: direccionCompleta,
        },
        metodoPago: form.metodoPago,
        tipoComprobante: form.tipoComprobante,
        items: lineas.map((l) => ({ idPerfume: l.id, cantidad: l.cantidad })),
      });
      onListo(pedido, dni, form.email.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="nt-overlay" onClick={onCerrar}>
      <form className="nt-modal nt-modal-form" onSubmit={enviar} role="dialog" aria-modal="true"
            aria-label="Datos del pedido" onClick={(e) => e.stopPropagation()}>
        <Cerrar onClick={onCerrar} />
        <h2 className="nt-modal-titulo">Datos de tu pedido</h2>

        <label className="nt-campo"><span>País/región</span>
          <select value={form.pais} onChange={cambiar('pais')} autoComplete="country-name">
            {PAISES.map((pais) => <option key={pais} value={pais}>{pais}</option>)}
          </select></label>

        <div className="nt-grid-2">
          <label className="nt-campo"><span>Nombre</span>
            <input value={form.nombre} onChange={cambiar('nombre')} required maxLength={100} autoComplete="given-name" /></label>
          <label className="nt-campo"><span>Apellido</span>
            <input value={form.apellido} onChange={cambiar('apellido')} required maxLength={100} autoComplete="family-name" /></label>
          <label className="nt-campo"><span>DNI o RUC</span>
            <input value={form.dniRuc} onChange={cambiar('dniRuc')} required inputMode="numeric" maxLength={11} /></label>
          <label className="nt-campo"><span>Teléfono</span>
            <input value={form.telefono} onChange={cambiar('telefono')} required inputMode="tel" maxLength={20}
                   autoComplete="tel" placeholder="+51 952 411 480" /></label>
        </div>
        <label className="nt-campo"><span>Correo para recibir tu confirmación</span>
          <input type="email" value={form.email} onChange={cambiar('email')} required maxLength={254}
                 autoComplete="email" /></label>
        <div className="nt-direccion-cab">
          <label className="nt-campo"><span>Dirección de entrega</span>
            <input value={form.direccion} onChange={cambiar('direccion')} required maxLength={250} autoComplete="street-address" /></label>
          <button type="button" className="nt-btn nt-btn-ubicacion" onClick={agregarUbicacionActual} disabled={obteniendoUbicacion}>
            {obteniendoUbicacion ? 'Buscando ubicación…' : 'Usar mi ubicación actual'}
          </button>
        </div>
        {mensajeUbicacion && <p className="nt-mensaje-ubicacion" role="status">{mensajeUbicacion}</p>}
        <label className="nt-campo"><span>Referencia (opcional)</span>
          <input value={form.referencia} onChange={cambiar('referencia')} maxLength={80}
                 placeholder="Ej.: cerca al parque, casa de portón negro" /></label>

        <div className="nt-grid-2">
          {form.pais === 'Perú' ? (
            <>
              <label className="nt-campo"><span>Departamento</span>
                <select value={form.departamento} onChange={cambiarDepartamento} required autoComplete="address-level1">
                  <option value="">Selecciona un departamento</option>
                  {UBIGEO.getRegions().map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></label>
              <label className="nt-campo"><span>Provincia</span>
                <select value={form.provincia} onChange={cambiarProvincia} required disabled={!form.departamento}
                        autoComplete="address-level2">
                  <option value="">Selecciona una provincia</option>
                  {provincias.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select></label>
              <label className="nt-campo"><span>Distrito</span>
                <select value={form.distrito} onChange={cambiar('distrito')} required disabled={!form.provincia}
                        autoComplete="address-level3">
                  <option value="">Selecciona un distrito</option>
                  {distritos.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select></label>
            </>
          ) : (
            <>
              <label className="nt-campo"><span>Departamento / estado</span>
                <input value={form.departamento} onChange={cambiar('departamento')} required maxLength={80} autoComplete="address-level1" /></label>
              <label className="nt-campo"><span>Provincia</span>
                <input value={form.provincia} onChange={cambiar('provincia')} required maxLength={80} autoComplete="address-level2" /></label>
              <label className="nt-campo"><span>Distrito / ciudad</span>
                <input value={form.distrito} onChange={cambiar('distrito')} required maxLength={80} autoComplete="address-level3" /></label>
            </>
          )}
          <label className="nt-campo"><span>Código postal</span>
            <input value={form.codigoPostal} onChange={cambiar('codigoPostal')} required maxLength={12}
                   autoComplete="postal-code" /></label>
        </div>

        <div className="nt-grid-2">
          <label className="nt-campo"><span>Método de pago</span>
            <select value={form.metodoPago} onChange={cambiar('metodoPago')}>
              {PAGOS.map((p) => <option key={p.valor} value={p.valor}>{p.texto}</option>)}
            </select></label>
          <label className="nt-campo"><span>Comprobante</span>
            <select value={form.tipoComprobante} onChange={cambiar('tipoComprobante')}>
              <option value="boleta">Boleta</option>
              <option value="factura">Factura (RUC)</option>
            </select></label>
        </div>

        {form.metodoPago === 'yape' && (
          <section className="nt-yape-pago" aria-label="Pago con Yape">
            <h3>Escanea el QR para pagar con Yape</h3>
            <img src="/pagos/yape-qr.png" alt="Código QR de pago con Yape" />
            <p>Paga el total exacto del pedido: <strong>{soles(total)}</strong>.</p>
            <p>Verifica el nombre del destinatario en Yape. El pedido quedará pendiente hasta confirmar manualmente el pago; esta página no valida la transferencia.</p>
          </section>
        )}

        {form.metodoPago === 'tarjeta' && (
          <section className="nt-tarjeta-demo" aria-label="Opciones de tarjeta">
            <h3>Selecciona una opción de tarjeta</h3>
            <div className="nt-tarjeta-opciones" role="radiogroup" aria-label="Tarjeta o banco">
              {OPCIONES_TARJETA.map((opcion) => (
                <label
                  className={`nt-tarjeta-opcion${opcionTarjeta === opcion.valor ? ' seleccionada' : ''}`}
                  key={opcion.valor}
                >
                  <input
                    type="radio"
                    name="opcion-tarjeta"
                    value={opcion.valor}
                    checked={opcionTarjeta === opcion.valor}
                    onChange={() => setOpcionTarjeta(opcion.valor)}
                  />
                  <span className={`nt-tarjeta-marca nt-marca-${opcion.valor}`}>{opcion.marca}</span>
                  <span>{opcion.nombre}</span>
                </label>
              ))}
            </div>
            <p>Demostración para la exposición: no ingreses datos de tarjeta. Esta opción no realiza cobros reales; el pago debe verificarse manualmente.</p>
          </section>
        )}

        <div className="nt-resumen-mini">
          {lineas.map((l) => (
            <p key={l.id}><span>{l.cantidad} × {l.nombre}</span><span>{soles(l.precio * l.cantidad)}</span></p>
          ))}
          <p className="nt-resumen-total"><span>Total a pagar</span><strong>{soles(total)}</strong></p>
        </div>

        {error && <p className="nt-error" role="alert">{error}</p>}

        <div className="nt-fila-botones">
          <button type="button" className="nt-btn nt-btn-suave" onClick={onVolver}>← Carrito</button>
          <button type="submit" className="nt-btn nt-btn-primario" disabled={enviando}>
            {enviando
              ? 'Enviando…'
              : form.metodoPago === 'yape'
                ? 'Registrar pedido · pago por validar'
                : 'Confirmar pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- Orden de pedido (confirmación y seguimiento) ----------
function Orden({ pedido, titulo, onCerrar, extra, onActualizar, actualizando, error }) {
  const estadoRecibido = String(pedido.estadoEnvio || 'PENDIENTE').trim();
  const estadoNormalizado = estadoRecibido.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toUpperCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  const claveEstado = ['EN CAMINO', 'EN REPARTO'].includes(estadoNormalizado)
    ? 'EN TRANSITO'
    : ['COMPLETADO', 'FINALIZADO'].includes(estadoNormalizado)
      ? 'ENTREGADO'
      : estadoNormalizado;
  const indice = PASOS_ENVIO.findIndex((p) => p.clave === claveEstado);
  const textoEstado = indice >= 0 ? PASOS_ENVIO[indice].texto : estadoRecibido;
  return (
    <div className="nt-orden">
      <p className="nt-etiqueta">{titulo}</p>
      <h2 className="nt-modal-titulo">Orden de pedido N.º {pedido.idVenta}</h2>
      <p className="nt-orden-datos">
        Cliente: <strong>{pedido.cliente}</strong>
        {pedido.idPedido ? <> · Envío N.º {pedido.idPedido}</> : null}
        {pedido.fecha ? <> · {pedido.fecha.slice(0, 10)}</> : null}
      </p>
      <p className="nt-estado-actual" role="status">Estado actual: <strong>{textoEstado}</strong></p>

      <ol className="nt-pasos" aria-label="Estado del envío">
        {PASOS_ENVIO.map((p, i) => (
          <li key={p.clave}
              className={`nt-paso${i <= indice ? ' nt-paso-hecho' : ''}${i === indice ? ' nt-paso-actual' : ''}`}
              aria-current={i === indice ? 'step' : undefined}>
            <span className="nt-paso-punto" aria-hidden="true" />
            {p.texto}
          </li>
        ))}
      </ol>

      <table className="nt-tabla">
        <thead><tr><th>Perfume</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th></tr></thead>
        <tbody>
          {pedido.items.map((it, i) => (
            <tr key={i}>
              <td>{it.nombre}</td>
              <td>{it.cantidad}</td>
              <td>{soles(it.precioUnitario)}</td>
              <td>{soles(it.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan="3">Total</td><td>{soles(pedido.total)}</td></tr></tfoot>
      </table>
      <p className="nt-orden-datos">
        Pago: {pedido.metodoPago} · Comprobante: {pedido.tipoComprobante}
        {pedido.fechaEntrega ? <> · Entrega: {pedido.fechaEntrega}</> : null}
      </p>
      {extra}
      {error && <p className="nt-error" role="alert">{error}</p>}
      <div className="nt-fila-botones nt-noprint">
        {onActualizar && (
          <button type="button" className="nt-btn nt-btn-suave" onClick={onActualizar} disabled={actualizando}>
            {actualizando ? 'Actualizando…' : 'Actualizar estado'}
          </button>
        )}
        <button type="button" className="nt-btn nt-btn-suave" onClick={() => window.print()}>Imprimir orden</button>
        <button type="button" className="nt-btn nt-btn-primario" onClick={onCerrar}>Seguir comprando</button>
      </div>
    </div>
  );
}

function Confirmacion({ pedido, dni, correo, onCerrar }) {
  return (
    <div className="nt-overlay" onClick={onCerrar}>
      <div className="nt-modal nt-modal-orden" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <Cerrar onClick={onCerrar} />
        <Orden
          pedido={pedido}
          titulo="¡Pedido registrado!"
          onCerrar={onCerrar}
          extra={
            <p className="nt-aviso">
              {pedido.correoEnviado
                ? <>Enviamos el comprobante informativo a <strong>{correo}</strong>.</>
                : <>No pudimos enviar el comprobante a <strong>{correo}</strong>; guarda los datos de seguimiento que aparecen aquí.</>}
              {' '}Número de orden: <strong>{pedido.idVenta}</strong>. Código de seguimiento: tu DNI/RUC (<strong>{dni}</strong>).
            </p>
          }
        />
      </div>
    </div>
  );
}

function Seguimiento({ onCerrar }) {
  const [numero, setNumero] = useState('');
  const [dni, setDni] = useState('');
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);

  async function buscar(e) {
    e.preventDefault();
    setError('');
    setPedido(null);
    setBuscando(true);
    try {
      setPedido(await consultarPedido(numero.trim(), dni.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  }

  async function actualizarEstado() {
    setError('');
    setBuscando(true);
    try {
      setPedido(await consultarPedido(numero.trim(), dni.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="nt-overlay" onClick={onCerrar}>
      <div className="nt-modal nt-modal-orden" role="dialog" aria-modal="true" aria-label="Seguimiento de pedido"
           onClick={(e) => e.stopPropagation()}>
        <Cerrar onClick={onCerrar} />
        {pedido ? (
          <Orden pedido={pedido} titulo="Seguimiento" onCerrar={onCerrar}
                 onActualizar={actualizarEstado} actualizando={buscando} error={error} />
        ) : (
          <form onSubmit={buscar}>
            <h2 className="nt-modal-titulo">Seguimiento de pedido</h2>
            <p className="nt-acceso-texto">Ingresa tu número de orden y el DNI o RUC con el que compraste.</p>
            <div className="nt-grid-2">
              <label className="nt-campo"><span>N.º de orden</span>
                <input value={numero} onChange={(e) => setNumero(e.target.value)} required inputMode="numeric" autoFocus /></label>
              <label className="nt-campo"><span>DNI o RUC</span>
                <input value={dni} onChange={(e) => setDni(e.target.value)} required inputMode="numeric" maxLength={11} /></label>
            </div>
            {error && <p className="nt-error" role="alert">{error}</p>}
            <button type="submit" className="nt-btn nt-btn-primario nt-ancho" disabled={buscando}>
              {buscando ? 'Buscando…' : 'Consultar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------- Pantalla principal de la tienda ----------
export default function Tienda({ sesion, onSalir }) {
  const claveCarritoUsuario = claveCarrito(sesion.usuario);
  const [perfumes, setPerfumes] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [mensaje, setMensaje] = useState('');

  const [genero, setGenero] = useState('Todos');
  const [marcaSel, setMarcaSel] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('destacados');

  const [carrito, setCarrito] = useState(() => leerCarrito(claveCarritoUsuario));
  const [panel, setPanel] = useState(''); // '' | carrito | checkout | seguimiento
  const [detalle, setDetalle] = useState(null);
  const [confirmado, setConfirmado] = useState(null); // { pedido, dni, correo }

  async function cargar() {
    try {
      const [p, m] = await obtenerCatalogo();
      setPerfumes(Array.isArray(p) ? p : []);
      setMarcas(Array.isArray(m) ? m : []);
      setEstado('ok');
    } catch (err) {
      setMensaje(err.message);
      setEstado('error');
    }
  }

  useEffect(() => {
    let activa = true;
    obtenerCatalogo()
      .then(([p, m]) => {
        if (!activa) return;
        setPerfumes(Array.isArray(p) ? p : []);
        setMarcas(Array.isArray(m) ? m : []);
        setEstado('ok');
      })
      .catch((err) => {
        if (!activa) return;
        setMensaje(err.message);
        setEstado('error');
      });
    return () => { activa = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(claveCarritoUsuario, JSON.stringify(carrito));
    } catch { /* sin almacenamiento */ }
  }, [carrito, claveCarritoUsuario]);

  useEffect(() => {
    function alTeclear(e) {
      if (e.key === 'Escape') {
        setDetalle(null);
        setPanel('');
        setConfirmado(null);
      }
    }
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  const nombreMarca = useMemo(() => {
    const mapa = {};
    marcas.forEach((m) => { mapa[m.id] = m.nombre; });
    return mapa;
  }, [marcas]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const lista = perfumes.filter((p) => {
      if (genero !== 'Todos' && p.genero !== genero) return false;
      if (marcaSel && String(p.idMarca) !== marcaSel) return false;
      if (texto) {
        const pajar = `${p.nombre} ${nombreMarca[p.idMarca] || ''}`.toLowerCase();
        if (!pajar.includes(texto)) return false;
      }
      return true;
    });
    if (orden === 'precio-asc') lista.sort((a, b) => a.precio - b.precio);
    if (orden === 'precio-desc') lista.sort((a, b) => b.precio - a.precio);
    if (orden === 'nombre') lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return lista;
  }, [perfumes, genero, marcaSel, busqueda, orden, nombreMarca]);

  // Carrito con datos reales del catálogo (ignora perfumes que ya no existen)
  const lineas = useMemo(() => {
    const res = [];
    carrito.forEach((c) => {
      const p = perfumes.find((x) => x.id === c.idPerfume);
      if (!p || p.stock <= 0) return;
      const cantidad = Math.min(c.cantidad, p.stock, MAX_POR_PERFUME);
      res.push({
        id: p.id, nombre: p.nombre, marca: nombreMarca[p.idMarca] || '', genero: p.genero, precio: Number(p.precio),
        stock: p.stock, cantidad,
      });
    });
    return res;
  }, [carrito, perfumes, nombreMarca]);

  const total = lineas.reduce((suma, l) => suma + l.precio * l.cantidad, 0);
  const conteo = lineas.reduce((suma, l) => suma + l.cantidad, 0);

  function agregar(perfume, cantidad) {
    const tope = Math.min(perfume.stock, MAX_POR_PERFUME);
    setCarrito((actual) => {
      const existente = actual.find((c) => c.idPerfume === perfume.id);
      if (existente) {
        return actual.map((c) =>
          c.idPerfume === perfume.id ? { ...c, cantidad: Math.min(c.cantidad + cantidad, tope) } : c);
      }
      return [...actual, { idPerfume: perfume.id, cantidad: Math.min(cantidad, tope) }];
    });
    setPanel('carrito');
  }

  function cambiarCantidad(id, cantidad) {
    if (cantidad < 1) return quitar(id);
    setCarrito((actual) => actual.map((c) => (c.idPerfume === id ? { ...c, cantidad } : c)));
  }

  function quitar(id) {
    setCarrito((actual) => actual.filter((c) => c.idPerfume !== id));
  }

  function pedidoListo(pedido, dni, correo) {
    setCarrito([]);
    setPanel('');
    setConfirmado({ pedido, dni, correo });
    cargar(); // refresca el stock
  }

  function irInicio() {
    document.getElementById('nt-inicio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function irPerfumes() {
    document.getElementById('nt-perfumes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function seleccionarGenero(nuevoGenero) {
    setGenero(nuevoGenero);
    if (window.innerWidth > 640) {
      document.getElementById('nt-perfumes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="nt nt-tienda">
      <header className="nt-cabecera nt-noprint">
        <div className="nt-cabecera-fila">
          <a className="nt-logo" href="/" onClick={(e) => e.preventDefault()}>
            Perfumería de <em>Néctar</em>
          </a>
          <button type="button" className="nt-cuenta-top" onClick={() => setPanel('cuenta')}>
            <IconoNav nombre="tu" /><span>Tú</span>
          </button>
          <input
            className="nt-buscador"
            type="search"
            placeholder="Buscar perfume o marca…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar perfume o marca"
          />
          <nav className="nt-nav">
            <button type="button" className="nt-nav-btn" onClick={irInicio}>Inicio</button>
            <button type="button" className="nt-nav-btn" onClick={() => setPanel('seguimiento')}>Seguimiento</button>
            <button type="button" className="nt-nav-btn nt-nav-carrito" onClick={() => setPanel('carrito')} aria-label={`Carrito${conteo > 0 ? `, ${conteo} productos` : ''}`}>
              <IconoNav nombre="carrito" /><span>Carrito</span>
              {conteo > 0 && <span className="nt-contador">{conteo}</span>}
            </button>
          </nav>
        </div>
        <div className="nt-sesion">
          <span>Hola, <strong>{sesion.usuario}</strong></span>
          <button type="button" className="nt-btn-link" onClick={onSalir}>Cerrar sesión</button>
        </div>
      </header>

      <FiltrosCatalogo genero={genero} onSeleccionarGenero={seleccionarGenero}
                       marcas={marcas} marcaSel={marcaSel} onMarca={setMarcaSel}
                       orden={orden} onOrden={setOrden} variante="nt-controles-pc nt-noprint" />

      <section className="nt-hero nt-noprint">
        <p className="nt-etiqueta">Colección de fragancias</p>
        <h1>Encuentra la fragancia que te define</h1>
        <p>Perfumes originales de las mejores casas, con envío a tu puerta.</p>
      </section>

      <section className="nt-inicio-fragancias nt-contenido nt-noprint" id="nt-inicio">
        <GaleriaFragancias />
      </section>

      <main className="nt-contenido nt-noprint" id="nt-perfumes">
        <FiltrosCatalogo genero={genero} onSeleccionarGenero={seleccionarGenero}
                         marcas={marcas} marcaSel={marcaSel} onMarca={setMarcaSel}
                         orden={orden} onOrden={setOrden} variante="nt-controles-movil nt-noprint" />
        {estado === 'cargando' && <p className="nt-estado">Cargando catálogo…</p>}
        {estado === 'error' && (
          <p className="nt-estado nt-error" role="alert">
            {mensaje} <button type="button" className="nt-btn-link" onClick={() => { setEstado('cargando'); cargar(); }}>Reintentar</button>
          </p>
        )}

        {estado === 'ok' && (
          <>
            <p className="nt-cuenta">{visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}</p>
            {visibles.length === 0 ? (
              <p className="nt-estado">No encontramos perfumes con esos filtros.</p>
            ) : (
              <div className="nt-grilla">
                {visibles.map((p) => (
                  <TarjetaPerfume key={p.id} perfume={p} marca={nombreMarca[p.idMarca] || 'Marca'}
                                  onVer={setDetalle} onAgregar={agregar} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="nt-pie nt-noprint">
        <p>© Perfumería de Néctar · Videz, Fredi</p>
      </footer>

      <nav className="nt-nav-inferior nt-noprint" aria-label="Navegación de la tienda">
        <button type="button" onClick={irInicio}>
          <IconoNav nombre="inicio" /><span>Inicio</span>
        </button>
        <button type="button" onClick={irPerfumes}>
          <IconoNav nombre="perfumes" /><span>Perfumes</span>
        </button>
        <button type="button" className="nt-nav-inferior-carrito" onClick={() => setPanel('carrito')}>
          <IconoNav nombre="carrito" /><span>Carrito</span>
          {conteo > 0 && <span className="nt-nav-inferior-contador">{conteo}</span>}
        </button>
      </nav>

      {detalle && (
        <ModalPerfume perfume={detalle} marca={nombreMarca[detalle.idMarca] || 'Marca'}
                      onCerrar={() => setDetalle(null)} onAgregar={agregar} />
      )}
      {panel === 'carrito' && (
        <Carrito lineas={lineas} total={total} onCerrar={() => setPanel('')}
                 onCambiar={cambiarCantidad} onQuitar={quitar} onContinuar={() => setPanel('checkout')} />
      )}
      {panel === 'checkout' && (
        <Checkout lineas={lineas} total={total} onVolver={() => setPanel('carrito')}
                  onCerrar={() => setPanel('')} onListo={pedidoListo} />
      )}
      {panel === 'seguimiento' && <Seguimiento onCerrar={() => setPanel('')} />}
      {panel === 'cuenta' && (
        <div className="nt-overlay nt-cuenta-overlay" onClick={() => setPanel('')}>
          <section className="nt-cuenta-modal" role="dialog" aria-modal="true" aria-label="Tu cuenta"
                   onClick={(e) => e.stopPropagation()}>
            <Cerrar onClick={() => setPanel('')} />
            <p className="nt-etiqueta">Tu cuenta</p>
            <h2>{sesion.usuario}</h2>
            <button type="button" className="nt-btn nt-btn-suave nt-ancho" onClick={() => setPanel('seguimiento')}>
              Seguimiento de pedido
            </button>
            <button type="button" className="nt-btn nt-btn-primario nt-ancho" onClick={onSalir}>
              Cerrar sesión
            </button>
          </section>
        </div>
      )}
      {confirmado && <Confirmacion pedido={confirmado.pedido} dni={confirmado.dni} correo={confirmado.correo}
                                   onCerrar={() => setConfirmado(null)} />}
    </div>
  );
}
