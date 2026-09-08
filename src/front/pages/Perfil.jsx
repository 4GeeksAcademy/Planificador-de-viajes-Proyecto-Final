import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cerrarSesion, obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";
import { fetchConSesion } from "../utils/sesion.mjs";
import { useEntradaPagina } from "../animaciones/useEntradaPagina";

const obtenerUsuarioGuardado = () => {
	try {
		return JSON.parse(localStorage.getItem("user") || "null") || {};
	} catch {
		return {};
	}
};

const formatearFecha = (fecha) => {
	if (!fecha) return "Fecha pendiente";
	return new Intl.DateTimeFormat("es", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(`${fecha}T00:00:00`)).replace(".", "");
};

const obtenerFechaLocal = () => {
	const hoy = new Date();
	const anio = hoy.getFullYear();
	const mes = String(hoy.getMonth() + 1).padStart(2, "0");
	const dia = String(hoy.getDate()).padStart(2, "0");
	return `${anio}-${mes}-${dia}`;
};

const obtenerEstadoViajes = (viajes) => {
	if (!viajes.length) return "Listo para explorar";

	const hoy = obtenerFechaLocal();
	const hayViajeEnCurso = viajes.some((viaje) => (
		viaje.start_date && viaje.end_date && viaje.start_date <= hoy && hoy <= viaje.end_date
	));
	if (hayViajeEnCurso) return "Viajes en curso";

	const hayViajeFuturo = viajes.some((viaje) => viaje.start_date && viaje.start_date > hoy);
	if (hayViajeFuturo) return "En planificación";

	return "Sin viajes próximos";
};

const cargarActividad = async (token) => {
	const encabezados = { Authorization: `Bearer ${token}` };
	const respuestas = await Promise.allSettled([
		fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/trips`, { headers: encabezados }),
		fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/favorites`, { headers: encabezados }),
	]);
	const actividad = { viajes: [], favoritos: [], error: "" };

	for (const [indice, resultado] of respuestas.entries()) {
		if (resultado.status === "rejected") {
			actividad.error = "No fue posible cargar toda la actividad.";
			continue;
		}

		const respuesta = resultado.value;
		let datos = {};
		try {
			datos = await respuesta.json();
		} catch {
			actividad.error = "El servidor devolvió una respuesta inválida.";
			continue;
		}

		if (!respuesta.ok) {
			actividad.error = obtenerMensajeErrorBackend(datos, "No fue posible cargar la actividad.");
			continue;
		}

		if (indice === 0) actividad.viajes = Array.isArray(datos) ? datos : [];
		if (indice === 1) actividad.favoritos = Array.isArray(datos) ? datos : [];
	}

	return actividad;
};

