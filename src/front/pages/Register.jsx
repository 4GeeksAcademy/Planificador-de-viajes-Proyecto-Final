import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSplitEntrance } from "../animaciones/useSplitEntrance";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";

const validarDatosPersonalesRegistro = (nombre, apellido) => {
	if (!nombre.trim() || !apellido.trim()) {
		return "El nombre y el apellido son obligatorios.";
	}

	return "";
};

const estiloTitulo = {
	fontFamily: "Fraunces, Georgia, serif",
	fontWeight: 600,
	color: "#FFFFFF",
};

const estiloEtiqueta = {
	color: "#28C3D4",
	letterSpacing: "0.14em",
	fontSize: "0.75rem",
};

const estiloInput = {
	border: "1px solid #B8DCE3",
	borderRadius: 0,
	color: "#12343B",
	padding: "0.75rem 0.9rem",
};

export const Register = () => {
	const navigate = useNavigate();
	const [formulario, setFormulario] = useState({
		first_name: "",
		last_name: "",
		username: "",
		email: "",
		password: "",
	});
	const [aceptaTerminos, setAceptaTerminos] = useState(false);
	const [cargando, setCargando] = useState(false);
	const [error, setError] = useState("");
	const [exito, setExito] = useState("");
	const layourRef = useRef(null)

	useSplitEntrance(layourRef)

	const manejarCambio = (event) => {
		const { name, value } = event.target;
		setFormulario((actual) => ({ ...actual, [name]: value }));
	};

	const manejarEnvio = async (event) => {
		event.preventDefault();
		setError("");
		setExito("");

		const errorDatosPersonales = validarDatosPersonalesRegistro(
			formulario.first_name,
			formulario.last_name
		);
		if (errorDatosPersonales) {
			setError(errorDatosPersonales);
			return;
		}

		if (!aceptaTerminos) {
			setError("Debes aceptar los términos de uso para crear tu cuenta.");
			return;
		}

		setCargando(true);

		try {
			const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formulario),
			});

			const datos = await respuesta.json();

			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible crear la cuenta."));
			}

			setExito(datos.message || "Cuenta creada exitosamente.");
			setTimeout(() => navigate("/login"), 1200);
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
		} finally {
			setCargando(false);
		}
	};

	return (
		<main className="min-vh-100 d-flex align-items-center py-5" style={{ backgroundColor: "#EAF7FA" }}>
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-lg-10 col-xl-9">
						<div className="row g-0 shadow-sm" ref={layourRef}>
							{/* Formulario de Register */}
							<section className="col-lg-7 p-4 p-lg-5 split-left" style={{ backgroundColor: "#12343B" }}>
								<p className="mb-2 text-uppercase fw-semibold" style={estiloEtiqueta}>
									Empieza a planificar
								</p>
								<h1 className="display-6 mb-3" style={estiloTitulo}>
									Crea tu cuenta
								</h1>
								<p className="mb-4" style={{ color: "#D4F0F5", lineHeight: 1.6 }}>
									Guarda tus destinos, actividades y lugares favoritos.
								</p>

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

								<form onSubmit={manejarEnvio}>
									<div className="row g-3">
										<div className="col-md-6">
											<div className="mb-3">
												<label htmlFor="register-first-name" className="form-label small fw-semibold" style={{ color: "#EAF7FA" }}>
													Nombre
												</label>
												<input
													id="register-first-name"
													name="first_name"
													type="text"
													required
													value={formulario.first_name}
													onChange={manejarCambio}
													className="form-control"
													placeholder="Tu nombre"
													style={estiloInput}
												/>
											</div>
										</div>
										<div className="col-md-6">
											<div className="mb-3">
												<label htmlFor="register-last-name" className="form-label small fw-semibold" style={{ color: "#EAF7FA" }}>
													Apellido
												</label>
												<input
													id="register-last-name"
													name="last_name"
													type="text"
													required
													value={formulario.last_name}
													onChange={manejarCambio}
													className="form-control"
													placeholder="Tu apellido"
													style={estiloInput}
												/>
											</div>
										</div>
									</div>
									<div className="mb-3">
										<label htmlFor="register-username" className="form-label small fw-semibold" style={{ color: "#EAF7FA" }}>
											Nombre de usuario
										</label>
										<input
											id="register-username"
											name="username"
											type="text"
											required
											value={formulario.username}
											onChange={manejarCambio}
											className="form-control"
											placeholder="Elige un nombre de usuario"
											style={estiloInput}
										/>
									</div>
									<div className="mb-3">
										<label htmlFor="register-email" className="form-label small fw-semibold" style={{ color: "#EAF7FA" }}>
											Correo electrónico
										</label>
										<input
											id="register-email"
											name="email"
											type="email"
											required
											value={formulario.email}
											onChange={manejarCambio}
											className="form-control"
											placeholder="tu@email.com"
											style={estiloInput}
										/>
									</div>
									<div className="mb-3">
										<label htmlFor="register-password" className="form-label small fw-semibold" style={{ color: "#EAF7FA" }}>
											Contraseña
										</label>
										<input
											id="register-password"
											name="password"
											type="password"
											required
											minLength="8"
											value={formulario.password}
											onChange={manejarCambio}
											className="form-control"
											placeholder="Crea una contraseña segura"
											style={estiloInput}
										/>
									</div>
									<div className="form-check mb-4">
										<input
											id="accept-terms"
											type="checkbox"
											checked={aceptaTerminos}
											onChange={(event) => setAceptaTerminos(event.target.checked)}
											className="form-check-input"
										/>
										<label htmlFor="accept-terms" className="form-check-label small" style={{ color: "#D4F0F5" }}>
											Acepto los términos de uso de Viajero.
										</label>
									</div>
									<button
										type="submit"
										className="btn w-100 py-3"
										disabled={cargando}
										style={{ backgroundColor: "#28C3D4", color: "#12343B", borderRadius: 0 }}
									>
										{cargando ? "Creando cuenta..." : "Crear mi cuenta"}
									</button>
								</form>

								<p className="small text-center mt-4 mb-0" style={{ color: "#D4F0F5" }}>
									¿Ya tienes una cuenta?{" "}
									<Link to="/login" className="text-decoration-none" style={{ color: "#28C3D4" }}>
										Inicia sesión
									</Link>
								</p>
							</section>

							{/* Mensaje de apoyo */}
							<section className="col-lg-5 d-none d-lg-flex align-items-center p-5 split-right" style={{ backgroundColor: "#FFFFFF" }}>
								<div className="p-4" style={{ borderLeft: "3px solid #28C3D4" }}>
									<p className="mb-2 text-uppercase fw-semibold" style={{ ...estiloEtiqueta, color: "#078A9A" }}>
										Tu próximo viaje
									</p>
									<h2 className="h1 mb-3" style={{ ...estiloTitulo, color: "#12343B" }}>
										Convierte una idea en un itinerario.
									</h2>
									<p className="mb-0" style={{ color: "#456B75", lineHeight: 1.7 }}>
										Crea tu espacio y ten tu aventura organizada en un solo lugar.
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