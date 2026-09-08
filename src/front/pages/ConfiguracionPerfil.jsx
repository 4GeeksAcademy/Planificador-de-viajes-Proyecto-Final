import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchConSesion } from "../utils/sesion.mjs";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";

const obtenerUsuarioGuardado = () => {
	try {
		return JSON.parse(localStorage.getItem("user") || "null") || {};
	} catch {
		return {};
	}
};

const CampoPerfil = ({ id, name, label, type = "text", value, onChange, required = false, placeholder }) => (
	<div>
		<label htmlFor={id} className="form-label small fw-semibold mb-2" style={{ color: "#12343B" }}>{label}</label>
		<input id={id} name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} className="form-control rounded-0 py-2" style={{ border: "1px solid #B8DCE3", color: "#12343B" }} />
	</div>
);

export const ConfiguracionPerfil = () => {
	const usuarioGuardado = useMemo(obtenerUsuarioGuardado, []);
	const [formulario, setFormulario] = useState({
		first_name: usuarioGuardado.first_name || "",
		last_name: usuarioGuardado.last_name || "",
		username: usuarioGuardado.username || "",
		email: usuarioGuardado.email || "",
	});
	const [guardado, setGuardado] = useState(false);
	const [cargando, setCargando] = useState(true);
	const [guardando, setGuardando] = useState(false);
	const [error, setError] = useState("");

	const manejarCambio = ({ target }) => {
		setGuardado(false);
		setError("");
		setFormulario((actual) => ({ ...actual, [target.name]: target.value }));
	};

	useEffect(() => {
		const cargarPerfil = async () => {
			try {
				const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/profile`);
				const datos = await respuesta.json().catch(() => ({}));
				if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible cargar tu perfil."));
				setFormulario({
					first_name: datos.user.first_name || "",
					last_name: datos.user.last_name || "",
					username: datos.user.username || "",
					email: datos.user.email || "",
				});
				localStorage.setItem("user", JSON.stringify(datos.user));
			} catch (errorDeRed) {
				setError(errorDeRed.message || "No fue posible cargar tu perfil.");
			} finally {
				setCargando(false);
			}
		};
		cargarPerfil();
	}, []);

	const manejarGuardado = async (evento) => {
		evento.preventDefault();
		setGuardando(true);
		setGuardado(false);
		setError("");
		try {
			const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formulario),
			});
			const datos = await respuesta.json().catch(() => ({}));
			if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible guardar los cambios."));
			localStorage.setItem("user", JSON.stringify(datos.user));
			window.dispatchEvent(new Event("sesion-cambiada"));
			setFormulario({
				first_name: datos.user.first_name || "",
				last_name: datos.user.last_name || "",
				username: datos.user.username || "",
				email: datos.user.email || "",
			});
			setGuardado(true);
		} catch (errorDeRed) {
			setError(errorDeRed.message || "No fue posible guardar los cambios.");
		} finally {
			setGuardando(false);
		}
	};

	return (
		<main className="min-vh-100 py-4 py-md-5" style={{ backgroundColor: "#F5FBFC" }}>
			<div className="container" style={{ maxWidth: "1120px" }}>
				{/* Cabecera de configuración */}
				<header className="d-flex justify-content-between align-items-center mb-4 pb-4" style={{ borderBottom: "1px solid #B8DCE3" }}>
					<div>
						<Link to="/perfil" className="small text-decoration-none" style={{ color: "#078A9A" }}><i className="fa-solid fa-arrow-left me-2" aria-hidden="true" />Mi perfil</Link>
						<h1 className="mb-0 mt-3" style={{ color: "#12343B", fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(2.1rem, 5vw, 3.6rem)", fontWeight: 600 }}>Configuración</h1>
					</div>
				</header>

				<div className="row g-4 g-lg-5">
					{/* Índice de configuración */}
					<aside className="col-12 col-lg-3">
						<nav aria-label="Secciones de configuración" className="sticky-lg-top" style={{ top: "2rem" }}>
							<p className="small text-uppercase fw-semibold mb-3" style={{ color: "#6B8991", letterSpacing: "0.1em" }}>Secciones</p>
							<div className="d-flex flex-column" style={{ borderLeft: "2px solid #DDECEF" }}>
								<a href="#datos" className="text-decoration-none py-2 ps-3" style={{ color: "#12343B", borderLeft: "2px solid #28C3D4", marginLeft: "-2px" }}>Datos personales</a>
								<a href="#seguridad" className="text-decoration-none py-2 ps-3" style={{ color: "#6B8991" }}>Seguridad</a>
							</div>
						</nav>
					</aside>

					{/* Hoja de trabajo */}
					<section className="col-12 col-lg-9">
						<div className="p-4 p-md-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #DDECEF" }}>
							{error && <div className="alert alert-danger rounded-0" role="alert">{error}</div>}
							{cargando ? <p style={{ color: "#6B8991" }}>Cargando perfil...</p> : (
							<form onSubmit={manejarGuardado}>
								{/* Datos personales */}
								<section id="datos" className="pb-5" style={{ scrollMarginTop: "2rem" }}>
									<div className="d-flex justify-content-between align-items-start gap-3 mb-4">
										<div><p className="mb-2 small text-uppercase fw-semibold" style={{ color: "#078A9A", letterSpacing: "0.12em" }}>Datos personales</p><h2 className="h3 mb-2" style={{ color: "#12343B", fontWeight: 600 }}>Información básica</h2><p className="mb-0" style={{ color: "#6B8991" }}>Así aparecerán tus datos dentro de la aplicación.</p></div>
										<i className="fa-regular fa-id-card fs-4" style={{ color: "#28C3D4" }} aria-hidden="true" />
									</div>
									<div className="row g-4">
										<div className="col-12 col-md-6"><CampoPerfil id="profile-first-name" name="first_name" label="Nombre" value={formulario.first_name} onChange={manejarCambio} placeholder="Tu nombre" /></div>
										<div className="col-12 col-md-6"><CampoPerfil id="profile-last-name" name="last_name" label="Apellido" value={formulario.last_name} onChange={manejarCambio} placeholder="Tu apellido" /></div>
										<div className="col-12"><CampoPerfil id="profile-username" name="username" label="Nombre de usuario" value={formulario.username} onChange={manejarCambio} required placeholder="tu-usuario" /></div>
										<div className="col-12"><CampoPerfil id="profile-email" name="email" label="Correo electrónico" type="email" value={formulario.email} onChange={manejarCambio} required placeholder="tu@email.com" /></div>
									</div>
								</section>

								{/* Seguridad */}
								<section id="seguridad" className="pt-4" style={{ borderTop: "1px solid #DDECEF", scrollMarginTop: "2rem" }}>
									<div className="d-flex justify-content-between align-items-start gap-3"><div><p className="mb-2 small text-uppercase fw-semibold" style={{ color: "#078A9A", letterSpacing: "0.12em" }}>Seguridad</p><h2 className="h4 mb-2" style={{ color: "#12343B", fontWeight: 600 }}>Contraseña</h2><p className="mb-0" style={{ color: "#6B8991" }}>Actualiza tu contraseña desde el flujo seguro de recuperación.</p></div><i className="fa-solid fa-lock fs-5" style={{ color: "#28C3D4" }} aria-hidden="true" /></div>
									<Link to="/recuperacion" className="d-inline-block text-decoration-none fw-semibold mt-3" style={{ color: "#078A9A" }}>Gestionar contraseña <i className="fa-solid fa-arrow-right ms-1" aria-hidden="true" /></Link>
								</section>

								{/* Acciones */}
								<footer className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mt-5 pt-4" style={{ borderTop: "1px solid #DDECEF" }}>
									{guardado && <span role="status" className="small" style={{ color: "#078A9A" }}><i className="fa-solid fa-check me-2" aria-hidden="true" />Cambios guardados.</span>}
									<div className="d-flex gap-2"><Link to="/perfil" className="btn px-3 py-2" style={{ color: "#12343B", border: "1px solid #B8DCE3", borderRadius: 0 }}>Cancelar</Link><button type="submit" className="btn px-3 py-2" style={{ color: "#FFFFFF", backgroundColor: "#12343B", borderRadius: 0 }}>Guardar cambios</button></div>
								</footer>
							</form>
							)}
						</div>
					</section>
				</div>
			</div>
		</main>
	);
};
