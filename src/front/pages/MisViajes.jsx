import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DropdownSeleccion } from "../components/DropdownSeleccion";
import { TarjetaViaje } from "../components/TarjetaViaje";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";
import { ordenarViajes } from "../utils/viajes.mjs";

export const MisViajes = () => {
	const location = useLocation();
	const [viajes, setViajes] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState("");
	const [criterioOrden, setCriterioOrden] = useState("start_date");
	const [direccionOrden, setDireccionOrden] = useState("asc");

	const viajesOrdenados = useMemo(() => (
		ordenarViajes(viajes, criterioOrden, direccionOrden)
	), [viajes, criterioOrden, direccionOrden]);

	useEffect(() => {
		const cargarViajes = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Debes iniciar sesión para consultar tus viajes.");
				setCargando(false);
				return;
			}

			try {
				const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trips`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const datos = await respuesta.json();

				if (!respuesta.ok) {
					throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible cargar tus viajes."));
				}

				setViajes(datos);
			} catch (errorDeRed) {
				setError(errorDeRed.message || "No fue posible conectar con el servidor.");
			} finally {
				setCargando(false);
			}
		};

		cargarViajes();
	}, []);

	return (
		<main
			className="min-vh-100 py-5"
			style={{ backgroundColor: "#EAF7FA" }}
		>
			<div className="container">
				{/* Encabezado y controles de Mis viajes */}
				<div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-5">
					<div>
						<p
							className="text-uppercase fw-semibold mb-2"
							style={{
								color: "#078A9A",
								letterSpacing: "0.14em",
								fontSize: "0.75rem",
							}}
						>
							Tu planificación
						</p>
						<h1
							className="display-6 mb-0"
							style={{
								fontFamily: "Fraunces, Georgia, serif",
								color: "#12343B",
								fontWeight: 600,
							}}
						>
							Mis viajes
						</h1>
					</div>

					<div className="d-flex flex-wrap align-items-end gap-3">
						{viajes.length > 0 && (
							<>
								<div>
									<span
										id="trip-sort-criterion-label"
										className="d-block small fw-semibold mb-1"
										style={{ color: "#12343B" }}
									>
										Ordenar por
									</span>
									<DropdownSeleccion
										id="trip-sort-criterion"
										labelId="trip-sort-criterion-label"
										valor={criterioOrden}
										alCambiar={setCriterioOrden}
										opciones={[
											{ valor: "start_date", etiqueta: "Fecha de inicio" },
											{ valor: "name", etiqueta: "Nombre" },
										]}
									/>
								</div>
								<div>
									<span
										id="trip-sort-direction-label"
										className="d-block small fw-semibold mb-1"
										style={{ color: "#12343B" }}
									>
										Dirección
									</span>
									<DropdownSeleccion
										id="trip-sort-direction"
										labelId="trip-sort-direction-label"
										valor={direccionOrden}
										alCambiar={setDireccionOrden}
										opciones={[
											{ valor: "asc", etiqueta: "Ascendente" },
											{ valor: "desc", etiqueta: "Descendente" },
										]}
									/>
								</div>
							</>
						)}

						<Link
							to="/trips/new"
							className="btn boton-crear-viaje px-3 py-2"
						>
							Crear un nuevo viaje
						</Link>
					</div>
				</div>

				{location.state?.mensaje && (
					<div
						className="alert alert-success rounded-0"
						role="status"
					>
						{location.state.mensaje}
					</div>
				)}
				{cargando && <p style={{ color: "#456B75" }}>Cargando tus viajes...</p>}
				{error && (
					<div
						className="alert alert-danger rounded-0"
						role="alert"
					>
						{error}
					</div>
				)}
				{!cargando && !error && viajes.length === 0 && (
					<div
						className="p-5 text-center"
						style={{ backgroundColor: "#FFFFFF" }}
					>
						<h2
							className="h3"
							style={{
								fontFamily: "Fraunces, Georgia, serif",
								color: "#12343B",
							}}
						>
							Aún no tienes viajes.
						</h2>
						<p style={{ color: "#456B75" }}>
							Crea uno para comenzar a organizar tu próxima aventura.
						</p>
					</div>
				)}
				{!cargando && !error && viajes.length > 0 && (
					<div className="row g-4">
						{viajesOrdenados.map((viaje) => (
							<TarjetaViaje
								key={viaje.id}
								viaje={viaje}
							/>
						))}
					</div>
				)}
			</div>
		</main>
	);
};
