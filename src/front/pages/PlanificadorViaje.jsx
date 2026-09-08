import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CargadorMapa } from "../animaciones/CargadorMapa";
import { MapaCiudad } from "../components/MapaCiudad";
import { BotonFavoritoLugar } from "../components/BotonFavoritoLugar";
import { ciudades, LUGAR_ESTILOS } from "../data/ciudades.mjs";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";
import { fetchConSesion } from "../utils/sesion.mjs";

const SelectorHorarioMUI = lazy(() =>
	import("../components/SelectorHorarioMUI").then(({ SelectorHorarioMUI: componente }) => ({ default: componente })),
);

const gruposConsulta = ["turismo_cultura", "comida", "vida_nocturna", "alojamiento", "paseos"];
const ESPERAS_REINTENTO_MS = [1500];
const ESPERA_ENTRE_GRUPOS_MS = 500;
const DISTANCIA_CENTROS_CONSULTA_KM = 5;

const gruposPorCategoria = {
	cultura: "turismo_cultura",
	comida: "comida",
	paseos: "paseos",
	noche: "vida_nocturna",
	alojamiento: "alojamiento"
};
const filtrosCategoria = [
	{ clave: "todos", etiqueta: "Todos", icono: "fa-layer-group" },
	{ clave: "cultura", etiqueta: "Cultura", icono: "fa-landmark", categorias: ["attraction", "museum", "viewpoint", "monument", "gallery"] },
	{ clave: "comida", etiqueta: "Comida", icono: "fa-utensils", categorias: ["restaurant", "cafe", "fast_food"] },
	{ clave: "paseos", etiqueta: "Paseos", icono: "fa-person-walking", categorias: ["park", "pier", "marina", "pedestrian"] },
	{ clave: "noche", etiqueta: "Noche", icono: "fa-martini-glass", categorias: ["bar", "pub", "nightclub"] },
	{ clave: "alojamiento", etiqueta: "Alojamiento", icono: "fa-bed", categorias: ["hotel", "hostel", "guest_house"] }
];

const formatearFechaInput = (fecha) => {
	const year = fecha.getFullYear();
	const month = String(fecha.getMonth() + 1).padStart(2, "0");
	const day = String(fecha.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const obtenerDias = (inicio, fin) => {
	if (!inicio || !fin) return [];
	const dias = [];
	const fechaActual = new Date(`${inicio}T12:00:00`);
	const fechaFinal = new Date(`${fin}T12:00:00`);
	while (fechaActual <= fechaFinal) {
		dias.push(formatearFechaInput(fechaActual));
		fechaActual.setDate(fechaActual.getDate() + 1);
	}
	return dias;
};

const obtenerSemanas = (dias) => {
	const semanas = [];
	for (let indice = 0; indice < dias.length; indice += 7) semanas.push(dias.slice(indice, indice + 7));
	return semanas;
};

const formatearDia = (fecha) => {
	if (!fecha) return "Selecciona un día";
	const fechaFormateada = new Date(`${fecha}T12:00:00`);
	if (Number.isNaN(fechaFormateada.getTime())) return "Selecciona un día";
	return new Intl.DateTimeFormat("es", {
		weekday: "short",
		day: "numeric",
		month: "short"
	}).format(fechaFormateada).replaceAll(".", "");
};

const formatearHora = (hora) => hora ? hora.slice(0, 5) : "Sin hora";

const truncarNota = (nota) => nota.length > 35 ? `${nota.slice(0, 35)}...` : nota;

const consultarDireccion = async (lugar) => {
	const parametros = new URLSearchParams({ lat: lugar.latitude, lon: lugar.longitude });
	const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/explorar/direccion?${parametros}`);
	const datos = await respuesta.json().catch(() => ({}));
	if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible obtener la dirección."));
	return datos;
};

const formatearSemana = (semana) => {
	if (!semana.length) return "";
	const inicio = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(`${semana[0]}T12:00:00`)).replaceAll(".", "");
	const final = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${semana[semana.length - 1]}T12:00:00`)).replaceAll(".", "");
	return `${inicio} — ${final}`;
};

