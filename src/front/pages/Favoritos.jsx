import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchConSesion } from "../utils/sesion.mjs";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";
import { ciudades } from "../data/ciudades.mjs";

const formatearFecha = (fecha) => {
	if (!fecha) return "";
	return new Intl.DateTimeFormat("es", {
		day: "numeric",
		month: "short",
		year: "numeric"
	}).format(new Date(fecha)).replace(".", "");
};

const obtenerCiudad = (favorito) => favorito.place?.city || "Otros lugares";

export const Favoritos = () => {
	const navigate = useNavigate();
	const [favoritos, setFavoritos] = useState([]);
	const [ciudadActiva, setCiudadActiva] = useState("");
	const [cargando, setCargando] = useState(true);
	const [eliminando, setEliminando] = useState(null);
	const [confirmando, setConfirmando] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let activa = true;
		const cargarFavoritos = async () => {
			if (!localStorage.getItem("token")) {
				navigate("/login", { replace: true });
				return;
			}

			try {
				const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/favorites`);
				const datos = await respuesta.json().catch(() => ({}));
				if (!respuesta.ok) {
					throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible cargar tus favoritos."));
				}

				const favoritosCargados = Array.isArray(datos) ? datos.filter((favorito) => favorito.place) : [];
				if (!activa) return;
				setFavoritos(favoritosCargados);
				setCiudadActiva(favoritosCargados[0] ? obtenerCiudad(favoritosCargados[0]) : "");
			} catch (err) {
				if (activa) setError(err.message || "No fue posible cargar tus favoritos.");
			} finally {
				if (activa) setCargando(false);
			}
		};

		cargarFavoritos();
		return () => {
			activa = false;
		};
	}, [navigate]);

	const ciudades = useMemo(() => {
		const agrupadas = new Map();
		favoritos.forEach((favorito) => {
			const ciudad = obtenerCiudad(favorito);
			if (!agrupadas.has(ciudad)) agrupadas.set(ciudad, []);
			agrupadas.get(ciudad).push(favorito);
		});
		return [...agrupadas.entries()].map(([nombre, lugares]) => ({ nombre, lugares }));
	}, [favoritos]);

	const favoritosVisibles = ciudades.find((ciudad) => ciudad.nombre === ciudadActiva)?.lugares || [];
	const ciudadSeleccionada = favoritos.find((favorito) => obtenerCiudad(favorito) === ciudadActiva)?.place;

	const eliminarFavorito = async (favorito) => {
		setEliminando(favorito.id);
		setError("");
		try {
			const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/favorites/${favorito.id}`, { method: "DELETE" });
			const datos = await respuesta.json().catch(() => ({}));
			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible quitar este lugar de favoritos."));
			}

			setFavoritos((favoritosActuales) => favoritosActuales.filter((actual) => actual.id !== favorito.id));
			setConfirmando(null);
		} catch (err) {
			setError(err.message || "No fue posible quitar este lugar de favoritos.");
		} finally {
			setEliminando(null);
		}
	};

	if (cargando) {
		return (
			<main className="min-vh-100 d-flex align-items-center" style={{ backgroundColor: "#EAF7FA" }}>
				<div className="container text-center py-5" style={{ color: "#456B75" }}>
					<i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
					Cargando tu atlas...
				</div>
			</main>
		);
	}

	return (
		<main className="min-vh-100 py-4 py-lg-5" style={{ backgroundColor: "#EAF7FA" }}>
			<div className="container-fluid px-3 px-md-4 px-xl-5" style={{ maxWidth: "1440px" }}>
				<header className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-4 mb-4">
					<div>
						<Link to="/explorar" className="small text-decoration-none" style={{ color: "#078A9A" }}>
							<i className="fa-solid fa-arrow-left me-2" aria-hidden="true" />Seguir explorando
						</Link>
						<p className="text-uppercase fw-semibold mt-4 mb-2" style={{ color: "#078A9A", letterSpacing: "0.16em", fontSize: "0.72rem" }}>Tu atlas personal</p>
						<h1 className="display-4 mb-2" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif", fontWeight: 600 }}>Lugares para volver.</h1>
					</div>
					<div className="text-lg-end" style={{ color: "#456B75" }}>
						<span className="d-block display-6" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif", fontWeight: 600 }}>{favoritos.length}</span>
						<span className="small text-uppercase fw-semibold" style={{ letterSpacing: "0.12em" }}>lugares guardados</span>
					</div>
				</header>

				{error && <div className="alert alert-danger rounded-0" role="alert">{error}</div>}

				{favoritos.length === 0 ? (
					<section className="p-4 p-md-5" style={{ backgroundColor: "#12343B", color: "#FFFFFF" }}>
						<p className="text-uppercase small fw-semibold mb-3" style={{ color: "#8CE3ED", letterSpacing: "0.14em" }}>El atlas está esperando</p>
						<h2 className="display-6 mb-3" style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600 }}>Todavía no has guardado ningún lugar.</h2>
						<p className="mb-4" style={{ color: "#BDECF1", maxWidth: "34rem" }}>Explora una ciudad y conserva los lugares que quieras visitar más adelante.</p>
						<Link to="/explorar" className="btn px-4 py-2" style={{ backgroundColor: "#28C3D4", color: "#12343B", borderRadius: 0 }}>Abrir explorar <i className="fa-solid fa-arrow-right ms-2" aria-hidden="true" /></Link>
					</section>
				) : (
					<div className="row g-4 align-items-stretch">
						<aside className="col-12 col-lg-4">
							<div className="h-100 p-4 p-md-5" style={{ backgroundColor: "#12343B", color: "#FFFFFF" }}>
								<p className="text-uppercase small fw-semibold mb-2" style={{ color: "#8CE3ED", letterSpacing: "0.14em" }}>Organiza tu inspiración</p>
								<h2 className="h2 mb-4" style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600 }}>Elige una ciudad</h2>
								<div className="d-flex flex-column" role="tablist" aria-label="Ciudades con favoritos">
									{ciudades.map((ciudad) => {
										const activa = ciudad.nombre === ciudadActiva;
										return (
											<button
												key={ciudad.nombre}
												type="button"
												role="tab"
												aria-selected={activa}
												onClick={() => setCiudadActiva(ciudad.nombre)}
												className="d-flex justify-content-between align-items-center text-start w-100 py-3 px-0"
												style={{ color: activa ? "#FFFFFF" : "#BDECF1", backgroundColor: "transparent", border: 0, borderTop: "1px solid rgba(212, 240, 245, 0.22)" }}
											>
												<span><i className={`fa-solid ${activa ? "fa-location-dot" : "fa-arrow-right"} me-3`} aria-hidden="true" />{ciudad.nombre}</span>
												<span className="small" style={{ color: activa ? "#28C3D4" : "#8CE3ED" }}>{ciudad.lugares.length}</span>
											</button>
										);
									})}
								</div>
							</div>
						</aside>

						<section className="col-12 col-lg-8" aria-labelledby="ciudad-favoritos-titulo">
							<div className="h-100 p-4 p-md-5" style={{ backgroundColor: "#FFFFFF" }}>
								<div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid #DDECEF" }}>
									<div>
										<p className="small text-uppercase fw-semibold mb-2" style={{ color: "#078A9A", letterSpacing: "0.14em" }}>Selección actual</p>
										<h2 id="ciudad-favoritos-titulo" className="display-6 mb-1" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif", fontWeight: 600 }}>{ciudadActiva}</h2>
										<p className="mb-0" style={{ color: "#6B8991" }}>{ciudadSeleccionada?.country || ""} · {favoritosVisibles.length} {favoritosVisibles.length === 1 ? "lugar guardado" : "lugares guardados"}</p>
									</div>
									<Link to="/explorar" className="small text-decoration-none" style={{ color: "#078A9A" }}>Explorar más <i className="fa-solid fa-arrow-right ms-1" aria-hidden="true" /></Link>
								</div>

								<div className="row g-4">
									{favoritosVisibles.map((favorito) => {
										const lugar = favorito.place;
										const imagenCiudad = ciudades.find((ciudad) => ciudad.city === lugar.city)?.image;
										const imagen = lugar.image?.startsWith("http") ? lugar.image : imagenCiudad;
										const estaConfirmando = confirmando === favorito.id;
										return (
											<article key={favorito.id} className="col-12 col-md-6">
												<div className="h-100 d-flex flex-column" style={{ border: "1px solid #DDECEF", backgroundColor: "#FFFFFF" }}>
													{imagen && <img loading="lazy" decoding="async" src={imagen} alt={lugar.name || "Lugar guardado"} className="w-100 d-block object-fit-cover" style={{ height: "10rem" }} />}
													<div className="d-flex flex-column flex-grow-1 p-4">
														<div className="d-flex justify-content-between gap-3 align-items-start">
															<div>
																<p className="small text-uppercase fw-semibold mb-2" style={{ color: "#078A9A", letterSpacing: "0.1em" }}>Lugar guardado</p>
																<h3 className="h4 mb-2" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif" }}>{lugar.name || "Lugar sin nombre"}</h3>
															</div>
															<button type="button" className="btn btn-sm p-0" aria-label={`Quitar ${lugar.name || "este lugar"} de favoritos`} onClick={() => setConfirmando(estaConfirmando ? null : favorito.id)} style={{ color: "#B02A37", border: 0 }}><i className="fa-solid fa-bookmark" aria-hidden="true" /></button>
														</div>
														<p className="small mb-3" style={{ color: "#6B8991" }}><i className="fa-solid fa-location-dot me-2" aria-hidden="true" />{lugar.city}, {lugar.country}</p>
														{lugar.description && <p className="mb-3" style={{ color: "#456B75", lineHeight: 1.6 }}>{lugar.description}</p>}
														{lugar.bestFor && <p className="small mb-3" style={{ color: "#078A9A" }}><strong>Categoría:</strong> {lugar.bestFor}</p>}
														<p className="small mt-auto mb-0" style={{ color: "#91AEB5" }}>Guardado {formatearFecha(favorito.created_at)}</p>
														{estaConfirmando && <div className="mt-3 pt-3 d-flex align-items-center justify-content-between gap-2" style={{ borderTop: "1px solid #DDECEF" }}><span className="small" style={{ color: "#456B75" }}>¿Quitar este lugar?</span><span className="d-flex gap-2"><button type="button" className="btn btn-sm" onClick={() => setConfirmando(null)} disabled={eliminando === favorito.id} style={{ color: "#456B75" }}>No</button><button type="button" className="btn btn-sm" onClick={() => eliminarFavorito(favorito)} disabled={eliminando === favorito.id} style={{ backgroundColor: "#B02A37", color: "#FFFFFF" }}>{eliminando === favorito.id ? "Quitando..." : "Sí, quitar"}</button></span></div>}
													</div>
												</div>
											</article>
										);
									})}
								</div>
							</div>
						</section>
					</div>
				)}
			</div>
		</main>
	);
};
