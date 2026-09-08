import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchConSesion } from "../utils/sesion.mjs";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";

const metricasIniciales = { users: 0, trips: 0, places: 0, favorites: 0 };
const etiquetasMetricas = [
	{ key: "users", label: "Usuarios", icon: "fa-users" },
	{ key: "trips", label: "Viajes", icon: "fa-route" },
	{ key: "places", label: "Lugares", icon: "fa-location-dot" },
	{ key: "favorites", label: "Favoritos", icon: "fa-heart" },
];

const formatoFecha = (fecha) => {
	if (!fecha) return "Sin fecha";
	return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(fecha));
};

const normalizarUsuario = (usuario) => ({
	...usuario,
	email: usuario.email || "",
	is_active: Boolean(usuario.is_active),
	is_verified: Boolean(usuario.is_verified),
});

export const Admin = () => {
	const [metricas, setMetricas] = useState(metricasIniciales);
	const [usuarios, setUsuarios] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [guardandoId, setGuardandoId] = useState(null);
	const [eliminandoId, setEliminandoId] = useState(null);
	const [confirmandoEliminacionId, setConfirmandoEliminacionId] = useState(null);
	const [error, setError] = useState("");
	const [mensaje, setMensaje] = useState("");

	const cargarDatos = async () => {
		setCargando(true);
		setError("");
		try {
			const [resumen, respuestaUsuarios] = await Promise.all([
				fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/admin/summary`),
				fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users`),
			]);
			const datosResumen = await resumen.json().catch(() => ({}));
			const datosUsuarios = await respuestaUsuarios.json().catch(() => ({}));
			if (!resumen.ok) {
				throw new Error(obtenerMensajeErrorBackend(datosResumen, "No fue posible cargar el resumen."));
			}
			if (!respuestaUsuarios.ok) {
				throw new Error(obtenerMensajeErrorBackend(datosUsuarios, "No fue posible cargar los usuarios."));
			}
			setMetricas(datosResumen.metrics || metricasIniciales);
			setUsuarios((datosUsuarios.users || []).map(normalizarUsuario));
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargarDatos();
	}, []);

	const actualizarCampo = (id, campo, valor) => {
		setUsuarios((actuales) => actuales.map((usuario) => (
			usuario.id === id ? { ...usuario, [campo]: valor } : usuario
		)));
	};

	const guardarUsuario = async (usuario) => {
		setGuardandoId(usuario.id);
		setError("");
		setMensaje("");
		try {
			const respuesta = await fetchConSesion(
				`${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${usuario.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: usuario.email,
						is_active: usuario.is_active,
						is_verified: usuario.is_verified,
					}),
				}
			);
			const datos = await respuesta.json().catch(() => ({}));
			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible actualizar el usuario."));
			}
			setUsuarios((actuales) => actuales.map((actual) => (
				actual.id === usuario.id ? normalizarUsuario(datos.user) : actual
			)));
			setMensaje("Usuario actualizado correctamente.");
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
		} finally {
			setGuardandoId(null);
		}
	};

	const eliminarUsuario = async (usuario) => {
		setEliminandoId(usuario.id);
		setError("");
		setMensaje("");
		try {
			const respuesta = await fetchConSesion(
				`${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${usuario.id}`,
				{ method: "DELETE" }
			);
			const datos = await respuesta.json().catch(() => ({}));
			if (!respuesta.ok) {
				throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible eliminar el usuario."));
			}
			setUsuarios((actuales) => actuales.filter((actual) => actual.id !== usuario.id));
			setMetricas((actuales) => ({ ...actuales, users: Math.max(0, actuales.users - 1) }));
			setConfirmandoEliminacionId(null);
			setMensaje("Usuario eliminado correctamente.");
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible conectar con el servidor.");
		} finally {
			setEliminandoId(null);
		}
	};

	return (
		<main className="min-vh-100 py-5" style={{ backgroundColor: "#EAF7FA" }}>
			<div className="container">
				<div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-5">
					<div>
						<h1 className="display-5 mb-2" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif", fontWeight: 600 }}>
							Administrar usuarios
						</h1>
						<p className="mb-0" style={{ color: "#456B75" }}>Edita cuentas y revisa la actividad de la plataforma.</p>
					</div>
					<Link to="/" className="btn rounded-0 px-4" style={{ color: "#12343B", border: "1px solid #12343B" }}>
						Volver al sitio
					</Link>
				</div>

				{error && <div className="alert alert-danger rounded-0" role="alert">{error}</div>}
				{mensaje && <div className="alert alert-success rounded-0" role="status">{mensaje}</div>}

				<section className="row g-3 mb-5" aria-label="Métricas principales">
					{etiquetasMetricas.map((metrica) => (
						<div className="col-6 col-lg-3" key={metrica.key}>
							<div className="h-100 p-4" style={{ backgroundColor: "#FFFFFF", borderTop: "3px solid #28C3D4" }}>
								<div className="d-flex justify-content-between align-items-start mb-4">
									<span className="small text-uppercase fw-semibold" style={{ color: "#456B75", letterSpacing: "0.1em" }}>{metrica.label}</span>
									<i className={`fa-solid ${metrica.icon}`} style={{ color: "#078A9A" }} aria-hidden="true" />
								</div>
								<strong className="display-6" style={{ color: "#12343B" }}>{metricas[metrica.key]}</strong>
							</div>
						</div>
					))}
				</section>

				<section className="p-4 p-lg-5" style={{ backgroundColor: "#FFFFFF" }}>
					<div className="d-flex justify-content-between align-items-center gap-3 mb-4">
						<h2 className="h3 mb-0" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif" }}>Usuarios</h2>
						<span className="badge rounded-0 px-3 py-2" style={{ backgroundColor: "#D4F0F5", color: "#12343B" }}>{usuarios.length} registrados</span>
					</div>
					{cargando ? <p style={{ color: "#456B75" }}>Cargando usuarios...</p> : (
						<div className="table-responsive">
							<table className="table align-middle mb-0">
								<thead>
									<tr><th>Usuario</th><th>Correo</th><th>Activo</th><th>Verificado</th><th>Registro</th><th style={{ width: "205px", minWidth: "205px" }}>Acciones</th></tr>
								</thead>
								<tbody>
									{usuarios.map((usuario) => (
										<tr key={usuario.id}>
											<td className="fw-semibold" style={{ color: "#12343B" }}>{usuario.username}</td>
											<td><input className="form-control rounded-0" type="email" value={usuario.email} onChange={(event) => actualizarCampo(usuario.id, "email", event.target.value)} /></td>
											<td><input className="form-check-input" type="checkbox" checked={usuario.is_active} onChange={(event) => actualizarCampo(usuario.id, "is_active", event.target.checked)} aria-label={`Activo: ${usuario.username}`} /></td>
											<td><input className="form-check-input" type="checkbox" checked={usuario.is_verified} onChange={(event) => actualizarCampo(usuario.id, "is_verified", event.target.checked)} aria-label={`Verificado: ${usuario.username}`} /></td>
											<td style={{ color: "#456B75" }}>{formatoFecha(usuario.created_at)}</td>
											<td style={{ width: "205px", minWidth: "205px" }}>
												<div className="d-flex flex-wrap gap-2">
													{confirmandoEliminacionId === usuario.id ? (
														eliminandoId === usuario.id ? <span className="small align-self-center" style={{ color: "#B02A37" }}>Eliminando...</span> : (
															<>
																<button type="button" className="btn btn-sm rounded-0" onClick={() => eliminarUsuario(usuario)} disabled={guardandoId === usuario.id} style={{ backgroundColor: "#B02A37", color: "#FFFFFF" }}>Confirmar</button>
																<button type="button" className="btn btn-sm rounded-0" onClick={() => setConfirmandoEliminacionId(null)} disabled={guardandoId === usuario.id} style={{ color: "#456B75", border: "1px solid #B8DCE3" }}>Cancelar</button>
															</>
														)
													) : (
														<>
															<button type="button" className="btn btn-sm rounded-0" onClick={() => guardarUsuario(usuario)} disabled={guardandoId === usuario.id || eliminandoId === usuario.id} style={{ backgroundColor: "#12343B", color: "#FFFFFF" }}>{guardandoId === usuario.id ? "Guardando..." : "Guardar"}</button>
															<button type="button" className="btn btn-sm rounded-0" onClick={() => setConfirmandoEliminacionId(usuario.id)} disabled={guardandoId === usuario.id} style={{ color: "#B02A37", border: "1px solid #B02A37" }}>Eliminar</button>
														</>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			</div>
		</main>
	);
};
