import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEntradaDesdeArriba } from "../animaciones/useEntradaDesdeArriba";
import { cerrarSesion } from "../utils/autenticacion.mjs";

export const Navbar = () => {
	const navigate = useNavigate();
	const navbarRef = useRef(null);
	const botonMenuRef = useRef(null);
	const [sesionActiva, setSesionActiva] = useState(() => Boolean(localStorage.getItem("token")));
	const [usuarioActual, setUsuarioActual] = useState(() => {
		try {
			return JSON.parse(localStorage.getItem("user") || "null");
		} catch {
			return null;
		}
	});
	const [menuAbierto, setMenuAbierto] = useState(false);

	useEntradaDesdeArriba(navbarRef, {
		delay: 0,
		opacity: 0,
		position: -96,
		tiempo: 0.65,
	});

	useEffect(() => {
		const actualizarSesion = () => {
			setSesionActiva(Boolean(localStorage.getItem("token")));
			try {
				setUsuarioActual(JSON.parse(localStorage.getItem("user") || "null"));
			} catch {
				setUsuarioActual(null);
			}
		};

		window.addEventListener("sesion-cambiada", actualizarSesion);

		return () => {
			window.removeEventListener("sesion-cambiada", actualizarSesion);
		};
	}, []);

	const cerrarMenu = useCallback(() => {
		setMenuAbierto(false);
		botonMenuRef.current?.focus();
	}, []);

	useEffect(() => {
		if (!menuAbierto) return undefined;

		const manejarTecla = (evento) => {
			if (evento.key === "Escape") cerrarMenu();
		};

		document.addEventListener("keydown", manejarTecla);
		return () => document.removeEventListener("keydown", manejarTecla);
	}, [menuAbierto, cerrarMenu]);

	const manejarCierreSesion = () => {
		cerrarSesion(localStorage);
		setSesionActiva(false);
		cerrarMenu();
		navigate("/");
	};

	return (
		<nav
			ref={navbarRef}
			className="navbar navbar-expand-lg py-3 sticky-top"
			style={{
				backgroundColor: "#12343B",
				zIndex: 1020,
				boxShadow: "0 2px 12px rgba(18, 52, 59, 0.18)",
				...(menuAbierto ? { transform: "none", opacity: 1 } : {}),
			}}
		>
			<div className="container">
				<Link
					to="/"
					className="navbar-brand"
					style={{
						color: "#EAF7FA",
						fontFamily: "Fraunces, Georgia, serif",
						fontSize: "1.8rem",
						fontWeight: 600,
					}}
				>
					Viajero
				</Link>
				<div className="d-none d-lg-flex flex-grow-1 justify-content-end">
					<ul className="navbar-nav align-items-center gap-4">
						<li className="nav-item">
							<Link
								to="/explorar"
								className="nav-link"
								style={{ color: "#D4F0F5" }}
							>
								Explorar
							</Link>
						</li>
						<li className="nav-item">
							<Link
								to="/trips"
								className="nav-link"
								style={{ color: "#D4F0F5" }}
							>
								Mis viajes
							</Link>
						</li>
						<li className="nav-item">
							<Link
 								 to="/favoritos"
 								 className="nav-link"
 								 style={{ color: "#D4F0F5" }}
									>
								<i className="fa-solid fa-bookmark me-2" aria-hidden="true" />Favoritos
							</Link>
						</li>
						<li className="nav-item dropdown">
							<button
								className="btn border-0 p-2 dropdown-toggle"
								type="button"
								data-bs-toggle="dropdown"
								aria-expanded="false"
								aria-label="Abrir opciones de usuario"
								style={{ color: "#EAF7FA" }}
							>
								<i className="fa-regular fa-user fs-5" aria-hidden="true" />
							</button>
							<ul
								className="dropdown-menu dropdown-menu-end border-0 shadow-sm mt-2 p-2"
								style={{
									backgroundColor: "#EAF7FA",
									"--bs-dropdown-link-hover-bg": "#D4F0F5",
									"--bs-dropdown-link-hover-color": "#12343B",
									"--bs-dropdown-link-active-bg": "#12343B",
									"--bs-dropdown-link-active-color": "#FFFFFF",
									borderTop: "3px solid #28C3D4",
									borderRadius: 0,
									minWidth: "12rem",
								}}
							>
								{sesionActiva ? (
									<>
										<li>
											<Link to="/perfil" className="dropdown-item">
												Mi Perfil
											</Link>
										</li>
										{usuarioActual?.is_admin && (
											<li>
												<Link to="/admin" className="dropdown-item">Panel admin</Link>
											</li>
										)}
										<li>
											<button type="button" className="dropdown-item" onClick={manejarCierreSesion}>
												Cerrar sesión
											</button>
										</li>
									</>
								) : (
									<>
										<li><Link to="/login" className="dropdown-item">Iniciar sesión</Link></li>
										<li><Link to="/register" className="dropdown-item">Registrarse</Link></li>
									</>
								)}
							</ul>
						</li>
					</ul>
				</div>
				{!menuAbierto && (
					<button
						ref={botonMenuRef}
						className="navbar-toggler d-lg-none"
						type="button"
						aria-controls="mainNavigation"
						aria-expanded={menuAbierto}
						aria-label="Abrir navegación"
						onClick={() => setMenuAbierto(true)}
						style={{
							position: "relative",
							zIndex: 1024,
							width: "3rem",
							height: "3rem",
							padding: 0,
							border: 0,
							borderRadius: 0,
							color: "#EAF7FA",
						}}
					>
						<i className="fa-solid fa-bars" aria-hidden="true" />
					</button>
				)}
				{menuAbierto && (
					<button
						type="button"
						aria-label="Cerrar menú"
						onClick={cerrarMenu}
						style={{
							position: "fixed",
							inset: 0,
							zIndex: 1021,
							width: "100%",
							padding: 0,
							background: "rgba(18, 52, 59, 0.55)",
							border: 0,
						}}
					/>
				)}
				<div
					className={`offcanvas offcanvas-end d-lg-none${menuAbierto ? " show" : ""}`}
					id="mainNavigation"
					aria-labelledby="mainNavigationTitle"
					aria-hidden={!menuAbierto}
					style={{
						"--bs-offcanvas-width": "min(15rem, 70vw)",
						paddingLeft: "1rem",
						paddingRight: "1rem",
						backgroundColor: "#12343B",
						boxShadow: "-0.75rem 0 2rem rgba(18, 52, 59, 0.22)",
					}}
				>
					<h2 id="mainNavigationTitle" className="visually-hidden">
						Navegación principal
					</h2>
					<button
						type="button"
						aria-label="Cerrar navegación"
						onClick={cerrarMenu}
						style={{
							display: "grid",
							placeItems: "center",
							width: "3rem",
							height: "3rem",
							marginLeft: "auto",
							marginRight: "0.25rem",
							marginTop: "0.5rem",
							marginBottom: "0.75rem",
							padding: 0,
							background: "transparent",
							border: 0,
							borderRadius: 0,
							color: "#EAF7FA",
							fontSize: "1.35rem",
						}}
					>
						<i className="fa-solid fa-xmark" aria-hidden="true" />
					</button>
					<ul className="navbar-nav w-100 align-items-stretch gap-0">
						<li
							className="nav-item"
							style={{ borderTop: "1px solid rgba(212, 240, 245, 0.18)" }}
						>
							<Link
								to="/explorar"
								className="nav-link w-100 py-3 px-1 text-start"
							onClick={cerrarMenu}
								style={{ color: "#D4F0F5" }}
							>
								Explorar
							</Link>
						</li>
						<li
							className="nav-item"
							style={{ borderTop: "1px solid rgba(212, 240, 245, 0.18)" }}
						>
							<Link
								to="/trips"
								className="nav-link w-100 py-3 px-1 text-start"
							onClick={cerrarMenu}
								style={{ color: "#D4F0F5" }}
							>
								Mis viajes
							</Link>
						</li>
						<li
							className="nav-item"
							style={{ borderTop: "1px solid rgba(212, 240, 245, 0.18)" }}
						>
							<Link
								to="/favoritos"
								className="nav-link w-100 py-3 px-1 text-start"
								onClick={cerrarMenu}
								style={{ color: "#D4F0F5" }}
							>
								Favoritos
							</Link>
						</li>
						<li
							className="nav-item dropdown"
							style={{ borderTop: "1px solid rgba(212, 240, 245, 0.18)" }}
						>
							<button
								className="btn border-0 w-100 py-3 px-1 text-start dropdown-toggle"
								type="button"
								data-bs-toggle="dropdown"
								aria-expanded="false"
								aria-label="Abrir opciones de usuario"
								style={{ color: "#EAF7FA" }}
							>
								<i
									className="fa-regular fa-user fs-5"
									aria-hidden="true"
								/>
							</button>
							<ul
								className="dropdown-menu dropdown-menu-end border-0 shadow-sm mt-2 p-2"
								style={{
									backgroundColor: "#EAF7FA",
									"--bs-dropdown-link-hover-bg": "#D4F0F5",
									"--bs-dropdown-link-hover-color": "#12343B",
									"--bs-dropdown-link-active-bg": "#12343B",
									"--bs-dropdown-link-active-color": "#FFFFFF",
									borderTop: "3px solid #28C3D4",
									borderRadius: 0,
									minWidth: "12rem",
								}}
							>
								{sesionActiva ? (
									<>
										<li>
											<Link
												to="/perfil"
												className="dropdown-item"
												onClick={cerrarMenu}
											>
												Mi Perfil
											</Link>
										</li>
										{usuarioActual?.is_admin && (
											<li>
												<Link to="/admin" className="dropdown-item" onClick={cerrarMenu}>Panel admin</Link>
											</li>
										)}
										<li>
											<button
												type="button"
												className="dropdown-item"
												onClick={manejarCierreSesion}
											>
												Cerrar sesión
											</button>
										</li>
									</>
								) : (
									<>
										<li>
											<Link
												to="/login"
												className="dropdown-item"
												onClick={cerrarMenu}
											>
												Iniciar sesión
											</Link>
										</li>
										<li>
											<Link
												to="/register"
												className="dropdown-item"
												onClick={cerrarMenu}
											>
												Registrarse
											</Link>
										</li>
									</>
								)}
							</ul>
						</li>
					</ul>
				</div>
			</div>
		</nav>
	);
};
