import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";
import { useSplitEntrance } from "../animaciones/useSplitEntrance";

const estiloTitulo = {
	fontFamily: "Fraunces, Georgia, serif",
	fontWeight: 600,
	color: "#12343B"
};

const estiloInput = {
	border: "1px solid #B8DCE3",
	borderRadius: 0,
	color: "#12343B",
	padding: "0.75rem 0.9rem"
};

export const Login = () => {
	const navigate = useNavigate();
	const [formulario, setFormulario] = useState({ identifier: "", password: "" });
	const [mostrarPassword, setMostrarPassword] = useState(false);
	const [cargando, setCargando] = useState(false);
	const [error, setError] = useState("");
	const [mensaje, setMensaje] = useState("");
	const [emailPendienteVerificacion, setEmailPendienteVerificacion] = useState("");
	const [reenviandoVerificacion, setReenviandoVerificacion] = useState(false);
	const layoutRef = useRef(null);

	const manejarCambio = (event) => {
		const { name, value } = event.target;
		setFormulario((actual) => ({ ...actual, [name]: value }));
	};

	const manejarEnvio = async (event) => {
		event.preventDefault();
		setCargando(true);
		setError("");
		setMensaje("");
		setEmailPendienteVerificacion("");

		try {
			const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formulario)
			});

			const datos = await respuesta.json();

			if (!respuesta.ok) {
				if (datos.requires_verification && datos.email) {
					setEmailPendienteVerificacion(datos.email);
				}
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible iniciar sesión."));
			}

			localStorage.setItem("token", datos.token);
			localStorage.setItem("refresh_token", datos.refresh_token);
			localStorage.setItem("user", JSON.stringify(datos.user));
			window.dispatchEvent(new Event("sesion-cambiada"));
			navigate("/");
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
		} finally {
			setCargando(false);
		}
	};

	const reenviarVerificacion = async () => {
		setReenviandoVerificacion(true);
		setError("");
		setMensaje("");

		try {
			const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/resend-verification`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: emailPendienteVerificacion }),
			});
			const datos = await respuesta.json().catch(() => ({}));

			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible reenviar el correo."));
			}

			setMensaje(datos.message || "Se envió un nuevo correo de verificación.");
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
		} finally {
			setReenviandoVerificacion(false);
		}
	};

	useSplitEntrance(layoutRef);

	return (
		<main className="min-vh-100 d-flex align-items-center py-5" style={{ backgroundColor: "#EAF7FA" }}>
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-12 col-md-8 col-lg-6">
						<div className="row g-0 shadow-sm" ref={layoutRef}>
							{/* Formulario de Login */}
							<section className="col-12 p-4 p-lg-5 split-left" style={{ backgroundColor: "#FFFFFF" }}>
								<h1 className="display-6 mb-3" style={estiloTitulo}>
									Inicia sesión
								</h1>
								<p className="mb-4" style={{ color: "#456B75", lineHeight: 1.6 }}>
									Continúa organizando tu próxima aventura.
								</p>

								{error && (
									<div className="alert alert-danger rounded-0" role="alert">
										{error}
									</div>
								)}
								{mensaje && (
									<div className="alert alert-success rounded-0" role="status">
										{mensaje}
									</div>
								)}
								{emailPendienteVerificacion && (
									<button
										type="button"
										className="btn btn-sm rounded-0 mb-4"
										onClick={reenviarVerificacion}
										disabled={reenviandoVerificacion}
										style={{ color: "#078A9A", border: "1px solid #078A9A" }}
									>
										{reenviandoVerificacion ? "Enviando..." : "Reenviar verificación"}
									</button>
								)}

								<form onSubmit={manejarEnvio}>
									<div className="mb-3">
										<label htmlFor="login-identifier" className="form-label small fw-semibold" style={{ color: "#12343B" }}>
											Correo o nombre de usuario
										</label>
										<input
											id="login-identifier"
											name="identifier"
											type="text"
											required
											value={formulario.identifier}
											onChange={manejarCambio}
											className="form-control"
											placeholder="tu@email.com o tu usuario"
											style={estiloInput}
										/>
									</div>
									<div className="mb-3">
										<label htmlFor="login-password" className="form-label small fw-semibold" style={{ color: "#12343B" }}>
											Contraseña
										</label>
										<div className="input-group">
											<input
												id="login-password"
												name="password"
												type={mostrarPassword ? "text" : "password"}
												required
												value={formulario.password}
												onChange={manejarCambio}
												className="form-control"
												placeholder="Escribe tu contraseña"
												style={estiloInput}
											/>
											<button
												type="button"
												className="btn"
												onClick={() => setMostrarPassword((actual) => !actual)}
												aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
												aria-pressed={mostrarPassword}
												style={{ border: "1px solid #B8DCE3", color: "#078A9A" }}
											>
												<i className={`fa-solid ${mostrarPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
											</button>
										</div>
									</div>
									<div className="d-flex justify-content-end mb-4">
										<Link
											to="/recuperacion"
											className="btn p-0 border-0 small text-decoration-none"
											style={{ color: "#078A9A" }}
										>
											¿Olvidaste tu contraseña?
										</Link>
									</div>
									<button
										type="submit"
										className="btn w-100 py-3"
										disabled={cargando}
										style={{ backgroundColor: "#12343B", color: "#FFFFFF", borderRadius: 0 }}
									>
										{cargando ? "Iniciando sesión..." : "Entrar a mi cuenta"}
									</button>
								</form>

								<p className="small text-center mt-4 mb-0" style={{ color: "#456B75" }}>
									¿Todavía no tienes una cuenta?{" "}
									<Link to="/register" className="text-decoration-none" style={{ color: "#078A9A" }}>
										Regístrate
									</Link>
								</p>
							</section>
							</div>
					</div>
				</div>
			</div>
		</main>
	);
};