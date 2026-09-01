import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ModalConfirmacionEliminacion } from "../components/ModalConfirmacionEliminacion";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";
import { formatearFechaViaje, validarFechasViaje } from "../utils/viajes.mjs";
import React from "react";

const estiloTitulo = {
	fontFamily: "Fraunces, Georgia, serif",
	color: "#12343B",
	fontWeight: 600,
};

const estiloInput = {
	border: "1px solid #B8DCE3",
	borderRadius: 0,
	color: "#12343B",
};

export const DetalleViaje = () => {
	const { tripId } = useParams();
	const navigate = useNavigate();
	const [viaje, setViaje] = useState(null);
	const [formulario, setFormulario] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [guardando, setGuardando] = useState(false);
	const [modalEliminacionAbierto, setModalEliminacionAbierto] = useState(false);
	const [error, setError] = useState("");
	const [exito, setExito] = useState("");

	useEffect(() => {
		const cargarViaje = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Debes iniciar sesión para consultar este viaje.");
				setCargando(false);
				return;
			}

			try {
				const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const datos = await respuesta.json();

				if (!respuesta.ok) {
					throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible cargar el viaje."));
				}

				setViaje(datos);
				setFormulario(datos);
			} catch (errorDeRed) {
				setError(errorDeRed.message || "No fue posible conectar con el servidor.");
			} finally {
				setCargando(false);
			}
		};

		cargarViaje();
	}, [tripId]);

	const manejarCambio = (event) => {
		const { name, value } = event.target;
		setFormulario((actual) => ({ ...actual, [name]: value }));
	};

	const guardarCambios = async (event) => {
		event.preventDefault();
		setError("");
		setExito("");

		const errorFechas = validarFechasViaje(formulario.start_date, formulario.end_date);
		if (errorFechas) {
			setError(errorFechas);
			return;
		}

		setGuardando(true);
		try {
			const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify({
					name: formulario.name,
					start_date: formulario.start_date,
					end_date: formulario.end_date,
				}),
			});
			const datos = await respuesta.json();

			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible actualizar el viaje."));
			}

			setViaje(datos);
			setFormulario(datos);
			setExito("Los cambios se guardaron correctamente.");
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
		} finally {
			setGuardando(false);
		}
	};

	const eliminarViaje = async () => {
		setError("");
		setGuardando(true);
		try {
			const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips/${tripId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
			});
			const datos = await respuesta.json();

			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible eliminar el viaje."));
			}

			navigate("/trips", { state: { mensaje: "El viaje se eliminó correctamente." } });
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
			setGuardando(false);
		}
	};

	return (
		<main
			className="min-vh-100 py-5"
			style={{ backgroundColor: "#EAF7FA" }}
		>
			<div className="container">
				<Link
					to="/trips"
					className="text-decoration-none d-inline-block mb-4"
					style={{ color: "#078A9A" }}
				>
					← Volver a Mis viajes
				</Link>
				{cargando && <p style={{ color: "#456B75" }}>Cargando viaje...</p>}
				{error && (
					<div className="alert alert-danger rounded-0" role="alert">
						{error}
					</div>
				)}
				{exito && (
					<div className="alert alert-success rounded-0" role="status">
						{exito}
					</div>
				)}
				{viaje && formulario && (
					<section
						className="p-4 p-lg-5"
						style={{ backgroundColor: "#FFFFFF", borderTop: "3px solid #28C3D4" }}
					>
						<p
							className="text-uppercase fw-semibold mb-2"
							style={{ color: "#078A9A", letterSpacing: "0.14em", fontSize: "0.75rem" }}
						>
							Detalle del viaje
						</p>
						<h1 className="display-6 mb-4" style={estiloTitulo}>
							{viaje.name}
						</h1>

						{/* Resumen guardado */}
						<div className="row g-4 mb-5">
							<div className="col-md-6">
								<p className="small mb-1" style={{ color: "#456B75" }}>Inicio</p>
								<p className="h5 mb-0" style={{ color: "#12343B" }}>{formatearFechaViaje(viaje.start_date)}</p>
							</div>
							<div className="col-md-6">
								<p className="small mb-1" style={{ color: "#456B75" }}>Regreso</p>
								<p className="h5 mb-0" style={{ color: "#12343B" }}>{formatearFechaViaje(viaje.end_date)}</p>
							</div>
						</div>

						{/* Edición del viaje */}
						<form onSubmit={guardarCambios} className="border-top pt-4">
							<h2 className="h3 mb-4" style={estiloTitulo}>Editar viaje</h2>
							<div className="row g-3">
								<div className="col-lg-4">
									<label htmlFor="trip-name" className="form-label small fw-semibold">Nombre del viaje</label>
									<input id="trip-name" name="name" type="text" required value={formulario.name} onChange={manejarCambio} className="form-control" style={estiloInput} />
								</div>
								<div className="col-lg-4">
									<label htmlFor="trip-start-date" className="form-label small fw-semibold">Fecha de inicio</label>
									<input id="trip-start-date" name="start_date" type="date" required value={formulario.start_date || ""} onChange={manejarCambio} className="form-control" style={estiloInput} />
								</div>
								<div className="col-lg-4">
									<label htmlFor="trip-end-date" className="form-label small fw-semibold">Fecha de regreso</label>
									<input id="trip-end-date" name="end_date" type="date" required value={formulario.end_date || ""} onChange={manejarCambio} className="form-control" style={estiloInput} />
								</div>
							</div>
							<button type="submit" className="btn px-4 py-3 mt-4" disabled={guardando} style={{ backgroundColor: "#12343B", color: "#FFFFFF", borderRadius: 0 }}>
								{guardando ? "Guardando..." : "Guardar cambios"}
							</button>
						</form>

						{/* Eliminación del viaje */}
						<div className="border-top pt-4 mt-5">
							<h2 className="h3 mb-2" style={estiloTitulo}>Eliminar viaje</h2>
							<p style={{ color: "#456B75" }}>
								Esta acción elimina el viaje y no se puede deshacer.
							</p>
							<button
								type="button"
								onClick={() => setModalEliminacionAbierto(true)}
								disabled={guardando}
								className="btn btn-outline-danger rounded-0 px-4 py-3"
							>
								Eliminar viaje
							</button>
						</div>
					</section>
				)}
				<ModalConfirmacionEliminacion
					visible={modalEliminacionAbierto}
					cargando={guardando}
					alCancelar={() => setModalEliminacionAbierto(false)}
					alConfirmar={eliminarViaje}
				/>
			</div>
		</main>
	);
};
