import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CargadorMapa } from "../animaciones/CargadorMapa";
import { useEntradaPagina } from "../animaciones/useEntradaPagina";
import { MapaCiudad } from "../components/MapaCiudad";
import { BotonFavoritoLugar } from "../components/BotonFavoritoLugar";
import { LUGAR_ESTILOS, obtenerCiudad } from "../data/ciudades.mjs";

const gruposConsulta = ["turismo_cultura", "comida", "vida_nocturna", "alojamiento", "paseos"];
const gruposPorCategoria = {
	cultura: "turismo_cultura",
	comida: "comida",
	paseos: "paseos",
	noche: "vida_nocturna",
	alojamiento: "alojamiento"
};
const ESPERAS_REINTENTO_MS = [1500];
const ESPERA_ENTRE_GRUPOS_MS = 500;
const DISTANCIA_CENTROS_CONSULTA_KM = 5;
const categoriasExploracion = [
	{ clave: "todos", etiqueta: "Todo", icono: "fa-compass" },
	{ clave: "cultura", etiqueta: "Cultura", icono: "fa-landmark", categorias: ["attraction", "museum", "viewpoint", "monument", "gallery"] },
	{ clave: "comida", etiqueta: "Comer", icono: "fa-utensils", categorias: ["restaurant", "cafe", "fast_food"] },
	{ clave: "paseos", etiqueta: "Pasear", icono: "fa-person-walking", categorias: ["park", "pier", "marina", "pedestrian"] },
	{ clave: "noche", etiqueta: "Noche", icono: "fa-martini-glass", categorias: ["bar", "pub", "nightclub"] },
	{ clave: "alojamiento", etiqueta: "Dormir", icono: "fa-bed", categorias: ["hotel", "hostel", "guest_house"] }
];

const coordenadasValidas = (lugar) => Number.isFinite(lugar.latitude) && Number.isFinite(lugar.longitude) && lugar.latitude >= -90 && lugar.latitude <= 90 && lugar.longitude >= -180 && lugar.longitude <= 180;
const esperar = (milisegundos) => new Promise((resolve) => window.setTimeout(resolve, milisegundos));
const esErrorTransitorio = (error) => !error.status || [429, 502, 503, 504].includes(error.status);
const unirLugares = (lugaresActuales, lugaresNuevos) => [...new Map([...lugaresActuales, ...lugaresNuevos].map((lugar) => [lugar.id, lugar])).values()];

const obtenerPuntosConsulta = (ciudad) => {
	const latitudEnRadianes = (ciudad.latitude * Math.PI) / 180;
	const gradosPorKilometro = 1 / (111.32 * Math.cos(latitudEnRadianes));
	const desplazamiento = DISTANCIA_CENTROS_CONSULTA_KM * gradosPorKilometro;
	return [
		{ lado: "oeste", latitude: ciudad.latitude, longitude: ciudad.longitude - desplazamiento },
		{ lado: "este", latitude: ciudad.latitude, longitude: ciudad.longitude + desplazamiento }
	];
};

const consultarDireccion = async (lugar) => {
	const parametros = new URLSearchParams({ lat: lugar.latitude, lon: lugar.longitude });
	const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/explorar/direccion?${parametros}`);
	const datos = await respuesta.json().catch(() => ({}));
	if (!respuesta.ok) {
		throw new Error(datos.msg || datos.error || "No fue posible obtener la dirección.");
	}
	return datos;
};

const consultarGrupo = async (ciudad, grupo, puntoConsulta) => {
	const parametros = new URLSearchParams({ lat: puntoConsulta.latitude, lon: puntoConsulta.longitude, grupo });
	const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/explorar/lugares?${parametros}`);
	const datos = await respuesta.json().catch(() => ({}));
	if (!respuesta.ok) {
		const error = new Error(datos.msg || datos.error || "No fue posible cargar los lugares.");
		error.status = respuesta.status;
		throw error;
	}
	return (datos.places || []).filter(coordenadasValidas).map((lugar) => ({
		...lugar,
		city: ciudad.city,
		country: ciudad.country,
		style: LUGAR_ESTILOS[lugar.category] || LUGAR_ESTILOS.attraction
	}));
};

