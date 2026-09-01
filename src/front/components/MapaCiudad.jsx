import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";

const MapaCentrado = ({ ciudad = null }) => {
	const mapa = useMap();

	useEffect(() => {
		if (ciudad) {
			mapa.flyTo([ciudad.latitude, ciudad.longitude], 13, { duration: 1.2 });
		} else {
			mapa.setView([20, 0], 2);
		}
	}, [ciudad, mapa]);

	return null;
};

const MapaRedimensionable = () => {
	const mapa = useMap();

	useEffect(() => {
		let cuadroDeAnimacion = null;
		const invalidarTamano = () => {
			if (cuadroDeAnimacion !== null) {
				window.cancelAnimationFrame(cuadroDeAnimacion);
			}

			cuadroDeAnimacion = window.requestAnimationFrame(() => {
				cuadroDeAnimacion = null;
				mapa.invalidateSize({ animate: false, pan: false });
			});
		};
		const observador = typeof ResizeObserver === "undefined"
			? null
			: new ResizeObserver(invalidarTamano);

		observador?.observe(mapa.getContainer());
		window.addEventListener("resize", invalidarTamano);
		invalidarTamano();

		return () => {
			if (cuadroDeAnimacion !== null) {
				window.cancelAnimationFrame(cuadroDeAnimacion);
			}

			observador?.disconnect();
			window.removeEventListener("resize", invalidarTamano);
		};
	}, [mapa]);

	return null;
};

const crearIconoLugar = (lugar, seleccionado = false) => {
	const { color } = lugar.style;
	const size = seleccionado ? 42 : 32;
	const offset = size / 2;
	const icono = lugar.style.icon || "fa-location-dot";
	return L.divIcon({
		className: "",
		html: `<span style="align-items:center;background:${seleccionado ? "#12343B" : color};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(18,52,59,.3);color:#fff;display:flex;font-size:${seleccionado ? 17 : 14}px;height:${size}px;justify-content:center;width:${size}px"><i class="fa-solid ${icono}" aria-hidden="true"></i></span>`,
		iconAnchor: [offset, offset],
		popupAnchor: [0, -offset],
	});
};

const escaparHtml = (texto) => String(texto).replace(/[&<>'"]/g, (caracter) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"'": "&#39;",
	"\"": "&quot;",
}[caracter]));

const crearIconoCluster = (cluster) => {
	const cantidad = cluster.getChildCount();
	const size = cantidad < 10 ? 40 : 46;

	return L.divIcon({
		className: "",
		html: `<span style="align-items:center;background:#12343B;border:3px solid #28C3D4;border-radius:50%;box-shadow:0 2px 6px rgba(18,52,59,.3);color:#fff;display:flex;font-family:'DM Sans',sans-serif;font-size:${cantidad < 10 ? 0.9 : 0.8}rem;font-weight:700;height:${size}px;justify-content:center;width:${size}px">${cantidad}</span>`,
		iconSize: [size, size],
	});
};

const crearMarcador = (lugar, seleccionado, onLugarClick) => {
	const marcador = L.marker(
		[lugar.latitude, lugar.longitude],
		{ icon: crearIconoLugar(lugar, seleccionado) },
	);

	marcador.bindPopup(
		`<strong>${escaparHtml(lugar.name)}</strong><br>${escaparHtml(lugar.style.label)}<br>${escaparHtml(lugar.address)}`,
		{ autoClose: !seleccionado, closeOnClick: !seleccionado },
	);
	marcador.on("click", () => onLugarClick(lugar));

	return marcador;
};

