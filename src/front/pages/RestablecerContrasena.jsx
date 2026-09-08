import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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

export const RestablecerContrasena = () => {
	const { token } = useParams();
	const [nuevaContrasena, setNuevaContrasena] = useState("");
	const [confirmacion, setConfirmacion] = useState("");
	const [cargando, setCargando] = useState(false);
	const [error, setError] = useState("");
	const [mensaje, setMensaje] = useState("");

	const manejarEnvio = async (evento) => {
		evento.preventDefault();
		setError("");
		setMensaje("");

		if (nuevaContrasena !== confirmacion) {
			setError("Las contraseñas no coinciden.");
			return;
		}

		setCargando(true);
		try {
			const respuesta = await fetch(
				`${import.meta.env.VITE_BACKEND_URL}/api/reset-password/${encodeURIComponent(token)}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ new_password: nuevaContrasena }),
				},
			);
			const datos = await respuesta.json().catch(() => ({}));
			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible cambiar la contraseña."));
			}
			setMensaje(datos.message || "Contraseña actualizada correctamente.");
			setNuevaContrasena("");
			setConfirmacion("");
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
					<section className="col-12 col-md-8 col-lg-6">
						<div className="bg-white p-4 p-md-5 shadow-sm">
							<h1 className="display-6 mb-3" style={estiloTitulo}>Establece una nueva contraseña</h1>
							<p className="mb-4" style={{ color: "#456B75", lineHeight: 1.6 }}>
								Confirma tu nueva contraseña para recuperar el acceso a tu cuenta.
							</p>

							{error && <div className="alert alert-danger rounded-0" role="alert">{error}</div>}
							{mensaje && <div className="alert alert-success rounded-0" role="status">{mensaje}</div>}

							<form onSubmit={manejarEnvio}>
								<div className="mb-3">
									<label htmlFor="reset-new-password" className="form-label small fw-semibold" style={{ color: "#12343B" }}>
										Nueva contraseña
									</label>
									<input id="reset-new-password" type="password" required minLength="6" value={nuevaContrasena} onChange={(evento) => setNuevaContrasena(evento.target.value)} className="form-control" style={estiloInput} />
								</div>
								<div className="mb-4">
									<label htmlFor="reset-confirm-password" className="form-label small fw-semibold" style={{ color: "#12343B" }}>
										Confirma tu nueva contraseña
									</label>
									<input id="reset-confirm-password" type="password" required minLength="6" value={confirmacion} onChange={(evento) => setConfirmacion(evento.target.value)} className="form-control" style={estiloInput} />
								</div>
								<button type="submit" className="btn w-100 py-3" disabled={cargando} style={{ backgroundColor: "#12343B", color: "#FFFFFF", borderRadius: 0 }}>
									{cargando ? "Guardando..." : "Guardar nueva contraseña"}
								</button>
							</form>

							<div className="text-center mt-4">
								<Link to="/login" className="small text-decoration-none" style={{ color: "#078A9A" }}>Volver al login</Link>
							</div>
						</div>
					</section>
				</div>
			</div>
		</main>
	);
};