const consultarGrupoConReintentos = async (ciudad, grupo, puntoConsulta) => {
	for (let intento = 0; intento <= ESPERAS_REINTENTO_MS.length; intento += 1) {
		try {
			return await consultarGrupo(ciudad, grupo, puntoConsulta);
		} catch (error) {
			const quedanReintentos = intento < ESPERAS_REINTENTO_MS.length;
			if (!quedanReintentos || !esErrorTransitorio(error)) throw error;
			await esperar(ESPERAS_REINTENTO_MS[intento]);
		}
	}
	return [];
};

const perteneceCategoria = (lugar, categoria) => {
	if (categoria === "todos") return true;
	const filtro = categoriasExploracion.find((item) => item.clave === categoria);
	return filtro?.categorias?.includes(lugar.category);
};

export const Ciudad = () => {
	const paginaRef = useRef(null);
	useEntradaPagina(paginaRef);
	const { citySlug } = useParams();
	const ciudad = obtenerCiudad(citySlug);
	const [lugares, setLugares] = useState([]);
	const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
	const [categoriaActiva, setCategoriaActiva] = useState("todos");
	const [busqueda, setBusqueda] = useState("");
	const [estadoMapa, setEstadoMapa] = useState("idle");
	const [respuestaCorrectaRecibida, setRespuestaCorrectaRecibida] = useState(false);
	const [errorMapa, setErrorMapa] = useState("");
	const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
	const [estadoDireccion, setEstadoDireccion] = useState("idle");

	useEffect(() => {
		if (!ciudad) return undefined;
		let activa = true;
		const grupos = categoriaActiva === "todos" ? gruposConsulta : [gruposPorCategoria[categoriaActiva]];
		const puntosConsulta = obtenerPuntosConsulta(ciudad);

		setEstadoMapa("loading");
		setRespuestaCorrectaRecibida(false);
		setErrorMapa("");
		setLugares([]);
		setLugarSeleccionado(null);

		const consultas = grupos.flatMap((grupo, indiceGrupo) => puntosConsulta.map((puntoConsulta, indicePunto) => esperar((indiceGrupo * puntosConsulta.length + indicePunto) * ESPERA_ENTRE_GRUPOS_MS).then(() => {
			if (!activa) return [];
			return consultarGrupoConReintentos(ciudad, grupo, puntoConsulta);
		}).then((lugaresDelGrupo) => {
			if (activa) {
				setRespuestaCorrectaRecibida(true);
				setLugares((lugaresActuales) => unirLugares(lugaresActuales, lugaresDelGrupo));
			}
			return lugaresDelGrupo;
		})));

		Promise.allSettled(consultas).then((resultados) => {
			if (!activa) return;
			const respuestasCorrectas = resultados.filter((resultado) => resultado.status === "fulfilled").flatMap((resultado) => resultado.value);
			const primerError = resultados.find((resultado) => resultado.status === "rejected")?.reason;
			if (respuestasCorrectas.length) {
				setEstadoMapa("success");
				return;
			}
			if (primerError) {
				setErrorMapa(primerError.message || "No fue posible cargar los lugares.");
				setEstadoMapa("error");
				return;
			}
			setEstadoMapa("empty");
		});

		return () => { activa = false; };
	}, [categoriaActiva, ciudad]);

	useEffect(() => {
		if (!lugarSeleccionado) {
			setDireccionSeleccionada(null);
			setEstadoDireccion("idle");
			return undefined;
		}

		let activa = true;
		setDireccionSeleccionada(null);
		setEstadoDireccion("loading");
		consultarDireccion(lugarSeleccionado)
			.then((direccion) => {
				if (!activa) return;
				setDireccionSeleccionada(direccion);
				setEstadoDireccion("success");
			})
			.catch(() => {
				if (activa) setEstadoDireccion("error");
			});

		return () => {
			activa = false;
		};
	}, [lugarSeleccionado]);

	const lugaresFiltrados = useMemo(() => {
		const texto = busqueda.trim().toLocaleLowerCase();
		return lugares.filter((lugar) => perteneceCategoria(lugar, categoriaActiva) && (!texto || [lugar.name, lugar.address, lugar.category].filter(Boolean).join(" ").toLocaleLowerCase().includes(texto)));
	}, [busqueda, categoriaActiva, lugares]);
	const categoriaSeleccionada = categoriasExploracion.find((item) => item.clave === categoriaActiva);
	const categoriasDisponibles = new Set(lugares.map((lugar) => lugar.category)).size;
	const mostrarCargador = estadoMapa === "loading" && !respuestaCorrectaRecibida;

	if (!ciudad) {
		return <main className="min-vh-100 d-flex align-items-center" style={{ backgroundColor: "#EAF7FA" }}><div className="container py-5"><div className="col-12 col-md-8 col-lg-6"><p className="small text-uppercase fw-semibold" style={{ color: "#078A9A", letterSpacing: "0.14em" }}>Destino</p><h1 style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 600 }}>Ciudad no encontrada</h1><p className="mb-4" style={{ color: "#6B8991" }}>Este destino no está disponible en nuestro catálogo.</p><Link to="/explorar" className="btn px-4 py-2 rounded-0" style={{ backgroundColor: "#12343B", color: "#FFFFFF" }}>Volver a explorar</Link></div></div></main>;
	}

	return <main
		ref={paginaRef}
		className="min-vh-100 pagina-animada"
		style={{
			backgroundImage: `linear-gradient(90deg, rgba(8, 39, 45, 0.96) 0%, rgba(8, 39, 45, 0.82) 38%, rgba(8, 39, 45, 0.3) 66%, rgba(8, 39, 45, 0.62) 100%), url(${ciudad.image})`,
			backgroundPosition: "center",
			backgroundSize: "cover",
			backgroundAttachment: "fixed",
			color: "#FFFFFF"
		}}
	>
		<div className="container-fluid px-0" style={{ maxWidth: "1520px" }}>
			{/* Navegación sobre la postal */}
			<header
				className="d-flex justify-content-between align-items-center px-3 px-md-5 py-3"
				style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.24)" }}
			>
				<Link
					to="/explorar"
					className="text-decoration-none small fw-semibold"
					style={{ color: "#FFFFFF" }}
				>
					<i className="fa-solid fa-arrow-left me-2" aria-hidden="true" />
					Explorar ciudades
				</Link>
				<span
					className="d-none d-md-inline small text-uppercase fw-semibold"
					style={{ color: "#D4F0F5", letterSpacing: "0.13em" }}
				>
					{ciudad.country} · {ciudad.region}
				</span>
			</header>

			<div className="row g-0 align-items-center px-3 px-md-5 py-4 py-lg-5">
				{/* Identidad de la postal */}
				<section className="col-12 col-lg-5 pe-lg-5 py-4 py-lg-5">
					<h1
						className="display-1 mb-4"
						style={{ fontFamily: "Fraunces, Georgia, serif", lineHeight: 0.9 }}
					>
						{ciudad.city}
					</h1>
					<p
						className="fs-5 mb-4"
						style={{ color: "#E8F7F9", lineHeight: 1.55, maxWidth: "30rem" }}
					>
						{ciudad.description}
					</p>
					<div
						className="d-flex flex-wrap gap-4 py-3 mb-4"
						style={{ borderTop: "1px solid rgba(255, 255, 255, 0.35)", borderBottom: "1px solid rgba(255, 255, 255, 0.35)" }}
					>
						<div>
							<span className="d-block small" style={{ color: "#8CE3ED" }}>Lugares encontrados</span>
							<strong className="fs-3">{lugares.length || "—"}</strong>
						</div>
						<div>
							<span className="d-block small" style={{ color: "#8CE3ED" }}>Ideal para</span>
							<strong className="d-block" style={{ maxWidth: "12rem" }}>{ciudad.bestFor}</strong>
						</div>
					</div>
					<Link
						to="/trips/new"
						className="btn rounded-0 px-4 py-2"
						style={{ backgroundColor: "#28C3D4", color: "#12343B" }}
					>
						Crear un viaje aquí
						<i className="fa-solid fa-arrow-right ms-2" aria-hidden="true" />
					</Link>
				</section>

				{/* Consola de exploración */}
				<section className="col-12 col-lg-7 py-3 py-lg-4">
					<div
						className="p-3 p-md-4"
						style={{ backgroundColor: "rgba(18, 52, 59, 0.97)", color: "#FFFFFF", boxShadow: "0 1rem 3rem rgba(0, 0, 0, 0.35)" }}
					>
						<div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
							<div>
								<h2 className="h3 mb-0" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Encuentra tu próximo lugar</h2>
							</div>
							<div className="position-relative flex-shrink-0" style={{ width: "min(100%, 17rem)" }}>
								<i className="fa-solid fa-magnifying-glass position-absolute" aria-hidden="true" style={{ left: "0.8rem", top: "0.7rem", color: "#078A9A" }} />
								<input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} className="form-control rounded-0 ps-5" placeholder="Buscar un lugar" aria-label="Buscar un lugar" style={{ borderColor: "#B8DCE2", backgroundColor: "#FFFFFF" }} />
							</div>
						</div>
						<div className="d-flex gap-2 overflow-auto pb-2 mb-3" role="group" aria-label="Filtrar lugares por categoría">
							{categoriasExploracion.map((categoria) => <button key={categoria.clave} type="button" onClick={() => setCategoriaActiva(categoria.clave)} aria-pressed={categoriaActiva === categoria.clave} className="btn flex-shrink-0 rounded-0 px-3 py-2" style={{ backgroundColor: categoriaActiva === categoria.clave ? "#28C3D4" : "rgba(255, 255, 255, 0.08)", color: categoriaActiva === categoria.clave ? "#12343B" : "#FFFFFF", border: "1px solid rgba(140, 227, 237, 0.7)" }}><i className={`fa-solid ${categoria.icono} me-2`} aria-hidden="true" />{categoria.etiqueta}</button>)}
						</div>
						<div className="position-relative" style={{ height: "min(58vh, 530px)", minHeight: "25rem", border: "2px solid #78BDC8", backgroundColor: "#D4F0F5" }}>
							<MapaCiudad altura="100%" ciudad={ciudad} lugares={lugaresFiltrados} lugarSeleccionado={lugarSeleccionado} onLugarClick={setLugarSeleccionado} onClusterClick={() => setLugarSeleccionado(null)} />
							{mostrarCargador && <CargadorMapa />}
							{estadoMapa === "empty" && <div className="position-absolute top-50 start-50 translate-middle text-center p-4" style={{ zIndex: 700, width: "min(90%, 25rem)", backgroundColor: "#FFFFFF", color: "#456B75" }}>No encontramos lugares para esta selección.</div>}
							{estadoMapa === "error" && <div className="position-absolute top-50 start-50 translate-middle text-center p-4" style={{ zIndex: 700, width: "min(90%, 25rem)", backgroundColor: "#FFFFFF", color: "#456B75" }}>{errorMapa || "No pudimos cargar los lugares."}</div>}
							{lugarSeleccionado && <article className="position-absolute bottom-0 end-0 m-3 p-3" aria-live="polite" style={{ zIndex: 750, width: "min(23rem, calc(100% - 2rem))", backgroundColor: "#FFFFFF", color: "#12343B", borderLeft: `4px solid ${lugarSeleccionado.style.color}`, boxShadow: "0 0.5rem 1.5rem rgba(18, 52, 59, 0.2)" }}><div className="d-flex justify-content-between gap-3"><div><p className="small text-uppercase fw-semibold mb-1" style={{ color: lugarSeleccionado.style.color }}>{lugarSeleccionado.style.label}</p><h3 className="h5 mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{lugarSeleccionado.name}</h3></div><button type="button" className="btn-close" onClick={() => setLugarSeleccionado(null)} aria-label="Cerrar detalle" /></div><p className="small mb-3" style={{ color: "#6B8991" }}><i className="fa-solid fa-location-dot me-2" aria-hidden="true" />{estadoDireccion === "loading" ? "Cargando dirección..." : direccionSeleccionada?.address || lugarSeleccionado.address || "Dirección no disponible"}</p><BotonFavoritoLugar lugar={lugarSeleccionado} ciudad={ciudad} /></article>}
						</div>
					</div>
				</section>
			</div>
		</div>
	</main>;
};
