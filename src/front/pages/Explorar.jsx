import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CargadorMapa } from "../animaciones/CargadorMapa";
import { MapaCiudad } from "../components/MapaCiudad";
import { TarjetaCiudad } from "../components/TarjetaCiudad";
import { ciudades, LUGAR_ESTILOS } from "../data/ciudades.mjs";
import "../explorar.css";

const estiloTitulo = {
	color: "#12343B",
	fontFamily: "Fraunces, Georgia, serif",
	fontWeight: 600,
};

const GRUPOS_CONSULTA = [
	"turismo_cultura",
	"comida",
	"vida_nocturna",
	"alojamiento",
	"paseos",
];
const ESPERAS_REINTENTO_MS = [1500];
const ESPERA_ENTRE_GRUPOS_MS = 500;

const esperar = (milisegundos) => new Promise((resolve) => window.setTimeout(resolve, milisegundos));

const esErrorTransitorio = (error) => !error.status || [429, 502, 503, 504].includes(error.status);

const obtenerMensajeError = (datos, fallback) => datos?.msg || datos?.error || fallback;

const consultarGrupo = async (ciudad, grupo) => {
	const parametros = new URLSearchParams({
		lat: ciudad.latitude,
		lon: ciudad.longitude,
		grupo,
	});
	const respuesta = await fetch(
		`${import.meta.env.VITE_BACKEND_URL}/api/explorar/lugares?${parametros}`,
	);

	if (!respuesta.ok) {
		const datosError = await respuesta.json().catch(() => null);
		const error = new Error(
			obtenerMensajeError(
				datosError,
				"No pudimos cargar los lugares en este momento. Intenta nuevamente más tarde.",
			),
		);
		error.status = respuesta.status;
		throw error;
	}

	const datos = await respuesta.json();
	return (datos.places || []).map((lugar) => ({
		...lugar,
		style: LUGAR_ESTILOS[lugar.category] || LUGAR_ESTILOS.attraction,
	}));
};

const consultarGrupoConReintentos = async (ciudad, grupo) => {
	for (let intento = 0; intento <= ESPERAS_REINTENTO_MS.length; intento += 1) {
		try {
			return await consultarGrupo(ciudad, grupo);
		} catch (error) {
			const quedanReintentos = intento < ESPERAS_REINTENTO_MS.length;
			if (!quedanReintentos || !esErrorTransitorio(error)) {
				// eslint-disable-next-line no-console -- Diagnóstico solicitado para fallos definitivos de Overpass.
				console.log("Overpass: grupo no cargado tras los reintentos.", {
					ciudad: ciudad.city,
					grupo,
					error: error.message,
				});
				throw error;
			}

			await esperar(ESPERAS_REINTENTO_MS[intento]);
		}
	}

	return [];
};

const unirLugares = (lugaresActuales, lugaresNuevos) => {
	const lugaresPorId = new Map(
		[...lugaresActuales, ...lugaresNuevos].map((lugar) => [lugar.id, lugar]),
	);

	return [...lugaresPorId.values()];
};

export const Explorar = () => {
	const [ciudadSeleccionada, setCiudadSeleccionada] = useState(null);
	const [lugares, setLugares] = useState([]);
	const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
	const [estado, setEstado] = useState("idle");
	const [error, setError] = useState("");
	const [respuestaCorrectaRecibida, setRespuestaCorrectaRecibida] = useState(false);

	useEffect(() => {
		if (!ciudadSeleccionada) return undefined;
		let activa = true;
		setEstado("loading");
		setError("");
		setLugares([]);
		setLugarSeleccionado(null);
		setRespuestaCorrectaRecibida(false);

		const consultas = GRUPOS_CONSULTA.map((grupo, indice) => (
			esperar(indice * ESPERA_ENTRE_GRUPOS_MS)
				.then(() => {
					if (!activa) return [];

					return consultarGrupoConReintentos(ciudadSeleccionada, grupo);
				})
				.then((lugaresDelGrupo) => {
					if (!activa) return lugaresDelGrupo;

					setRespuestaCorrectaRecibida(true);
					setEstado("success");
					setLugares((lugaresActuales) => unirLugares(lugaresActuales, lugaresDelGrupo));

					return lugaresDelGrupo;
				})
		),
		);

		Promise.allSettled(consultas)
			.then((resultados) => {
				if (!activa) return;
				const respuestasCorrectas = resultados
					.filter((resultado) => resultado.status === "fulfilled")
					.flatMap((resultado) => resultado.value);
				const primerError = resultados.find((resultado) => resultado.status === "rejected")?.reason;

				if (respuestasCorrectas.length) return;

				if (primerError) {
					setError(primerError.message || "No pudimos cargar los lugares en este momento. Intenta nuevamente más tarde.");
					setEstado("error");
					return;
				}

				setEstado("empty");
			});

		return () => { activa = false; };
	}, [ciudadSeleccionada]);

	const lugaresConSeleccion = lugares;
	const mostrarCargador = (
		estado === "loading"
		&& !respuestaCorrectaRecibida
		&& lugares.length === 0
	);

	return (
		<main className="explorar-page" style={{ backgroundColor: "#EAF7FA" }}>
			<section className="explorar-panel container-xl py-4 py-lg-5">
				<div className="row g-4 align-items-start">
					<aside className="col-lg-6 explorar-ciudades-panel">
						<div className="explorar-ciudades-cabecera">
							<Link
								className="explorar-volver-inicio text-decoration-none small"
								style={{ color: "#078A9A" }}
								to="/"
								aria-label="Volver al inicio"
							>
								←
							</Link>
							<h1 className="display-5 mb-0" style={estiloTitulo}>Explora ciudades</h1>
						</div>
						<div className="explorar-ciudades-list px-3 pb-3" aria-label="Ciudades disponibles">
								{ciudades.map((ciudad) => (
								<TarjetaCiudad
									ciudad={ciudad}
									key={ciudad.slug}
									onSeleccionar={setCiudadSeleccionada}
									seleccionada={ciudadSeleccionada?.slug === ciudad.slug}
								/>
								))}
							</div>
					</aside>

					<section className="col-lg-6 explorar-mapa-panel">
						<div className="explorar-mapa-wrapper">
							<MapaCiudad
								altura="620px"
								ciudad={ciudadSeleccionada}
								lugares={lugaresConSeleccion}
								lugarSeleccionado={lugarSeleccionado}
								onLugarClick={setLugarSeleccionado}
							/>
							{mostrarCargador && <CargadorMapa />}
							{lugarSeleccionado && (
								<article className="explorar-lugar-detalle" aria-live="polite">
									<div><p className="small text-uppercase fw-semibold mb-1" style={{ color: lugarSeleccionado.style.color, letterSpacing: "0.1em" }}>{lugarSeleccionado.style.label}</p><h3 className="h4 mb-2" style={estiloTitulo}>{lugarSeleccionado.name}</h3><p className="mb-0" style={{ color: "#456B75" }}>{lugarSeleccionado.address}</p></div>
									<button className="btn-close" aria-label="Cerrar información del lugar" onClick={() => setLugarSeleccionado(null)} type="button" />
								</article>
							)}
						</div>
						<div className="visually-hidden" aria-live="polite">
							{estado === "loading" && <p role="status">Cargando lugares de la ciudad...</p>}
							{estado === "error" && <p role="alert">{error}</p>}
							{estado === "empty" && <p role="status">No encontramos lugares con nombre y coordenadas.</p>}
							{estado === "success" && <p>{lugares.length} lugares mostrados.</p>}
						</div>
					</section>
				</div>
			</section>
		</main>
	);
};
