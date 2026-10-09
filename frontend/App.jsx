import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import ClientesPage from "./pages/ClientesPage.jsx";
import MarcasPage from "./pages/MarcasPage.jsx";
import PerfumesPage from "./pages/PerfumesPage.jsx";
import VentasPage from "./pages/VentasPage.jsx";
import DetallesVentaPage from "./pages/DetallesVentaPage.jsx";
import PedidosEnvioPage from "./pages/PedidosEnvioPage.jsx";
import RecepcionesPage from "./pages/RecepcionesPage.jsx";

const PAGINAS = {
    clientes: <ClientesPage />,
    marcas: <MarcasPage />,
    perfumes: <PerfumesPage />,
    ventas: <VentasPage />,
    detalles: <DetallesVentaPage />,
    pedidos: <PedidosEnvioPage />,
    recepciones: <RecepcionesPage />,
};

function App() {
    const [seccion, setSeccion] = useState("clientes");

    return (
        <>
            <Navbar seccion={seccion} onCambiar={setSeccion} />
            {PAGINAS[seccion]}
        </>
    );
}

export default App;
