import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { RutaProtegida } from "./components/RutaProtegida";
import { RutaAdmin } from "./components/RutaAdmin";

const lazyPage = (loader, exportName) =>
  lazy(() => loader().then((module) => ({ default: module[exportName] })));

const Home = lazyPage(() => import("./pages/Home"), "Home");
const Login = lazyPage(() => import("./pages/Login"), "Login");
const Register = lazyPage(() => import("./pages/Register"), "Register");
const RecuperarContr = lazyPage(
  () => import("./pages/RecuperarContr"),
  "RecuperarContr",
);
const RestablecerContrasena = lazyPage(
  () => import("./pages/RestablecerContrasena"),
  "RestablecerContrasena",
);
const VerificarEmail = lazyPage(
  () => import("./pages/VerificarEmail"),
  "VerificarEmail",
);
const CrearViaje = lazyPage(() => import("./pages/CrearViaje"), "CrearViaje");
const DetalleViaje = lazyPage(
  () => import("./pages/DetalleViaje"),
  "DetalleViaje",
);
const MisViajes = lazyPage(() => import("./pages/MisViajes"), "MisViajes");
const Explorar = lazyPage(() => import("./pages/Explorar"), "Explorar");
const Ciudad = lazyPage(() => import("./pages/Ciudad"), "Ciudad");
const Perfil = lazyPage(() => import("./pages/Perfil"), "Perfil");
const ConfiguracionPerfil = lazyPage(
  () => import("./pages/ConfiguracionPerfil"),
  "ConfiguracionPerfil",
);
const PlanificadorViaje = lazyPage(
  () => import("./pages/PlanificadorViaje"),
  "PlanificadorViaje",
);
const Admin = lazyPage(() => import("./pages/Admin"), "Admin");
const Favoritos = lazyPage(() => import("./pages/Favoritos"), "Favoritos");

export const router = createBrowserRouter(
  createRoutesFromElements(
    // Definir la raíz del proyecto inyectando el diseño base global de la aplicación
    <Route
      path="/"
      element={
        <Suspense fallback={<div className="container py-5">Cargando...</div>}>
          <Layout />
        </Suspense>
      }
      errorElement={<h1>Not found!</h1>}
    >
      {/* Habilitar la ruta raíz para cargar la pantalla de bienvenida */}
      <Route path="/" element={<Home />} />
      <Route path="/explorar" element={<Explorar />} />
      <Route path="/explorar/:citySlug" element={<Ciudad />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recuperacion" element={<RecuperarContr />} />
      <Route path="/reset-password/:token" element={<RestablecerContrasena />} />
      <Route path="/verificar/:token" element={<VerificarEmail />} />

      {/* Anidar rutas bajo el validador de sesiones privadas obligatorias */}
      <Route element={<RutaProtegida />}>
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil/configuracion" element={<ConfiguracionPerfil />} />

        {/* Cargar el formulario para dar de alta nuevas aventuras */}
        <Route path="/favoritos" element={<Favoritos />} />
        <Route path="/trips/new" element={<CrearViaje />} />

        {/* Desplegar la lista con la totalidad de itinerarios del usuario */}
        <Route path="/trips" element={<MisViajes />} />

        {/* Abrir el workspace para construir el itinerario del viaje */}
        <Route path="/trips/:tripId/planificar" element={<PlanificadorViaje />} />

        {/* Resolver la coincidencia exacta de redirección tras crear el viaje */}
        <Route path="/trips/:tripId" element={<DetalleViaje />} />

        <Route element={<RutaAdmin />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
    </Route>,
  ),
);
