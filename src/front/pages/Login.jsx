import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";
import { useSplitEntrance } from "../animaciones/useSplitEntrance";

const estiloTitulo = {
	fontFamily: "Fraunces, Georgia, serif",
	fontWeight: 600,
	color: "#12343B"
};

const estiloEtiqueta = {
	color: "#078A9A",
	letterSpacing: "0.14em",
	fontSize: "0.75rem"
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
	const [cargando, setCargando] = useState(false);
	const [error, setError] = useState("");
	const layoutRef = useRef(null)

	const manejarCambio = (event) => {
		const { name, value } = event.target;
		setFormulario((actual) => ({ ...actual, [name]: value }));
	};

	const manejarEnvio = async (event) => {
		event.preventDefault();
		setCargando(true);
		setError("");

		try {
			const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formulario)
			});

			const datos = await respuesta.json();

			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible iniciar sesión."));
			}

			localStorage.setItem("token", datos.token);
			localStorage.setItem("user", JSON.stringify(datos.user));
			window.dispatchEvent(new Event("sesion-cambiada"));
			navigate("/");
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
		} finally {
			setCargando(false);
		}
	};

	useSplitEntrance(layoutRef)

	return (
		<main className="min-vh-100 d-flex align-items-center py-5" style={{ backgroundColor: "#EAF7FA" }}>
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-lg-10 col-xl-9">
						<div className="row g-0 shadow-sm" ref={layoutRef}>
							{/* Formulario de Login */}
							<section className="col-lg-6 p-4 p-lg-5 split-left" style={{ backgroundColor: "#FFFFFF" }}>
								<p className="mb-2 text-uppercase fw-semibold" style={estiloEtiqueta}>
									Bienvenido de nuevo
								</p>
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
										<input
											id="login-password"
											name="password"
											type="password"
											required
											value={formulario.password}
											onChange={manejarCambio}
											className="form-control"
											placeholder="Escribe tu contraseña"
											style={estiloInput}
										/>
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

							{/* Mensaje de apoyo */}
							<section className="col-lg-6 d-none d-lg-flex align-items-center p-5 split-right" style={{ backgroundColor: "#12343B" }}>
								<div className="p-4" style={{ borderLeft: "3px solid #28C3D4" }}>
									<p className="mb-2 text-uppercase fw-semibold" style={{ ...estiloEtiqueta, color: "#28C3D4" }}>
										Viajero
									</p>
									<h2 className="h1 mb-3" style={{ ...estiloTitulo, color: "#FFFFFF" }}>
										Menos pasos, más lugares por descubrir.
									</h2>
									<p className="mb-0" style={{ color: "#D4F0F5", lineHeight: 1.7 }}>
										Recupera tus itinerarios y continúa planificando desde cualquier lugar.
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