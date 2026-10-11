import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Icon from "./components/Icon.jsx";
import { Frasco } from "./components/PerfumeImg.jsx";
import Inicio from "./pages/Inicio.jsx";
import EntityPage from "./pages/EntityPage.jsx";
import { ENTIDADES } from "./config.js";

function Bienvenida({ onEntrar }) {
    return (
        <div className="bienvenida">
            <div className="bienvenida-marca">
                <Icon nombre="lotus" size={34} />
                <span>PerfumeStore<small>Fragancias que cuentan historias</small></span>
            </div>
            <div className="bienvenida-frasco"><Frasco nombre="PerfumeStore" /></div>
            <div className="bienvenida-centro">
                <h1>Bienvenido a<br />PerfumeStore</h1>
                <p>Tu fragancia favorita, siempre cerca.</p>
                <button className="btn grande" onClick={onEntrar}>Entrar al panel</button>
            </div>
            <small className="lema">Belleza · Elegancia · Estilo</small>
        </div>
    );
}

function App() {
    const [dentro, setDentro] = useState(false);
    const [seccion, setSeccion] = useState("inicio");

    if (!dentro) return <Bienvenida onEntrar={() => setDentro(true)} />;

    const titulo = seccion === "inicio" ? "Inicio" : ENTIDADES[seccion].titulo;

    return (
        <div className="app">
            <Sidebar seccion={seccion} onCambiar={setSeccion} onSalir={() => setDentro(false)} />
            <main>
                <header className="topbar-m">
                    <Icon nombre="lotus" size={24} />
                    <strong>{titulo}</strong>
                </header>
                {seccion === "inicio" ? <Inicio key="inicio" /> : <EntityPage key={seccion} clave={seccion} />}
            </main>
            <BottomNav seccion={seccion} onCambiar={setSeccion} onSalir={() => setDentro(false)} />
        </div>
    );
}

export default App;
