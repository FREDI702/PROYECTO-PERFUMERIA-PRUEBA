import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Icon from "./components/Icon.jsx";
import Inicio from "./pages/Inicio.jsx";
import EntityPage from "./pages/EntityPage.jsx";
import Tienda from "./tienda/Tienda.jsx";
import { ENTIDADES } from "./config.js";
import { api } from "./api.js";

function Acceso({ onIniciar, onCrearCuenta, errorInicial = "" }) {
    const [modo, setModo] = useState(errorInicial ? "entrar" : "opciones");
    const [usuario, setUsuario] = useState("");
    const [correo, setCorreo] = useState("");
    const [clave, setClave] = useState("");
    const [confirmarClave, setConfirmarClave] = useState("");
    const [claveVisible, setClaveVisible] = useState(false);
    const [confirmarClaveVisible, setConfirmarClaveVisible] = useState(false);
    const [error, setError] = useState(errorInicial);
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);

    const seleccionarModo = (nuevoModo) => {
        setModo(nuevoModo);
        setError("");
        setMensaje("");
        setClave("");
        setConfirmarClave("");
        setClaveVisible(false);
        setConfirmarClaveVisible(false);
    };

    const enviar = async (evento) => {
        evento.preventDefault();
        setCargando(true);
        setError("");
        setMensaje("");
        try {
            if (modo === "registro") {
                if (clave !== confirmarClave) {
                    setError("Las contraseñas no coinciden.");
                    return;
                }
                const cuenta = await onCrearCuenta(usuario, correo, clave, confirmarClave);
                setUsuario(cuenta.usuario);
                setClave("");
                setConfirmarClave("");
                setCorreo("");
                setModo("entrar");
                setMensaje("Cuenta creada como usuario de solo lectura. Ya puedes iniciar sesión.");
            } else {
                await onIniciar(usuario, clave);
            }
        } catch (fallo) {
            setError(fallo.status === 401
                ? "Usuario o contraseña incorrectos."
                : fallo.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="bienvenida">
            <div className="bienvenida-marca">
                <Icon nombre="lotus" size={34} />
                <span>Perfumería Néctar<small>Fragancias que cuentan historias</small></span>
            </div>
            <div className="bienvenida-frasco">
                <img src="/perfumeria-nectar.png" alt="Perfume Néctar Olefactif" />
            </div>
            <form className="bienvenida-centro acceso-form" onSubmit={enviar}>
                <span className="acceso-etiqueta">ACCESO SEGURO</span>
                {modo === "opciones" ? (
                    <>
                        <h1>Bienvenido a<br />Perfumería Néctar</h1>
                        <p>Elige cómo deseas continuar.</p>
                        <button className="btn grande acceso-iniciar" type="button" onClick={() => seleccionarModo("entrar")}>
                            Iniciar sesión
                        </button>
                        <button className="btn grande acceso-registro" type="button" onClick={() => seleccionarModo("registro")}>
                            Crear cuenta
                        </button>
                        <small className="acceso-ayuda">
                            Clientes: compran y consultan pedidos · Administrador: gestiona la tienda
                        </small>
                    </>
                ) : (
                    <>
                        <h1>{modo === "registro" ? "Crear cuenta" : "Iniciar sesión"}</h1>
                        <p>{modo === "registro"
                            ? "Crea tu cuenta para comprar y consultar tus pedidos."
                            : "Ingresa con tu cuenta. Los permisos se asignan según tu rol."}</p>
                        <label>
                            {modo === "registro" ? "Usuario" : "Usuario o correo electrónico"}
                            <input
                                autoComplete="username"
                                value={usuario}
                                minLength={modo === "registro" ? 3 : undefined}
                                maxLength={modo === "registro" ? 32 : 254}
                                pattern={modo === "registro" ? "[A-Za-z0-9._\\-]{3,32}" : undefined}
                                title={modo === "registro"
                                    ? "Usa de 3 a 32 letras, números, puntos, guiones o guiones bajos."
                                    : undefined}
                                onChange={(evento) => setUsuario(evento.target.value)}
                                required
                            />
                        </label>
                        {modo === "registro" && (
                            <label>
                                Correo electrónico
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={correo}
                                    maxLength={254}
                                    onChange={(evento) => setCorreo(evento.target.value)}
                                    required
                                />
                            </label>
                        )}
                        <label>
                            Contraseña
                            <span className="acceso-password-campo">
                                <input
                                    type={claveVisible ? "text" : "password"}
                                    autoComplete={modo === "registro" ? "new-password" : "current-password"}
                                    value={clave}
                                    minLength={modo === "registro" ? 12 : undefined}
                                    maxLength={72}
                                    onChange={(evento) => setClave(evento.target.value)}
                                    required
                                />
                                <button
                                    className="acceso-password-ver"
                                    type="button"
                                    aria-label={claveVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    aria-pressed={claveVisible}
                                    onClick={() => setClaveVisible(!claveVisible)}
                                >
                                    <Icon nombre={claveVisible ? "eyeOff" : "eye"} size={19} />
                                </button>
                            </span>
                        </label>
                        {modo === "registro" && (
                            <label>
                                Confirmar contraseña
                                <span className="acceso-password-campo">
                                    <input
                                        type={confirmarClaveVisible ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={confirmarClave}
                                        minLength={12}
                                        maxLength={72}
                                        onPaste={(evento) => evento.preventDefault()}
                                        onChange={(evento) => setConfirmarClave(evento.target.value)}
                                        required
                                    />
                                    <button
                                        className="acceso-password-ver"
                                        type="button"
                                        aria-label={confirmarClaveVisible ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                                        aria-pressed={confirmarClaveVisible}
                                        onClick={() => setConfirmarClaveVisible(!confirmarClaveVisible)}
                                    >
                                        <Icon nombre={confirmarClaveVisible ? "eyeOff" : "eye"} size={19} />
                                    </button>
                                </span>
                            </label>
                        )}
                        {error && <p className="acceso-error" role="alert">{error}</p>}
                        <button className="btn grande" type="submit" disabled={cargando}>
                            {cargando
                                ? (modo === "registro" ? "Creando cuenta..." : "Verificando...")
                                : (modo === "registro" ? "Crear cuenta" : "Iniciar sesión")}
                        </button>
                        {mensaje && <p className="acceso-exito" role="status">{mensaje}</p>}
                        <button className="acceso-cambiar" type="button" onClick={() => seleccionarModo("opciones")}>
                            Volver a opciones
                        </button>
                    </>
                )}
            </form>
            <small className="lema">Belleza · Elegancia · Estilo</small>
        </div>
    );
}

function App() {
    const [sesion, setSesion] = useState(null);
    const [comprobandoSesion, setComprobandoSesion] = useState(true);
    const [errorSesion, setErrorSesion] = useState("");
    const [seccion, setSeccion] = useState("inicio");

    useEffect(() => {
        let activa = true;
        api.restaurarSesion()
            .then((sesionRestaurada) => {
                if (activa) setSesion(sesionRestaurada);
            })
            .catch((error) => {
                if (activa) setErrorSesion(error.message);
            })
            .finally(() => {
                if (activa) setComprobandoSesion(false);
            });
        return () => { activa = false; };
    }, []);

    const iniciarSesion = async (usuario, clave) => {
        const nuevaSesion = await api.iniciarSesion(usuario, clave);
        setErrorSesion("");
        setSeccion("inicio");
        setSesion(nuevaSesion);
    };

    const cerrarSesion = () => {
        api.cerrarSesion();
        setSesion(null);
        setSeccion("inicio");
    };

    if (comprobandoSesion) {
        return <div className="acceso-cargando"><Icon nombre="lotus" size={30} /><span>Verificando acceso...</span></div>;
    }
    if (!sesion) {
        return (
            <Acceso
                onIniciar={iniciarSesion}
                onCrearCuenta={api.crearCuenta}
                errorInicial={errorSesion}
            />
        );
    }

    if (sesion.rol !== "ADMIN") {
        return <Tienda sesion={sesion} onSalir={cerrarSesion} />;
    }

    const titulo = seccion === "inicio" ? "Inicio" : ENTIDADES[seccion].titulo;

    return (
        <div className="app">
            <Sidebar
                seccion={seccion}
                onCambiar={setSeccion}
                onSalir={cerrarSesion}
                usuario={sesion.usuario}
                rol={sesion.rol}
            />
            <main>
                <header className="topbar-m">
                    <Icon nombre="lotus" size={24} />
                    <strong>{titulo}</strong>
                    <span className="rol-m">Administrador</span>
                </header>
                {seccion === "inicio"
                    ? <Inicio key="inicio" />
                    : <EntityPage key={seccion} clave={seccion} rol={sesion.rol} />}
            </main>
            <BottomNav seccion={seccion} onCambiar={setSeccion} onSalir={cerrarSesion} />
        </div>
    );
}

export default App;
