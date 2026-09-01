import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	obtenerFechaMinimaViaje,
	validarFechasViaje,
	validarFechaInicioViaje,
} from "../utils/viajes.mjs";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";

const estiloTitulo = {
	fontFamily: "Fraunces, Georgia, serif",
	fontWeight: 600,
	color: "#12343B",
};

const estiloInput = {
	border: "1px solid #B8DCE3",
	borderRadius: 0,
	color: "#12343B",
	padding: "0.75rem 0.9rem",
};

export const CrearViaje = () => {
	const navigate = useNavigate();
	const [formulario, setFormulario] = useState({
		name: "",
		start_date: "",
		end_date: "",
	});
	const [cargando, setCargando] = useState(false);
	const [error, setError] = useState("");
	const [exito, setExito] = useState("");
	const fechaMinima = obtenerFechaMinimaViaje(new Date());

	const manejarCambio = (event) => {
		const { name, value } = event.target;
		setFormulario((actual) => ({ ...actual, [name]: value }));
	};

	const manejarEnvio = async (event) => {
		event.preventDefault();
		setError("");
		setExito("");

		const errorFechaInicio = validarFechaInicioViaje(
			formulario.start_date,
			fechaMinima
		);
		if (errorFechaInicio) {
			setError(errorFechaInicio);
			return;
		}

		const errorFechas = validarFechasViaje(formulario.start_date, formulario.end_date);
		if (errorFechas) {
			setError(errorFechas);
			return;
		}

		const token = localStorage.getItem("token");
		if (!token) {
			setError("Debes iniciar sesión para crear un viaje.");
			return;
		}

		setCargando(true);

		try {
			const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formulario),
			});
			const datos = await respuesta.json();

			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible crear el viaje."));
			}
			
			setExito("Tu viaje fue creado correctamente. Redirigiendo...");
			setFormulario({ name: "", start_date: "", end_date: "" });

			// Evaluar la respuesta del backend para capturar el ID del viaje
			if (datos.id || (datos.trip && datos.trip.id)) {
				const viajeId = datos.id || datos.trip.id;
				// Redirigir dinámicamente a la vista detallada del viaje creado
				setTimeout(() => {
					navigate(`/viaje/${viajeId}`);
				}, 1500);
			} else {
				// Respaldo de navegación en caso de que la API no devuelva un ID
				setTimeout(() => {
					navigate("/");
				}, 1500);
			}

		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
		} finally {
			setCargando(false);
		}
	};

	return (
		<main
			className="min-vh-100 d-flex align-items-center py-5"
			style={{ backgroundColor: "#EAF7FA" }}
		>
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-lg-10 col-xl-9">
						<div className="row g-0 shadow-sm">
							{/* Formulario de viaje */}
							<section
								className="col-lg-7 p-4 p-lg-5"
								style={{ backgroundColor: "#FFFFFF" }}
							>
								<p
									className="mb-2 text-uppercase fw-semibold"
									style={{
										color: "#078A9A",
										letterSpacing: "0.14em",
										fontSize: "0.75rem",
									}}
								>
									Tu próxima aventura
								</p>
								<h1
									className="display-6 mb-3"
									style={estiloTitulo}
								>
									Crea un viaje
								</h1>
								<p
									className="mb-4"
									style={{ color: "#456B75", lineHeight: 1.6 }}
								>
									Define lo esencial y luego podrás añadir destinos, actividades y lugares.
								</p>

								{error && (
									<div
										className="alert alert-danger rounded-0"
										role="alert"
									>
										{error}
									</div>
								)}
								{exito && (
									<div
										className="alert alert-success rounded-0"
										role="status"
									>
										{exito}
									</div>
								)}

								<form onSubmit={manejarEnvio}>
									<div className="mb-3">
										<label
											htmlFor="trip-name"
											className="form-label small fw-semibold"
											style={{ color: "#12343B" }}
										>
											Nombre del viaje
										</label>
										<input
											id="trip-name"
											name="name"
											type="text"
											required
											value={formulario.name}
											onChange={manejarCambio}
											className="form-control"
											placeholder="Ej. Vacaciones en Valparaíso"
											style={estiloInput}
										/>
									</div>
									<div className="row g-3">
										<div className="col-md-6">
											<div className="mb-4">
												<label
													htmlFor="trip-start-date"
													className="form-label small fw-semibold"
													style={{ color: "#12343B" }}
												>
													Fecha de inicio
												</label>
												<input
													id="trip-start-date"
													name="start_date"
													type="date"
													required
													min={fechaMinima}
													value={formulario.start_date}
													onChange={manejarCambio}
													className="form-control"
													style={estiloInput}
												/>
											</div>
										</div>
										<div className="col-md-6">
											<div className="mb-4">
												<label
													htmlFor="trip-end-date"
													className="form-label small fw-semibold"
													style={{ color: "#12343B" }}
												>
													Fecha de regreso
												</label>
												<input
													id="trip-end-date"
													name="end_date"
													type="date"
													required
													min={formulario.start_date || fechaMinima}
													value={formulario.end_date}
													onChange={manejarCambio}
													className="form-control"
													style={estiloInput}
												/>
											</div>
										</div>
									</div>
									<button
										type="submit"
										className="btn w-100 py-3"
										disabled={cargando}
										style={{
											backgroundColor: "#12343B",
											color: "#FFFFFF",
											borderRadius: 0,
										}}
									>
										{cargando ? "Creando viaje..." : "Crear viaje"}
									</button>
								</form>

								<p
									className="small text-center mt-4 mb-0"
									style={{ color: "#456B75" }}
								>
									¿Quieres volver a explorar?{" "}
									<Link
										to="/"
										className="text-decoration-none"
										style={{ color: "#078A9A" }}
									>
										Volver al inicio
									</Link>
								</p>
							</section>

							{/* Mensaje de apoyo */}
							<section
								className="col-lg-5 d-none d-lg-flex align-items-center p-5"
								style={{ backgroundColor: "#12343B" }}
							>
								<div
									className="p-4"
									style={{ borderLeft: "3px solid #28C3D4" }}
								>
									<p
										className="mb-2 text-uppercase fw-semibold"
										style={{
											color: "#28C3D4",
											letterSpacing: "0.14em",
											fontSize: "0.75rem",
										}}
									>
										Un itinerario a tu medida
									</p>
									<h2
										className="h1 mb-3"
										style={{ ...estiloTitulo, color: "#FFFFFF" }}
									>
										Comienza con una fecha y una idea.
									</h2>
									<p
										className="mb-0"
										style={{ color: "#D4F0F5", lineHeight: 1.7 }}
									>
										Después podrás convertir ese plan en una experiencia memorable.
									</p>
								</div>
							</section>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
};
