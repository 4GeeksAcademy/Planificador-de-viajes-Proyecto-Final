import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { RecuperarContr } from "./pages/RecuperarContr";
import { CrearViaje } from "./pages/CrearViaje";
import { DetalleViaje } from "./pages/DetalleViaje";
import { MisViajes } from "./pages/MisViajes";
import { RutaProtegida } from "./components/RutaProtegida";
import { Explorar } from "./pages/Explorar";
import { Ciudad } from "./pages/Ciudad";

export const router = createBrowserRouter(
  createRoutesFromElements(
    // Definir la raíz del proyecto inyectando el diseño base global de la aplicación
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
      {/* Habilitar la ruta raíz para cargar la pantalla de bienvenida */}
      <Route path="/" element={<Home />} />
      <Route path="/explorar" element={<Explorar />} />
      <Route path="/explorar/:citySlug" element={<Ciudad />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recuperacion" element={<RecuperarContr />} />

      {/* Anidar rutas bajo el validador de sesiones privadas obligatorias */}
      <Route element={<RutaProtegida />}>
        {/* Cargar el formulario para dar de alta nuevas aventuras */}
        <Route path="/trips/new" element={<CrearViaje />} />

        {/* Desplegar la lista con la totalidad de itinerarios del usuario */}
        <Route path="/trips" element={<MisViajes />} />

        {/* Resolver la coincidencia exacta de redirección tras crear el viaje */}
        <Route path="/trips/:tripId" element={<DetalleViaje />} />
      </Route>
    </Route>,
  ),
);
