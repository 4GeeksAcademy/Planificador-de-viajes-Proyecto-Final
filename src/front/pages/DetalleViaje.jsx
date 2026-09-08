import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ModalConfirmacionEliminacion } from "../components/ModalConfirmacionEliminacion";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";
import { fetchConSesion } from "../utils/sesion.mjs";
import { validarFechasViaje } from "../utils/viajes.mjs";
import { useEntradaPagina } from "../animaciones/useEntradaPagina";

const estiloTitulo = {
	fontFamily: "Fraunces, Georgia, serif",
	fontWeight: 600
};

const estiloInput = {
	border: "1px solid #B8DCE3",
	borderRadius: 0,
	color: "#12343B"
};

const formatearFecha = (fecha) => {
	if (!fecha) return "Fecha pendiente";
	return new Intl.DateTimeFormat("es", {
		day: "numeric",
		month: "long",
		year: "numeric"
	}).format(new Date(`${fecha}T12:00:00`));
};

const obtenerDias = (inicio, fin) => {
	if (!inicio || !fin) return [];
	const dias = [];
	const fechaActual = new Date(`${inicio}T12:00:00`);
	const fechaFinal = new Date(`${fin}T12:00:00`);

	while (fechaActual <= fechaFinal) {
		const fecha = fechaActual.toISOString().slice(0, 10);
		dias.push(fecha);
		fechaActual.setDate(fechaActual.getDate() + 1);
	}

	return dias;
};

const obtenerClaveMes = (fecha) => fecha.slice(0, 7);

const obtenerCeldasCalendario = (mes) => {
	if (!mes) return [];
	const [year, month] = mes.split("-").map(Number);
	const cantidadDias = new Date(year, month, 0).getDate();
	const primerDia = new Date(year, month - 1, 1).getDay();
	const espaciosIniciales = (primerDia + 6) % 7;
	const cantidadCeldas = Math.ceil((espaciosIniciales + cantidadDias) / 7) * 7;
	const primeraFecha = new Date(year, month - 1, 1 - espaciosIniciales);

	return Array.from({ length: cantidadCeldas }, (_, indice) => {
		const fecha = new Date(primeraFecha);
		fecha.setDate(primeraFecha.getDate() + indice);
		const fechaYear = fecha.getFullYear();
		const fechaMonth = String(fecha.getMonth() + 1).padStart(2, "0");
		const fechaDay = String(fecha.getDate()).padStart(2, "0");
		return `${fechaYear}-${fechaMonth}-${fechaDay}`;
	});
};

const formatearMes = (mes) => {
	if (!mes) return "";
	return new Intl.DateTimeFormat("es", { month: "long", year: "numeric" })
		.format(new Date(`${mes}-01T12:00:00`))
		.replace(/^./, (letra) => letra.toUpperCase());
};

