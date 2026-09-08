import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";

const estadoInicial = {
	cargando: true,
	verificado: false,
	mensaje: "",
};

export const VerificarEmail = () => {
	const { token } = useParams();
	const [estado, setEstado] = useState(estadoInicial);

	useEffect(() => {
		let componenteActivo = true;

		const verificarCorreo = async () => {
			if (!token) {
				setEstado({
					cargando: false,
					verificado: false,
					mensaje: "El enlace de verificación no contiene un token válido.",
				});
				return;
			}

			try {
				const respuesta = await fetch(
					`${import.meta.env.VITE_BACKEND_URL}/api/verify-email/${encodeURIComponent(token)}`
				);
				const datos = await respuesta.json();

				if (!componenteActivo) return;

				if (!respuesta.ok) {
					setEstado({
						cargando: false,
						verificado: false,
						mensaje: obtenerMensajeErrorBackend(
							datos,
							"No fue posible verificar tu correo. El enlace puede haber expirado."
						),
					});
					return;
				}

				setEstado({
					cargando: false,
					verificado: true,
					mensaje: datos.message || "Tu correo fue verificado correctamente.",
				});
			} catch {
				if (!componenteActivo) return;

				setEstado({
					cargando: false,
					verificado: false,
					mensaje: "No fue posible conectar con el servidor.",
				});
			}
		};

		verificarCorreo();

		return () => {
			componenteActivo = false;
		};
	}, [token]);

	return (
		<main
			className="min-vh-100 d-flex align-items-center py-5"
			style={{ backgroundColor: "#EAF7FA" }}
		>
			<div className="container">
				<div className="row justify-content-center">
					<section className="col-12 col-md-8 col-lg-6">
						<div className="bg-white p-4 p-md-5 shadow-sm text-center">
							<p
								className="mb-2 text-uppercase fw-semibold"
								style={{
									color: "#078A9A",
									letterSpacing: "0.14em",
									fontSize: "0.75rem",
								}}
							>
								Verificación de cuenta
							</p>
							<h1
								className="h2 mb-3"
								style={{ fontFamily: "Fraunces, Georgia, serif", color: "#12343B" }}
							>
								{estado.cargando
									? "Verificando tu correo..."
									: estado.verificado
										? "Correo verificado"
										: "No pudimos verificar tu correo"}
							</h1>

							{estado.cargando ? (
								<div className="d-flex justify-content-center" role="status" aria-label="Cargando">
									<div className="spinner-border" style={{ color: "#078A9A" }} />
								</div>
							) : (
								<>
									<div
										className={`alert ${estado.verificado ? "alert-success" : "alert-danger"} rounded-0`}
										role={estado.verificado ? "status" : "alert"}
									>
										{estado.mensaje}
									</div>
									<Link
										to="/login"
										className="btn px-4 py-2"
										style={{ backgroundColor: "#28C3D4", color: "#12343B", borderRadius: 0 }}
									>
										Ir al inicio de sesión
									</Link>
								</>
							)}
						</div>
					</section>
				</div>
			</div>
		</main>
	);
};