export const Perfil = () => {
	const paginaRef = useRef(null);
	useEntradaPagina(paginaRef);
	const navigate = useNavigate();
	const usuario = useMemo(obtenerUsuarioGuardado, []);
	const [actividad, setActividad] = useState({ viajes: [], favoritos: [], error: "" });
	const [cargando, setCargando] = useState(true);
	const nombre = [usuario.first_name, usuario.last_name].filter(Boolean).join(" ") || usuario.username || "Viajero";

	useEffect(() => {
		let activa = true;
		const token = localStorage.getItem("token");

		if (!token) {
			setCargando(false);
			return undefined;
		}

		cargarActividad(token).then((datos) => {
			if (activa) setActividad(datos);
		}).finally(() => {
			if (activa) setCargando(false);
		});

		return () => {
			activa = false;
		};
	}, []);

	const manejarCierreSesion = () => {
		cerrarSesion(localStorage);
		window.dispatchEvent(new Event("sesion-cambiada"));
		navigate("/");
	};

	return (
		<main ref={paginaRef} className="min-vh-100 py-4 py-lg-5 pagina-animada" style={{ backgroundColor: "#EAF7FA" }}>
			<div className="container-fluid px-3 px-md-4 px-xl-5" style={{ maxWidth: "1440px" }}>
				<div className="row g-0 shadow-sm">
					{/* Navegación e identidad */}
					<aside className="col-12 col-lg-4 d-flex flex-column p-4 p-md-5 perfil-identidad" style={{ backgroundColor: "#12343B", color: "#FFFFFF", minHeight: "620px" }}>
						<div>
							<Link to="/" className="d-inline-flex align-items-center text-decoration-none small" style={{ color: "#8CE3ED" }}>
								<i className="fa-solid fa-arrow-left me-2" aria-hidden="true" />Volver al inicio
							</Link>
						</div>

						<div className="mt-5 mt-lg-auto mb-lg-5">
							<p className="mb-3 text-uppercase fw-semibold" style={{ color: "#28C3D4", letterSpacing: "0.16em", fontSize: "0.72rem" }}>Perfil de viajero</p>
							<h1 className="mb-3" style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(2.8rem, 6vw, 5rem)", lineHeight: 0.98, fontWeight: 600 }}>{nombre}</h1>
							<p className="mb-0 text-break" style={{ color: "#BDECF1" }}>{usuario.email || "Sin correo registrado"}</p>
						</div>

						<nav aria-label="Navegación del perfil" className="mt-lg-auto">
							<Link to="/perfil/configuracion" className="d-flex justify-content-between align-items-center text-decoration-none py-3" style={{ color: "#BDECF1", borderTop: "1px solid rgba(212, 240, 245, 0.28)" }}>
								<span>Editar datos</span><i className="fa-solid fa-pen" aria-hidden="true" />
							</Link>
							<button type="button" onClick={manejarCierreSesion} className="d-flex justify-content-between align-items-center w-100 text-start py-3 px-0" style={{ color: "#BDECF1", backgroundColor: "transparent", border: 0, borderTop: "1px solid rgba(212, 240, 245, 0.28)" }}>
								<span>Cerrar sesión</span><i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
							</button>
						</nav>
					</aside>

					{/* Área principal */}
					<section className="col-12 col-lg-8 p-4 p-md-5" style={{ backgroundColor: "#FFFFFF" }}>
						<header className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-3 pb-4" style={{ borderBottom: "1px solid #DDECEF" }}>
							<div>
								<h2 className="mb-0" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 600 }}>Tu recorrido</h2>
							</div>
							<Link to="/trips/new" className="btn px-3 py-2" style={{ backgroundColor: "#28C3D4", color: "#12343B", borderRadius: 0 }}><i className="fa-solid fa-plus me-2" aria-hidden="true" />Nuevo viaje</Link>
						</header>

						{actividad.error && <div className="alert rounded-0 mt-4 mb-0" role="alert" style={{ backgroundColor: "#FFF4E5", border: "1px solid #F0C36D", color: "#6B4B16" }}>{actividad.error}</div>}

						{/* Indicadores */}
						<div className="row g-0 py-4" style={{ borderBottom: "1px solid #DDECEF" }}>
							<div className="col-6 col-md-4 pe-3"><span className="d-block small text-uppercase fw-semibold mb-2" style={{ color: "#6B8991", letterSpacing: "0.08em" }}>Viajes</span><strong className="d-block" style={{ color: "#12343B", fontSize: "3.2rem", lineHeight: 1 }}>{cargando ? "—" : actividad.viajes.length}</strong></div>
							<div className="col-6 col-md-4 ps-3 border-start"><span className="d-block small text-uppercase fw-semibold mb-2" style={{ color: "#6B8991", letterSpacing: "0.08em" }}>Favoritos</span><strong className="d-block" style={{ color: "#12343B", fontSize: "3.2rem", lineHeight: 1 }}>{cargando ? "—" : actividad.favoritos.length}</strong></div>
							<div className="d-none d-md-block col-md-4 ps-4 border-start"><span className="d-block small text-uppercase fw-semibold mb-2" style={{ color: "#6B8991", letterSpacing: "0.08em" }}>Estado</span><strong className="d-block" style={{ color: "#078A9A", fontSize: "1.1rem", lineHeight: 1, marginTop: "1.45rem" }}>{cargando ? "—" : obtenerEstadoViajes(actividad.viajes)}</strong></div>
						</div>

						{/* Lista editorial de viajes */}
						<div className="pt-4">
							<div className="d-flex justify-content-between align-items-center mb-3"><h3 className="h5 mb-0" style={{ color: "#12343B", fontWeight: 600 }}>Últimos viajes</h3><Link to="/trips" className="small text-decoration-none" style={{ color: "#078A9A" }}>Ver todos</Link></div>
							{cargando ? <p className="py-4 mb-0" style={{ color: "#6B8991" }}>Cargando tus viajes...</p> : actividad.viajes.length === 0 ? (
								<div className="py-4" style={{ borderTop: "1px solid #DDECEF" }}><p className="mb-3" style={{ color: "#6B8991" }}>Todavía no hay un viaje en tu recorrido.</p><Link to="/trips/new" className="text-decoration-none fw-semibold" style={{ color: "#078A9A" }}>Crear el primero <i className="fa-solid fa-arrow-right ms-1" aria-hidden="true" /></Link></div>
							) : (
								<ul className="list-unstyled mb-0">{actividad.viajes.slice(0, 5).map((viaje, indice) => <li key={viaje.id} className="row align-items-center g-2 py-3" style={{ borderTop: "1px solid #DDECEF" }}><div className="col-auto"><span className="d-flex align-items-center justify-content-center" style={{ width: "2rem", height: "2rem", backgroundColor: indice === 0 ? "#28C3D4" : "#EAF7FA", color: "#12343B", fontWeight: 600 }}>{String(indice + 1).padStart(2, "0")}</span></div><div className="col min-w-0"><strong className="d-block text-truncate" style={{ color: "#12343B" }}>{viaje.name}</strong><small style={{ color: "#6B8991" }}>{formatearFecha(viaje.start_date)} · {formatearFecha(viaje.end_date)}</small></div><div className="col-auto"><Link to={`/trips/${viaje.id}`} className="text-decoration-none" aria-label={`Abrir ${viaje.name}`} style={{ color: "#078A9A" }}><i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></Link></div></li>)}</ul>
							)}
						</div>

						{/* Acción secundaria */}
						<div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mt-4 pt-4" style={{ borderTop: "1px solid #DDECEF" }}><div><strong className="d-block" style={{ color: "#12343B" }}>¿Buscas una nueva idea?</strong><span className="small" style={{ color: "#6B8991" }}>Explora ciudades y guarda lugares para después.</span></div><Link to="/explorar" className="btn btn-sm px-3 py-2" style={{ backgroundColor: "#D4F0F5", color: "#12343B", borderRadius: 0 }}>Explorar ciudades</Link></div>
					</section>
				</div>
			</div>
		</main>
	);
};