const esCoordenadaValida = (lugar) => Number.isFinite(lugar.latitude) && Number.isFinite(lugar.longitude) && lugar.latitude >= -90 && lugar.latitude <= 90 && lugar.longitude >= -180 && lugar.longitude <= 180;

const esperar = (milisegundos) => new Promise((resolve) => window.setTimeout(resolve, milisegundos));

const esErrorTransitorio = (error) => !error.status || [429, 502, 503, 504].includes(error.status);

const obtenerPuntosConsulta = (ciudad) => {
	const latitudEnRadianes = (ciudad.latitude * Math.PI) / 180;
	const gradosPorKilometro = 1 / (111.32 * Math.cos(latitudEnRadianes));
	const desplazamiento = DISTANCIA_CENTROS_CONSULTA_KM * gradosPorKilometro;
	return [
		{ lado: "oeste", latitude: ciudad.latitude, longitude: ciudad.longitude - desplazamiento },
		{ lado: "este", latitude: ciudad.latitude, longitude: ciudad.longitude + desplazamiento }
	];
};

const consultarGrupo = async (ciudad, grupo, puntoConsulta) => {
	const parametros = new URLSearchParams({ lat: puntoConsulta.latitude, lon: puntoConsulta.longitude, grupo });
	const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/explorar/lugares?${parametros}`);
	const datos = await respuesta.json().catch(() => ({}));
	if (!respuesta.ok) {
		const error = new Error(obtenerMensajeErrorBackend(datos, "No fue posible cargar los lugares."));
		error.status = respuesta.status;
		throw error;
	}
	return (datos.places || []).filter(esCoordenadaValida).map((lugar) => ({
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

const unirLugares = (lugaresActuales, lugaresNuevos) => [...new Map([...lugaresActuales, ...lugaresNuevos].map((lugar) => [lugar.id, lugar])).values()];

const obtenerEtiquetaDia = (dia, dias) => `Día ${dias.indexOf(dia) + 1}`;

export const PlanificadorViaje = () => {
	const { tripId } = useParams();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const fechaSolicitada = searchParams.get("date");
	const token = localStorage.getItem("token");
	const [viaje, setViaje] = useState(null);
	const [destino, setDestino] = useState(null);
	const [ciudad, setCiudad] = useState(null);
	const [lugares, setLugares] = useState([]);
	const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
	const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
	const [estadoDireccion, setEstadoDireccion] = useState("idle");
	const [actividades, setActividades] = useState([]);
	const [diaActivo, setDiaActivo] = useState("");
	const [semanaActiva, setSemanaActiva] = useState(0);
	const [categoriaActiva, setCategoriaActiva] = useState("todos");
	const [busqueda, setBusqueda] = useState("");
	const [hora, setHora] = useState("");
	const [notaActividad, setNotaActividad] = useState("");
	const [modalActividadAbierta, setModalActividadAbierta] = useState(false);
	const [selectorHoraAbierto, setSelectorHoraAbierto] = useState(false);
	const [actividadEditando, setActividadEditando] = useState(null);
	const [horaEdicion, setHoraEdicion] = useState("");
	const [cargando, setCargando] = useState(true);
	const [estadoLugares, setEstadoLugares] = useState("idle");
	const [respuestaCorrectaRecibida, setRespuestaCorrectaRecibida] = useState(false);
	const [guardando, setGuardando] = useState(false);
	const [error, setError] = useState("");

	const dias = useMemo(() => obtenerDias(viaje?.start_date, viaje?.end_date), [viaje]);
	const semanas = useMemo(() => obtenerSemanas(dias), [dias]);
	const semanaVisible = semanas[semanaActiva] || [];
	const actividadesDelDia = useMemo(() => [...actividades].filter((actividad) => actividad.date === diaActivo).sort((a, b) => (a.time || "").localeCompare(b.time || "")), [actividades, diaActivo]);
	const lugaresVisibles = useMemo(() => {
		const texto = busqueda.trim().toLocaleLowerCase();
		return lugares.filter((lugar) => !texto || [lugar.name, lugar.address, lugar.city].filter(Boolean).join(" ").toLocaleLowerCase().includes(texto));
	}, [busqueda, lugares]);
	const direccionParaGuardar = direccionSeleccionada?.address || lugarSeleccionado?.address || "";
	const direccionDelLugar = direccionParaGuardar || "Dirección no disponible";
	const lugarParaGuardar = lugarSeleccionado ? { ...lugarSeleccionado, address: direccionParaGuardar } : null;

	useEffect(() => {
		let activa = true;
		const cargarViaje = async () => {
			if (!token) {
				navigate("/login", { replace: true });
				return;
			}
			try {
				const [respuestaViaje, respuestaDestinos] = await Promise.all([
					fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}`),
					fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}/destinations`)
				]);
				const datosViaje = await respuestaViaje.json();
				const datosDestinos = await respuestaDestinos.json();
				if (!respuestaViaje.ok) throw new Error(obtenerMensajeErrorBackend(datosViaje, "No fue posible cargar el viaje."));
				if (!respuestaDestinos.ok) throw new Error(obtenerMensajeErrorBackend(datosDestinos, "No fue posible cargar el destino."));
				if (!activa) return;
				setViaje(datosViaje);
				const primerDestino = Array.isArray(datosDestinos) ? datosDestinos[0] : null;
				if (primerDestino) {
					setDestino(primerDestino);
					setCiudad(ciudades.find((item) => item.city === primerDestino.name && item.country === primerDestino.country) || null);
				}
			} catch (errorDeRed) {
				if (activa) setError(errorDeRed.message || "No fue posible cargar el planificador.");
			} finally {
				if (activa) setCargando(false);
			}
		};
		cargarViaje();
		return () => { activa = false; };
	}, [navigate, token, tripId]);

	useEffect(() => {
		if (!dias.length) return;
		const diaInicial = dias.includes(fechaSolicitada) ? fechaSolicitada : dias[0];
		const indiceSemana = Math.floor(dias.indexOf(diaInicial) / 7);
		setDiaActivo(diaInicial);
		setSemanaActiva(indiceSemana);
	}, [dias, fechaSolicitada]);

	useEffect(() => {
		if (!destino || !ciudad) return undefined;
		let activa = true;
		const cargarActividades = async () => {
			try {
				const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/destinations/${destino.id}/activities`);
				const datos = await respuesta.json();
				if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible cargar la agenda."));
				if (activa) setActividades(Array.isArray(datos) ? datos : []);
			} catch (errorDeRed) {
				if (activa) setError(errorDeRed.message || "No fue posible cargar la agenda.");
			}
		};
		cargarActividades();
		return () => { activa = false; };
	}, [destino, ciudad]);

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

	useEffect(() => {
		if (!ciudad) return undefined;
		let activa = true;
		const grupos = categoriaActiva === "todos" ? gruposConsulta : [gruposPorCategoria[categoriaActiva]];
		const puntosConsulta = obtenerPuntosConsulta(ciudad);

		setEstadoLugares("loading");
		setRespuestaCorrectaRecibida(false);
		setError("");
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
				setEstadoLugares("success");
				return;
			}
			if (primerError) {
				setError(primerError.message || "No fue posible cargar los lugares.");
				setEstadoLugares("error");
				return;
			}
			setEstadoLugares("empty");
		});

		return () => { activa = false; };
	}, [categoriaActiva, ciudad]);

	const seleccionarDia = (dia) => {
		setDiaActivo(dia);
		setSemanaActiva(Math.floor(dias.indexOf(dia) / 7));
		setSearchParams((actuales) => {
			const nuevos = new URLSearchParams(actuales);
			nuevos.set("date", dia);
			return nuevos;
		});
	};

	const cambiarSemana = (direccion) => {
		const nuevaSemana = Math.max(0, Math.min(semanas.length - 1, semanaActiva + direccion));
		const primerDia = semanas[nuevaSemana]?.[0];
		if (primerDia) seleccionarDia(primerDia);
	};

	const saltarAFecha = (evento) => {
		const fecha = evento.target.value;
		if (dias.includes(fecha)) seleccionarDia(fecha);
	};

	const cambiarCiudad = () => {
		setCiudad(null);
		setLugares([]);
		setLugarSeleccionado(null);
		setActividades([]);
	};

	const seleccionarCiudad = async (ciudadElegida) => {
		setError("");
		setGuardando(true);
		try {
			const endpointDestino = destino
				? `${import.meta.env.VITE_BACKEND_URL}/api/destinations/${destino.id}`
				: `${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}/destinations`;
			const respuesta = await fetchConSesion(endpointDestino, {
				method: destino ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: ciudadElegida.city, country: ciudadElegida.country })
			});
		const datos = await respuesta.json();
		if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible seleccionar la ciudad."));
		setDestino(datos);
		setCiudad(ciudadElegida);
		} catch (errorDeRed) {
		setError(errorDeRed.message || "No fue posible seleccionar la ciudad.");
	} finally {
		setGuardando(false);
	}
	};

	const abrirModalActividad = () => {
		setHora("");
		setNotaActividad("");
		setSelectorHoraAbierto(false);
		setError("");
		setModalActividadAbierta(true);
	};

	const cerrarModalActividad = () => {
		if (guardando) return;
		setSelectorHoraAbierto(false);
		setModalActividadAbierta(false);
	};

	const agregarLugarAlDia = async () => {
		if (!lugarParaGuardar || !diaActivo || !destino) return;
		setError("");
		setGuardando(true);
		try {
			const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/destinations/${destino.id}/activities`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: lugarParaGuardar.name,
					date: diaActivo,
					time: hora || null,
					notes: notaActividad.trim(),
					place_id: String(lugarParaGuardar.id),
					place_category: lugarParaGuardar.category || null,
					place_address: lugarParaGuardar.address || null,
					place_city: lugarParaGuardar.city || ciudad.city,
					place_source: "OpenStreetMap",
					place_latitude: lugarParaGuardar.latitude,
					place_longitude: lugarParaGuardar.longitude
				})
			});
			const datos = await respuesta.json();
			if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible agregar el lugar al día."));
			setActividades((actuales) => [...actuales, datos]);
			setHora("");
			setNotaActividad("");
			setModalActividadAbierta(false);
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible agregar el lugar.");
		} finally {
			setGuardando(false);
		}
	};

	const guardarHoraActividad = async (actividad) => {
		setError("");
		try {
			const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/activities/${actividad.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ time: horaEdicion || null })
		});
		const datos = await respuesta.json();
		if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible editar la actividad."));
		setActividades((actuales) => actuales.map((actual) => actual.id === actividad.id ? datos : actual));
		setActividadEditando(null);
	} catch (errorDeRed) {
		setError(errorDeRed.message || "No fue posible editar la actividad.");
	}
	};

	const eliminarActividad = async (actividadId) => {
		setError("");
		try {
			const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/activities/${actividadId}`, { method: "DELETE" });
			const datos = await respuesta.json();
			if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible quitar la actividad."));
			setActividades((actuales) => actuales.filter((actividad) => actividad.id !== actividadId));
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible quitar la actividad.");
		}
	};

	if (cargando) return <main className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#EAF7FA", color: "#456B75" }}>Cargando tu planificador...</main>;
	if (error && !viaje) return <main className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#EAF7FA" }}><div className="alert alert-danger rounded-0">{error}</div></main>;

	return (
		<main className="min-vh-100" style={{ backgroundColor: "#EAF7FA" }}>
			<div className="container-fluid px-3 px-md-4 py-3" style={{ maxWidth: "1600px" }}>
				{/* Cabecera del workspace */}
				<header className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-3">
					<div>
						<Link to={`/trips/${tripId}`} className="small text-decoration-none" style={{ color: "#078A9A" }}><i className="fa-solid fa-arrow-left me-2" aria-hidden="true" />Detalle del viaje</Link>
						<h1 className="mb-1 mt-2" style={{ fontFamily: "Fraunces, Georgia, serif", color: "#12343B", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 600 }}>{viaje.name}</h1>
						{ciudad && <p className="mb-0 small" style={{ color: "#456B75" }}><i className="fa-solid fa-location-dot me-2" aria-hidden="true" />{ciudad.city}, {ciudad.country}</p>}
					</div>
					{ciudad && <button type="button" onClick={cambiarCiudad} className="btn btn-sm align-self-start align-self-lg-end rounded-0" style={{ color: "#078A9A", backgroundColor: "transparent", border: "1px solid #B8DCE3" }}>Cambiar destino</button>}
				</header>

				{error && <div className="alert alert-danger rounded-0" role="alert">{error}</div>}

				{!ciudad ? (
					<section className="p-4 p-md-5" style={{ backgroundColor: "#FFFFFF" }}>
						<p className="small text-uppercase fw-semibold" style={{ color: "#078A9A", letterSpacing: "0.12em" }}>Primer paso</p>
						<h2 style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif" }}>¿Qué ciudad quieres recorrer?</h2>
						<p style={{ color: "#6B8991" }}>Elige un destino para preparar su mapa y comenzar tu agenda.</p>
						<div className="row g-3 mt-3">{ciudades.map((item) => <div className="col-12 col-md-6 col-xl-4" key={item.slug}><button type="button" onClick={() => seleccionarCiudad(item)} disabled={guardando} className="w-100 text-start p-3" style={{ backgroundColor: "#EAF7FA", border: "1px solid #DDECEF", color: "#12343B" }}><strong className="d-block">{item.city}</strong><span className="small" style={{ color: "#6B8991" }}>{item.country}</span></button></div>)}</div>
					</section>
				) : (
					<>
						{/* Navegación semanal */}
						<section className="p-3 p-md-4 mb-3" style={{ backgroundColor: "#12343B", color: "#FFFFFF" }}>
							<div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
								<div><p className="small text-uppercase fw-semibold mb-1" style={{ color: "#8CE3ED", letterSpacing: "0.12em" }}>Navegación del viaje</p><h2 className="h4 mb-0" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Semana {semanaActiva + 1} de {semanas.length}</h2><span className="small" style={{ color: "#D4F0F5" }}>{formatearSemana(semanaVisible)}</span></div>
								<div className="d-flex flex-wrap align-items-center justify-content-md-end gap-2"><label htmlFor="saltar-fecha" className="small text-uppercase fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: "#D4F0F5", letterSpacing: "0.08em" }}><i className="fa-regular fa-calendar" aria-hidden="true" />Ir a fecha</label><input id="saltar-fecha" type="date" min={dias[0]} max={dias[dias.length - 1]} value={dias.includes(fechaSolicitada) ? fechaSolicitada : diaActivo} onChange={saltarAFecha} className="form-control form-control-sm rounded-0" style={{ width: "9.5rem", minHeight: "2.25rem", backgroundColor: "#EAF7FA", color: "#12343B", border: "1px solid #8CE3ED", fontWeight: 600, colorScheme: "light" }} /><button type="button" onClick={() => cambiarSemana(-1)} disabled={semanaActiva === 0} className="btn btn-sm" aria-label="Semana anterior" style={{ color: "#FFFFFF", border: "1px solid #8CE3ED", borderRadius: 0 }}><i className="fa-solid fa-chevron-left" aria-hidden="true" /></button><button type="button" onClick={() => cambiarSemana(1)} disabled={semanaActiva === semanas.length - 1} className="btn btn-sm" aria-label="Semana siguiente" style={{ color: "#FFFFFF", border: "1px solid #8CE3ED", borderRadius: 0 }}><i className="fa-solid fa-chevron-right" aria-hidden="true" /></button></div>
							</div>
							<div className="row g-2">{semanaVisible.map((dia) => { const cantidad = actividades.filter((actividad) => actividad.date === dia).length; const activo = dia === diaActivo; return <div className="col" key={dia}><button type="button" onClick={() => seleccionarDia(dia)} className="w-100 text-start p-2 p-md-3 h-100" aria-pressed={activo} style={{ minHeight: "5.2rem", backgroundColor: activo ? "#28C3D4" : "rgba(255, 255, 255, 0.07)", color: activo ? "#12343B" : "#FFFFFF", border: activo ? "2px solid #28C3D4" : "1px solid rgba(212, 240, 245, 0.3)", borderRadius: 0 }}><span className="d-block small text-uppercase fw-semibold">{formatearDia(dia).split(" ")[0]}</span><strong className="d-block fs-5">{new Date(`${dia}T12:00:00`).getDate()}</strong><span className="d-block small mt-1" style={{ opacity: 0.8 }}>{cantidad ? `${cantidad} lugares` : "Libre"}</span></button></div>; })}</div>
						</section>

						<div className="row g-3 g-xl-4">
							{/* Exploración del mapa */}
							<section className="col-12 col-xl-8">
								<div className="p-3 p-md-4 mb-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #DDECEF" }}>
									<div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3"><div><p className="small text-uppercase fw-semibold mb-1" style={{ color: "#078A9A", letterSpacing: "0.12em" }}>Explorar lugares</p><h2 className="h4 mb-0" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif" }}>¿Qué quieres explorar?</h2></div><div className="position-relative" style={{ minWidth: "min(100%, 18rem)" }}><i className="fa-solid fa-magnifying-glass position-absolute" aria-hidden="true" style={{ left: "0.8rem", top: "0.65rem", color: "#078A9A" }} /><input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar museo, café, parque..." aria-label="Buscar lugares" className="form-control rounded-0 ps-5" style={{ borderColor: "#B8DCE3", color: "#12343B" }} /></div></div>
									<div className="d-flex gap-2 overflow-auto pb-1" role="group" aria-label="Categorías de lugares">{filtrosCategoria.map((filtro) => <button type="button" key={filtro.clave} onClick={() => setCategoriaActiva(filtro.clave)} aria-pressed={categoriaActiva === filtro.clave} className="btn btn-sm text-nowrap rounded-0" style={{ backgroundColor: categoriaActiva === filtro.clave ? "#12343B" : "#EAF7FA", color: categoriaActiva === filtro.clave ? "#FFFFFF" : "#12343B", border: "1px solid #B8DCE3" }}><i className={`fa-solid ${filtro.icono} me-2`} aria-hidden="true" />{filtro.etiqueta}</button>)}</div>
									{estadoLugares === "loading" && <p className="small mb-0 mt-3" role="status" style={{ color: "#078A9A" }}><i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />Cargando lugares...</p>}
								</div>
								<div className="explorar-mapa-wrapper" style={{ height: "min(68vh, 680px)", minHeight: "430px" }}><MapaCiudad altura="100%" ciudad={ciudad} lugares={lugaresVisibles} lugarSeleccionado={lugarSeleccionado} onLugarClick={setLugarSeleccionado} onClusterClick={() => setLugarSeleccionado(null)} />{estadoLugares === "loading" && !respuestaCorrectaRecibida && <CargadorMapa />}{lugarSeleccionado && <article className="explorar-lugar-detalle" style={{ bottom: "1rem", left: "1rem", width: "min(34rem, calc(100% - 2rem))" }}><div className="explorar-lugar-detalle-contenido"><p className="small text-uppercase fw-semibold mb-1" style={{ color: lugarSeleccionado.style.color, letterSpacing: "0.1em" }}>{lugarSeleccionado.style.label}</p><h3 className="h5 mb-2" style={{ color: "#12343B" }}>{lugarSeleccionado.name}</h3><p className="small mb-3" style={{ color: "#6B8991" }}>{estadoDireccion === "loading" ? "Buscando dirección..." : direccionDelLugar}</p><div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2"><button type="button" onClick={abrirModalActividad} disabled={guardando} className="btn btn-sm px-3" style={{ backgroundColor: "#12343B", color: "#FFFFFF", borderRadius: 0 }}>Añadir al {obtenerEtiquetaDia(diaActivo, dias)}</button></div><div className="mt-3 pt-3" style={{ borderTop: "1px solid #DDECEF" }}><BotonFavoritoLugar lugar={lugarParaGuardar} ciudad={ciudad} compacto /></div></div><button type="button" onClick={() => setLugarSeleccionado(null)} className="btn-close" aria-label="Cerrar información del lugar" /></article>}</div>
							</section>

							{/* Agenda del día */}
							<section className="col-12 col-xl-4">
								<div className="p-3 p-md-4 h-100" style={{ backgroundColor: "#FFFFFF", border: "1px solid #DDECEF" }}>
									<div className="d-flex justify-content-between align-items-start gap-2 mb-4"><div><p className="small text-uppercase fw-semibold mb-2" style={{ color: "#078A9A", letterSpacing: "0.12em" }}>{obtenerEtiquetaDia(diaActivo, dias)}</p><h2 className="h4 mb-1" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif" }}>{formatearDia(diaActivo)}</h2><span className="small" style={{ color: "#6B8991" }}>{actividadesDelDia.length} {actividadesDelDia.length === 1 ? "actividad" : "actividades"}</span></div><i className="fa-regular fa-calendar" style={{ color: "#28C3D4", fontSize: "1.35rem" }} aria-hidden="true" /></div>
									{actividadesDelDia.length === 0 ? <div className="py-4" style={{ borderTop: "1px solid #DDECEF" }}><p className="mb-2" style={{ color: "#6B8991" }}>Este día todavía está libre.</p><small style={{ color: "#6B8991" }}>Selecciona un lugar en el mapa para comenzar.</small></div> : <ul className="list-unstyled mb-0">{actividadesDelDia.map((actividad) => <li key={actividad.id} className="py-3" style={{ borderTop: "1px solid #DDECEF" }}>{actividadEditando === actividad.id ? <div><strong className="d-block mb-2" style={{ color: "#12343B" }}>{actividad.name}</strong><div className="d-flex gap-2"><input aria-label={`Editar hora de ${actividad.name}`} type="time" value={horaEdicion} onChange={(evento) => setHoraEdicion(evento.target.value)} className="form-control form-control-sm rounded-0" /><button type="button" onClick={() => guardarHoraActividad(actividad)} className="btn btn-sm" style={{ backgroundColor: "#12343B", color: "#FFFFFF", borderRadius: 0 }}>Guardar</button><button type="button" onClick={() => setActividadEditando(null)} className="btn btn-sm btn-light rounded-0">Cancelar</button></div></div> : <div className="d-flex justify-content-between gap-2"><div><strong className="d-block" style={{ color: "#12343B" }}>{actividad.name}</strong><small style={{ color: "#078A9A" }}>{formatearHora(actividad.time)}</small>{actividad.place_address && <small className="d-block mt-2" style={{ color: "#6B8991" }}>{actividad.place_address}</small>}{actividad.notes && <small className="d-block mt-2" style={{ color: "#456B75", overflowWrap: "anywhere" }}><strong>Nota:</strong> {truncarNota(actividad.notes)}</small>}</div><div className="d-flex gap-2"><button type="button" onClick={() => { setActividadEditando(actividad.id); setHoraEdicion(actividad.time ? actividad.time.slice(0, 5) : ""); }} className="btn btn-sm p-0" aria-label={`Editar hora de ${actividad.name}`} style={{ color: "#078A9A" }}><i className="fa-solid fa-pen" aria-hidden="true" /></button><button type="button" onClick={() => eliminarActividad(actividad.id)} className="btn btn-sm p-0" aria-label={`Eliminar ${actividad.name}`} style={{ color: "#B02A37" }}><i className="fa-solid fa-trash" aria-hidden="true" /></button></div></div>}</li>)}</ul>}
								</div>
							</section>
						</div>
					</>
				)}
			</div>
			{modalActividadAbierta && lugarParaGuardar && <div role="presentation" onClick={(evento) => { if (evento.target === evento.currentTarget) cerrarModalActividad(); }} style={{ position: "fixed", inset: 0, zIndex: 2000, backgroundColor: "rgba(18, 52, 59, 0.58)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
				<section role="dialog" aria-modal="true" aria-labelledby="modal-actividad-titulo" className="w-100" style={{ maxWidth: selectorHoraAbierto ? "27rem" : "34rem", backgroundColor: "#FFFFFF", color: "#12343B", boxShadow: "0 1rem 3rem rgba(18, 52, 59, 0.2)" }}>
					<div className="d-flex justify-content-between align-items-start gap-3 p-4" style={{ borderBottom: "1px solid #DDECEF" }}>
						<div><p className="small text-uppercase fw-semibold mb-2" style={{ color: "#078A9A", letterSpacing: "0.12em" }}>{selectorHoraAbierto ? "Elegir horario" : "Nueva actividad"}</p><h2 id="modal-actividad-titulo" className="h4 mb-1" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{selectorHoraAbierto ? "Selecciona la hora" : `Añadir al ${obtenerEtiquetaDia(diaActivo, dias)}`}</h2>{!selectorHoraAbierto && <p className="small mb-0" style={{ color: "#6B8991" }}>{lugarParaGuardar.name}</p>}</div>
						<button type="button" onClick={selectorHoraAbierto ? () => setSelectorHoraAbierto(false) : cerrarModalActividad} disabled={guardando} className="btn-close" aria-label={selectorHoraAbierto ? "Cancelar selección de horario" : "Cerrar ventana de actividad"} />
					</div>
					{selectorHoraAbierto ? <Suspense fallback={<div className="p-4">Cargando selector...</div>}><div className="p-4"><SelectorHorarioMUI value={hora} onSave={(horaConfirmada) => { setHora(horaConfirmada); setSelectorHoraAbierto(false); }} onCancel={() => setSelectorHoraAbierto(false)} /></div></Suspense> : <div className="p-4">
						<p className="small mb-4" style={{ color: "#6B8991" }}><i className="fa-solid fa-location-dot me-2" aria-hidden="true" />{direccionDelLugar}</p>
						<div className="mb-3"><span id="hora-actividad-label" className="form-label small text-uppercase fw-semibold d-block" style={{ color: "#456B75", letterSpacing: "0.08em" }}>Horario</span><button type="button" onClick={() => setSelectorHoraAbierto(true)} className="btn w-100 rounded-0 d-flex align-items-center justify-content-between text-start px-3" aria-labelledby="hora-actividad-label" style={{ minHeight: "3rem", color: hora ? "#12343B" : "#6B8991", border: "1px solid #B8DCE3", backgroundColor: "#FFFFFF", fontSize: "1.05rem" }}><span>{hora ? hora.slice(0, 5) : "--:--"}</span><i className="fa-solid fa-pen" aria-hidden="true" /></button><small className="d-block mt-2" style={{ color: "#6B8991" }}>Pulsa la hora o el lápiz para abrir el reloj.</small></div>
						<div className="mb-4"><label htmlFor="nota-actividad" className="form-label small text-uppercase fw-semibold" style={{ color: "#456B75", letterSpacing: "0.08em" }}>Nota <span className="text-lowercase fw-normal" style={{ color: "#91AEB5", letterSpacing: 0 }}>(opcional)</span></label><textarea id="nota-actividad" value={notaActividad} onChange={(evento) => setNotaActividad(evento.target.value)} className="form-control rounded-0" rows="3" placeholder="Ej. Reservar mesa o visitar al atardecer." /></div>
						<div className="d-flex justify-content-end gap-2"><button type="button" onClick={cerrarModalActividad} disabled={guardando} className="btn btn-sm px-3 rounded-0" style={{ color: "#456B75", border: "1px solid #B8DCE3" }}>Cancelar</button><button type="button" onClick={agregarLugarAlDia} disabled={guardando} className="btn btn-sm px-3 rounded-0" style={{ backgroundColor: "#12343B", color: "#FFFFFF" }}>{guardando ? "Guardando..." : "Guardar actividad"}</button></div>
					</div>}
				</section>
			</div>}
		</main>
	);
};
