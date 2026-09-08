import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { obtenerMensajeErrorBackend } from "../utils/autenticacion.mjs";
import { fetchConSesion } from "../utils/sesion.mjs";

const obtenerReferencia = (lugar) => String(lugar?.id || lugar?.place_id || "");

export const BotonFavoritoLugar = ({ lugar, ciudad, compacto = false }) => {
	const navigate = useNavigate();
	const [favorito, setFavorito] = useState(null);
	const [cargando, setCargando] = useState(false);
	const [mensaje, setMensaje] = useState("");

	useEffect(() => {
		let activa = true;
		const cargarEstado = async () => {
			setFavorito(null);
			setMensaje("");
			if (!lugar || !localStorage.getItem("token")) return;

			try {
				const respuesta = await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/favorites`);
				const datos = await respuesta.json().catch(() => []);
				if (!respuesta.ok || !Array.isArray(datos)) return;
				const encontrado = datos.find((item) => item.place?.place_ref === obtenerReferencia(lugar));
				if (activa) setFavorito(encontrado || null);
			} catch {
				if (activa) setFavorito(null);
			}
		};

		cargarEstado();
		return () => {
			activa = false;
		};
	}, [lugar]);

	const alternarFavorito = async () => {
		if (!lugar) return;
		if (!localStorage.getItem("token")) {
			navigate("/login");
			return;
		}

		setCargando(true);
		setMensaje("");
		try {
			const respuesta = favorito
				? await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/favorites/${favorito.id}`, { method: "DELETE" })
				: await fetchConSesion(`${import.meta.env.VITE_BACKEND_URL}/api/favorites`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: obtenerReferencia(lugar),
						name: lugar.name,
						city: lugar.city || ciudad?.city,
						country: lugar.country || ciudad?.country,
						category: lugar.category,
						bestFor: lugar.style?.label || lugar.category,
						address: lugar.address,
						source: lugar.source || "OpenStreetMap",
						latitude: lugar.latitude,
						longitude: lugar.longitude,
						image: lugar.image || null,
						description: lugar.description || ""
					})
				});
			const datos = await respuesta.json().catch(() => ({}));
			if (!respuesta.ok) throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible actualizar Favoritos."));

			if (favorito) {
				setFavorito(null);
				setMensaje("Quitado de Favoritos");
			} else {
				setFavorito(datos);
				setMensaje("Guardado en Favoritos");
			}
		} catch (error) {
			setMensaje(error.message || "No fue posible actualizar Favoritos.");
		} finally {
			setCargando(false);
		}
	};

	if (!lugar) return null;

	return (
		<div className={compacto ? "d-flex flex-column align-items-start gap-1" : "d-flex flex-column align-items-start gap-2"}>
			<button
				type="button"
				className={`btn ${compacto ? "btn-sm" : "px-3 py-2"} rounded-0`}
				onClick={alternarFavorito}
				disabled={cargando}
				aria-pressed={Boolean(favorito)}
				style={{ backgroundColor: favorito ? "#D4F0F5" : "#FFFFFF", color: "#12343B", border: "1px solid #B8DCE3" }}
			>
				<i className={`fa-${cargando ? "solid fa-spinner fa-spin" : favorito ? "solid fa-bookmark" : "regular fa-bookmark"} me-2`} aria-hidden="true" />
				{cargando ? "Guardando..." : favorito ? "Guardado" : "Guardar lugar"}
			</button>
			{mensaje && <small role="status" style={{ color: mensaje.includes("No fue") ? "#B02A37" : "#078A9A" }}>{mensaje}</small>}
		</div>
	);
};

BotonFavoritoLugar.propTypes = {
	lugar: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		name: PropTypes.string,
		city: PropTypes.string,
		country: PropTypes.string,
		category: PropTypes.string,
		style: PropTypes.shape({ label: PropTypes.string }),
		address: PropTypes.string,
		source: PropTypes.string,
		latitude: PropTypes.number,
		longitude: PropTypes.number,
		image: PropTypes.string,
		description: PropTypes.string
	}),
	ciudad: PropTypes.shape({
		city: PropTypes.string,
		country: PropTypes.string
	}),
	compacto: PropTypes.bool
};