const CapaLugares = ({ ciudad, lugares, lugarSeleccionado, onLugarClick }) => {
	const mapa = useMap();
	const capaRef = useRef(null);
	const marcadoresRef = useRef(new Map());
	const [capaLista, setCapaLista] = useState(null);
	const [mapaPreparado, setMapaPreparado] = useState(!ciudad);
	const [moviendoMapa, setMoviendoMapa] = useState(false);

	useEffect(() => {
		let activa = true;
		let capa = null;

		window.L = L;
		import("leaflet.markercluster").then(() => {
			if (!activa) return;

			capa = L.markerClusterGroup({
				chunkedLoading: true,
				chunkDelay: 25,
				chunkInterval: 100,
				iconCreateFunction: crearIconoCluster,
				maxClusterRadius: 55,
				showCoverageOnHover: false,
				spiderfyOnMaxZoom: true,
				zoomToBoundsOnClick: true,
			}).addTo(mapa);

			capaRef.current = capa;
			setCapaLista(capa);
		});

		return () => {
			activa = false;
			marcadoresRef.current.clear();
			capa?.remove();
			capaRef.current = null;
			setCapaLista(null);
		};
	}, [mapa]);

	useEffect(() => {
		if (!ciudad) {
			setMapaPreparado(true);
			return undefined;
		}

		setMapaPreparado(false);
		const alTerminarCentrado = () => setMapaPreparado(true);
		mapa.once("moveend", alTerminarCentrado);

		return () => mapa.off("moveend", alTerminarCentrado);
	}, [ciudad, mapa]);

	useEffect(() => {
		const alIniciarMovimiento = () => setMoviendoMapa(true);
		const alTerminarMovimiento = () => setMoviendoMapa(false);
		mapa.on("movestart", alIniciarMovimiento);
		mapa.on("moveend", alTerminarMovimiento);

		return () => {
			mapa.off("movestart", alIniciarMovimiento);
			mapa.off("moveend", alTerminarMovimiento);
		};
	}, [mapa]);

	useEffect(() => {
		const capa = capaLista;
		if (!capa) return undefined;

		if (!mapaPreparado) {
			capa.clearLayers();
			marcadoresRef.current.clear();
			return undefined;
		}

		if (moviendoMapa) return undefined;

		const lugaresPorId = new Map(lugares.map((lugar) => [lugar.id, lugar]));

		marcadoresRef.current.forEach((marcador, id) => {
			if (!lugaresPorId.has(id)) {
				capa.removeLayer(marcador);
				marcadoresRef.current.delete(id);
			}
		});

		lugares.forEach((lugar) => {
			const seleccionado = lugar.id === lugarSeleccionado?.id;
			const marcadorExistente = marcadoresRef.current.get(lugar.id);

			if (marcadorExistente) {
				marcadorExistente.setIcon(crearIconoLugar(lugar, seleccionado));
				return;
			}

			const marcador = crearMarcador(lugar, seleccionado, onLugarClick);
			marcadoresRef.current.set(lugar.id, marcador);
			capa.addLayer(marcador);
		});

		const marcadorSeleccionado = lugarSeleccionado
			? marcadoresRef.current.get(lugarSeleccionado.id)
			: null;

		if (marcadorSeleccionado) {
			capa.zoomToShowLayer(marcadorSeleccionado, () => marcadorSeleccionado.openPopup());
		}

		return undefined;
	}, [capaLista, lugarSeleccionado, lugares, mapaPreparado, moviendoMapa, onLugarClick]);

	return null;
};

CapaLugares.propTypes = {
	ciudad: PropTypes.shape({
		slug: PropTypes.string.isRequired,
	}),
	lugares: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		address: PropTypes.string.isRequired,
		latitude: PropTypes.number.isRequired,
		longitude: PropTypes.number.isRequired,
		style: PropTypes.shape({
			label: PropTypes.string.isRequired,
			color: PropTypes.string.isRequired,
			icon: PropTypes.string.isRequired,
		}).isRequired,
	})).isRequired,
	lugarSeleccionado: PropTypes.shape({
		id: PropTypes.string.isRequired,
	}),
	onLugarClick: PropTypes.func.isRequired,
};

const noOp = () => {};

export const MapaCiudad = ({
	ciudad = null,
	lugares,
	lugarSeleccionado = null,
	onLugarClick = noOp,
	altura = "520px",
}) => (
	<div style={{ height: altura }}>
		<MapContainer
			center={[20, 0]}
			className="w-100 h-100"
			zoom={2}
		>
			<MapaCentrado ciudad={ciudad} />
			<MapaRedimensionable />
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<CapaLugares
				ciudad={ciudad}
				lugares={lugares}
				lugarSeleccionado={lugarSeleccionado}
				onLugarClick={onLugarClick}
			/>
		</MapContainer>
	</div>
);

MapaCentrado.propTypes = {
	ciudad: PropTypes.shape({
		latitude: PropTypes.number.isRequired,
		longitude: PropTypes.number.isRequired,
	}),
};

MapaCiudad.propTypes = {
	ciudad: PropTypes.shape({
		latitude: PropTypes.number.isRequired,
		longitude: PropTypes.number.isRequired,
	}),
	lugares: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		category: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		address: PropTypes.string.isRequired,
		latitude: PropTypes.number.isRequired,
		longitude: PropTypes.number.isRequired,
		style: PropTypes.shape({
			label: PropTypes.string.isRequired,
			color: PropTypes.string.isRequired,
			icon: PropTypes.string.isRequired,
		}).isRequired,
	})).isRequired,
	lugarSeleccionado: PropTypes.shape({
		id: PropTypes.string.isRequired,
		category: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		address: PropTypes.string.isRequired,
		latitude: PropTypes.number.isRequired,
		longitude: PropTypes.number.isRequired,
		style: PropTypes.shape({
			label: PropTypes.string.isRequired,
			color: PropTypes.string.isRequired,
			icon: PropTypes.string.isRequired,
		}).isRequired,
	}),
	onLugarClick: PropTypes.func,
	altura: PropTypes.string,
};