export const DetalleViaje = () => {
	const paginaRef = useRef(null);
	useEntradaPagina(paginaRef);
	const { tripId } = useParams();
	const navigate = useNavigate();
	const [viaje, setViaje] = useState(null);
	const [formulario, setFormulario] = useState(null);
	const [destinos, setDestinos] = useState([]);
	const [actividades, setActividades] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [guardando, setGuardando] = useState(false);
	const [editando, setEditando] = useState(false);
	const [modalEliminacionAbierto, setModalEliminacionAbierto] = useState(false);
	const [mesVisible, setMesVisible] = useState("");
	const [error, setError] = useState("");

	const dias = useMemo(() => obtenerDias(viaje?.start_date, viaje?.end_date), [viaje]);
	const actividadesPorDia = useMemo(() => {
		const agrupadas = new Map(dias.map((dia) => [dia, []]));
		actividades.forEach((actividad) => {
			if (agrupadas.has(actividad.date)) agrupadas.get(actividad.date).push(actividad);
		});
		return agrupadas;
	}, [actividades, dias]);
	const mesesDelViaje = useMemo(() => [...new Set(dias.map(obtenerClaveMes))], [dias]);
	const mesActual = mesesDelViaje.includes(mesVisible) ? mesVisible : mesesDelViaje[0] || "";
	const indiceMesActual = mesesDelViaje.indexOf(mesActual);
	const celdasCalendario = useMemo(() => obtenerCeldasCalendario(mesActual), [mesActual]);

	const cantidadActividades = actividades.length;
	const nombreDestinos = destinos.map((destino) => `${destino.name}, ${destino.country}`).join(" · ");
	const estadoViaje = cantidadActividades > 0 ? "En planificación" : destinos.length > 0 ? "Destino elegido" : "Por comenzar";

	useEffect(() => {
		let activa = true;
		const cargarDatos = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				navigate("/login", { replace: true });
				return;
			}

			try {
				const respuestaViaje = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}`);
				const datosViaje = await respuestaViaje.json();
				if (!respuestaViaje.ok) throw new Error(obtenerMensajeErrorBackend(datosViaje, "No fue posible cargar el viaje."));

				const respuestaDestinos = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}/destinations`);
				const datosDestinos = await respuestaDestinos.json();
				if (!respuestaDestinos.ok) throw new Error(obtenerMensajeErrorBackend(datosDestinos, "No fue posible cargar los destinos."));

				const destinosCargados = Array.isArray(datosDestinos) ? datosDestinos : [];
				const respuestasActividades = await Promise.all(destinosCargados.map((destino) => fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/destinations/${destino.id}/activities`)));
				const datosActividades = await Promise.all(respuestasActividades.map(async (respuesta) => {
					const datos = await respuesta.json();
					if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible cargar el itinerario."));
					return Array.isArray(datos) ? datos : [];
				}));

				if (!activa) return;
				setViaje(datosViaje);
				setFormulario(datosViaje);
				setDestinos(destinosCargados);
				setActividades(datosActividades.flat());
			} catch (errorDeRed) {
				if (activa) setError(errorDeRed.message || "No fue posible cargar el viaje.");
			} finally {
				if (activa) setCargando(false);
			}
		};

		cargarDatos();
		return () => { activa = false; };
	}, [navigate, tripId]);

	const manejarCambio = (evento) => {
		const { name, value } = evento.target;
		setFormulario((actual) => ({ ...actual, [name]: value }));
	};

	const guardarCambios = async (evento) => {
		evento.preventDefault();
		setError("");
		const errorFechas = validarFechasViaje(formulario.start_date, formulario.end_date);
		if (errorFechas) {
			setError(errorFechas);
			return;
		}

		setGuardando(true);
		try {
			const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: formulario.name,
					start_date: formulario.start_date,
					end_date: formulario.end_date
				})
			});
			const datos = await respuesta.json();
			if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible actualizar el viaje."));
			setViaje(datos);
			setFormulario(datos);
			setEditando(false);
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible actualizar el viaje.");
		} finally {
			setGuardando(false);
		}
	};

	const eliminarViaje = async () => {
		setError("");
		setGuardando(true);
		try {
			const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}`, { method: "DELETE" });
			const datos = await respuesta.json();
			if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible eliminar el viaje."));
			navigate("/trips", { state: { mensaje: "El viaje se eliminó correctamente." } });
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible eliminar el viaje.");
			setGuardando(false);
		}
	};

	if (cargando) return <main className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#EAF7FA", color: "#456B75" }}>Cargando la bitácora del viaje...</main>;
	if (!viaje || !formulario) return <main className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#EAF7FA" }}><div className="alert alert-danger rounded-0">{error || "No encontramos este viaje."}</div></main>;

	return (
		<main ref={paginaRef} className="min-vh-100 pagina-animada detalle-viaje-pagina" style={{ backgroundColor: "#EAF7FA" }}>
			<div className="container py-4 py-lg-5">
				<Link to="/trips" className="small text-decoration-none" style={{ color: "#078A9A" }}><i className="fa-solid fa-arrow-left me-2" aria-hidden="true" />Mis viajes</Link>

				{/* Portada del viaje */}
				<section className="mt-3 mb-4 p-4 p-md-5" style={{ backgroundColor: "#12343B", color: "#FFFFFF", borderLeft: "5px solid #28C3D4" }}>
					<div className="row align-items-end g-4">
						<div className="col-lg-8">
							<p className="small text-uppercase fw-semibold mb-3" style={{ color: "#8CE3ED", letterSpacing: "0.16em" }}>Bitácora de viaje</p>
							<h1 className="display-4 mb-3" style={{ ...estiloTitulo, color: "#FFFFFF" }}>{viaje.name}</h1>
							<p className="mb-0" style={{ color: "#D4F0F5" }}>{formatearFecha(viaje.start_date)} — {formatearFecha(viaje.end_date)}</p>
						</div>
						<div className="col-lg-4 d-flex justify-content-lg-end">
							<Link to={`/trips/${tripId}/planificar`} className="btn px-4 py-3" style={{ backgroundColor: "#28C3D4", color: "#12343B", borderRadius: 0, fontWeight: 700 }}><i className="fa-solid fa-route me-2" aria-hidden="true" />Abrir planificador</Link>
						</div>
					</div>
				</section>

				{error && <div className="alert alert-danger rounded-0" role="alert">{error}</div>}

				{/* Resumen real del viaje */}
				<section className="row g-0 mb-5" aria-label="Resumen del viaje">
					<div className="col-6 col-lg-3 p-3 p-md-4" style={{ backgroundColor: "#FFFFFF", borderRight: "1px solid #DDECEF", borderBottom: "1px solid #DDECEF" }}><p className="small mb-2" style={{ color: "#6B8991" }}>Destino</p><p className="mb-0 fw-semibold" style={{ color: "#12343B" }}>{nombreDestinos || "Todavía no elegido"}</p></div>
					<div className="col-6 col-lg-3 p-3 p-md-4" style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #DDECEF" }}><p className="small mb-2" style={{ color: "#6B8991" }}>Duración</p><p className="mb-0 fw-semibold" style={{ color: "#12343B" }}>{dias.length} {dias.length === 1 ? "día" : "días"}</p></div>
					<div className="col-6 col-lg-3 p-3 p-md-4" style={{ backgroundColor: "#FFFFFF", borderRight: "1px solid #DDECEF" }}><p className="small mb-2" style={{ color: "#6B8991" }}>Actividades</p><p className="mb-0 fw-semibold" style={{ color: "#12343B" }}>{cantidadActividades}</p></div>
					<div className="col-6 col-lg-3 p-3 p-md-4" style={{ backgroundColor: "#FFFFFF" }}><p className="small mb-2" style={{ color: "#6B8991" }}>Estado</p><p className="mb-0 fw-semibold" style={{ color: "#078A9A" }}>{estadoViaje}</p></div>
				</section>

				{/* Calendario del itinerario */}
				<section className="mb-5 planificador-entrada-izquierda" aria-label="Calendario del viaje">
					<div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4"><div><p className="small text-uppercase fw-semibold mb-2" style={{ color: "#078A9A", letterSpacing: "0.14em" }}>Calendario del viaje</p><h2 className="display-6 mb-0" style={{ ...estiloTitulo, color: "#12343B" }}>Elige un día para planificar</h2></div><span className="small" style={{ color: "#6B8991" }}>Selecciona una fecha para abrir su agenda</span></div>
					<div className="p-3 p-md-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #DDECEF" }}>
						<div className="d-flex justify-content-between align-items-center mb-4"><button type="button" onClick={() => setMesVisible(mesesDelViaje[indiceMesActual - 1])} disabled={indiceMesActual <= 0} className="btn btn-sm rounded-0" aria-label="Mes anterior" style={{ color: "#12343B", border: "1px solid #B8DCE3" }}><i className="fa-solid fa-chevron-left" aria-hidden="true" /></button><h3 className="h4 mb-0 text-center" style={{ ...estiloTitulo, color: "#12343B" }}>{formatearMes(mesActual)}</h3><button type="button" onClick={() => setMesVisible(mesesDelViaje[indiceMesActual + 1])} disabled={indiceMesActual < 0 || indiceMesActual >= mesesDelViaje.length - 1} className="btn btn-sm rounded-0" aria-label="Mes siguiente" style={{ color: "#12343B", border: "1px solid #B8DCE3" }}><i className="fa-solid fa-chevron-right" aria-hidden="true" /></button></div>
						<div className="d-grid gap-1 mb-2" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia) => <div className="col text-center small fw-semibold" style={{ color: "#6B8991" }} key={dia}>{dia}</div>)}</div>
						<div className="d-grid" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderTop: "2px solid #B8DCE3", borderLeft: "2px solid #B8DCE3" }}>{celdasCalendario.map((fecha, indice) => { const esDiaDelMes = Boolean(fecha && obtenerClaveMes(fecha) === mesActual); const esDiaDelViaje = Boolean(fecha && dias.includes(fecha)); const esInteractuable = esDiaDelMes && esDiaDelViaje; const numeroDiaViaje = esDiaDelViaje ? dias.indexOf(fecha) + 1 : null; const cantidad = fecha ? (actividadesPorDia.get(fecha) || []).length : 0; return <div key={fecha || `vacio-${indice}`} style={{ borderRight: "2px solid #B8DCE3", borderBottom: "2px solid #B8DCE3" }}><button type="button" disabled={!esInteractuable} onClick={() => esInteractuable && navigate(`/trips/${tripId}/planificar?date=${fecha}`)} className="w-100 d-flex flex-column align-items-center justify-content-center position-relative p-2 p-md-3 rounded-0 text-start" aria-label={fecha ? (esInteractuable ? `Día ${numeroDiaViaje}, ${formatearFecha(fecha)}. Abrir planificador` : formatearFecha(fecha)) : undefined} style={{ minHeight: "6rem", backgroundColor: esDiaDelMes ? (esDiaDelViaje ? "#EAF7FA" : "#FFFFFF") : "#EEF1F2", border: 0, color: esDiaDelMes && esDiaDelViaje ? "#12343B" : "#91AEB5", cursor: esInteractuable ? "pointer" : "default" }}>{fecha && <><span className="small fw-semibold position-absolute top-0 end-0 mt-2 me-2" style={{ color: esDiaDelMes && esDiaDelViaje ? "#078A9A" : "#91AEB5" }}>{esDiaDelViaje ? `Día #${numeroDiaViaje}` : ""}</span><strong className="fs-5 align-self-center">{Number(fecha.slice(-2))}</strong>{cantidad > 0 && <span className="small text-center position-absolute bottom-0 start-50 translate-middle-x mb-2" style={{ color: esDiaDelMes && esDiaDelViaje ? "#078A9A" : "#91AEB5" }}>{cantidad} {cantidad === 1 ? "actividad" : "actividades"}</span>}</>}</button></div>; })}</div>
					</div>
				</section>

				{/* Edición secundaria */}
				<section className="mb-4 p-4 p-md-5 planificador-entrada-izquierda" style={{ backgroundColor: "#FFFFFF", borderTop: "3px solid #DDECEF" }}>
					<div className="d-flex justify-content-between align-items-center gap-3"><div><p className="small text-uppercase fw-semibold mb-2" style={{ color: "#078A9A", letterSpacing: "0.14em" }}>Datos del viaje</p><h2 className="h4 mb-0" style={{ ...estiloTitulo, color: "#12343B" }}>Información general</h2></div><button type="button" onClick={() => { setEditando((actual) => !actual); setError(""); }} className="btn btn-sm px-3" style={{ backgroundColor: editando ? "#EAF7FA" : "#12343B", color: editando ? "#12343B" : "#FFFFFF", borderRadius: 0 }}>{editando ? "Cerrar edición" : "Editar datos"}</button></div>
					{editando && <form onSubmit={guardarCambios} className="mt-4 pt-4" style={{ borderTop: "1px solid #DDECEF" }}><div className="row g-3"><div className="col-lg-4"><label htmlFor="trip-name" className="form-label small fw-semibold" style={{ color: "#12343B" }}>Nombre del viaje</label><input id="trip-name" name="name" type="text" required value={formulario.name} onChange={manejarCambio} className="form-control" style={estiloInput} /></div><div className="col-lg-4"><label htmlFor="trip-start-date" className="form-label small fw-semibold" style={{ color: "#12343B" }}>Fecha de inicio</label><input id="trip-start-date" name="start_date" type="date" required value={formulario.start_date || ""} onChange={manejarCambio} className="form-control" style={estiloInput} /></div><div className="col-lg-4"><label htmlFor="trip-end-date" className="form-label small fw-semibold" style={{ color: "#12343B" }}>Fecha de regreso</label><input id="trip-end-date" name="end_date" type="date" required value={formulario.end_date || ""} onChange={manejarCambio} className="form-control" style={estiloInput} /></div></div><button type="submit" className="btn px-4 py-3 mt-4" disabled={guardando} style={{ backgroundColor: "#12343B", color: "#FFFFFF", borderRadius: 0 }}>{guardando ? "Guardando..." : "Guardar cambios"}</button></form>}
				</section>

				{/* Zona de gestión */}
				<section className="border-top pt-4 planificador-entrada-izquierda" aria-label="Zona de gestión del viaje"><div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"><div><p className="small text-uppercase fw-semibold mb-2" style={{ color: "#B02A37", letterSpacing: "0.14em" }}>Zona de gestión</p><p className="mb-0" style={{ color: "#6B8991" }}>Eliminar este viaje y sus actividades guardadas.</p></div><button type="button" onClick={() => setModalEliminacionAbierto(true)} disabled={guardando} className="btn btn-outline-danger rounded-0 px-4 py-2">Eliminar viaje</button></div></section>
				<ModalConfirmacionEliminacion visible={modalEliminacionAbierto} cargando={guardando} alCancelar={() => setModalEliminacionAbierto(false)} alConfirmar={eliminarViaje} />
			</div>
		</main>
	);
};
