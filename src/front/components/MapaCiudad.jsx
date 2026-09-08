import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LUGAR_ESTILOS } from "../data/ciudades.mjs";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";

const FORMA_MARCADOR = "pin";
const UMBRAL_ZOOM_MARCADOR = 10;
const CLUSTERS_ACTIVOS = true;

const formatearCantidadCluster = (cantidad) => {
  if (cantidad < 10) return String(cantidad);
  if (cantidad < 100) return `${Math.floor(cantidad / 10) * 10}+`;

  return `${Math.floor(cantidad / 100) * 100}+`;
};

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
        mapa.invalidateSize({
          animate: false,
          pan: false,
        });
      });
    };

    const observador =
      typeof ResizeObserver === "undefined"
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

const crearIconoLugar = (lugar, seleccionado = false, zoom = 13) => {
  const { color } = lugar.style;

  const marcadorPequeno = zoom <= UMBRAL_ZOOM_MARCADOR;
  const size = marcadorPequeno
    ? seleccionado
      ? 34
      : 26
    : seleccionado
      ? 42
      : 32;
  const offset = size / 2;
  const icono = lugar.style.icon || "fa-location-dot";
  const esPin = FORMA_MARCADOR === "pin";
  const esCuadrado = FORMA_MARCADOR === "rounded-square";
  const borderRadius = esPin
    ? "50% 50% 50% 0"
    : esCuadrado
      ? "10px"
      : "50%";
  const transformacion = esPin ? "rotate(-45deg)" : "none";
  const transformacionIcono = esPin ? "rotate(45deg)" : "none";
  const iconAnchor = esPin ? [offset, size] : [offset, offset];
  const popupAnchor = esPin ? [0, -size] : [0, -offset];

  return L.divIcon({
    className: "",
    html: `
			<span
				style="
					align-items:center;
					background:${seleccionado ? "#12343B" : color};
					border:2px solid #fff;
					border-radius:${borderRadius};
					box-shadow:0 2px 6px rgba(18,52,59,.3);
					color:#fff;
					display:flex;
					font-size:${seleccionado ? 17 : 14}px;
					height:${size}px;
					justify-content:center;
					transform:${transformacion};
					width:${size}px
				"
			>
				<i
					class="fa-solid ${icono}"
					aria-hidden="true"
					style="transform:${transformacionIcono}"
				></i>
			</span>
		`,
    iconAnchor,
    popupAnchor,
  });
};

const escaparHtml = (texto) =>
  String(texto).replace(
    /[&<>'"]/g,
    (caracter) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[caracter],
  );

const formatearDireccion = (lugar) => {
  const direccion = String(lugar.address || "").trim();
  const ciudad = String(lugar.city || "").trim();

  if (!direccion || direccion === "Dirección no disponible") {
    return ciudad ? `Dirección no disponible, ${ciudad}` : direccion;
  }

  if (
    ciudad &&
    !direccion.toLocaleLowerCase().includes(ciudad.toLocaleLowerCase())
  ) {
    return `${direccion}, ${ciudad}`;
  }

  return direccion;
};

const normalizarUrl = (valor, prefijo = "") => {
  const texto = String(valor || "").trim();

  if (!texto) return "";

  if (/^https?:\/\//i.test(texto)) return texto;

  if (prefijo) {
    return `https://${prefijo}/${texto.replace(/^@/, "")}`;
  }

  if (/^www\./i.test(texto)) return `https://${texto}`;

  return "";
};

const crearIconoCluster = (cluster, estilo, zoom = 13) => {
  const cantidad = cluster.getChildCount();
  const cantidadVisible = formatearCantidadCluster(cantidad);
  const clusterPequeno = zoom >= 11;

  const size = clusterPequeno ? 38 : 46;

  return L.divIcon({
    className: "",
    html: `
			<span
				style="
					align-items:center;
					background:${estilo.color};
					border:3px solid #fff;
					border-radius:50%;
					box-shadow:0 2px 6px rgba(18,52,59,.3);
					color:#fff;
					display:flex;
					font-family:'DM Sans',sans-serif;
					font-weight:700;
					height:${size}px;
					justify-content:center;
					line-height:1;
					padding:0;
					width:${size}px
				"
			>
				<i
					class="fa-solid ${estilo.icon}"
					style="font-size:11px;margin-bottom:3px"
					aria-hidden="true"
				></i>
				<strong style="font-size:0.8rem">
				${cantidadVisible}
				</strong>
			</span>
		`,
    iconSize: [size, size],
  });
};

const crearOpcionesCluster = (estilo, obtenerZoom) => ({
  chunkedLoading: true,
  chunkDelay: 25,
  chunkInterval: 100,

  iconCreateFunction: (cluster) =>
    crearIconoCluster(cluster, estilo, obtenerZoom()),

  maxClusterRadius: (zoom) => {
    if (zoom <= 8) return 80;
    if (zoom <= 12) return 65;
    if (zoom <= 15) return 45;

    return 30;
  },

  disableClusteringAtZoom: CLUSTERS_ACTIVOS ? 17 : 0,

  showCoverageOnHover: false,

  spiderfyOnMaxZoom: true,

  zoomToBoundsOnClick: true,
});

const crearMarcador = (
  lugar,
  seleccionado,
  onLugarClick,
  zoom,
  categoria,
) => {
  const marcador = L.marker([lugar.latitude, lugar.longitude], {
    icon: crearIconoLugar(lugar, seleccionado, zoom),
    categoria,
  });

  marcador.on("click", () => onLugarClick(lugar));

  return marcador;
};

const obtenerCategoriaLugar = (lugar) =>
  LUGAR_ESTILOS[lugar.category] ? lugar.category : "attraction";

const CapaLugares = ({
  ciudad,
  lugares,
  lugarSeleccionado,
  onLugarClick,
  onClusterClick,
}) => {
  const mapa = useMap();

  const capasRef = useRef(new Map());

  const marcadoresRef = useRef(new Map());

  const lugarSeleccionadoAnteriorRef = useRef(null);

  const zoomAnteriorRef = useRef(mapa.getZoom());

  const [capasListas, setCapasListas] = useState(null);

  const [mapaPreparado, setMapaPreparado] = useState(!ciudad);

  const [zoomActual, setZoomActual] = useState(() => mapa.getZoom());

  useEffect(() => {
    const actualizarZoom = () => {
      setZoomActual(mapa.getZoom());

      capasRef.current.forEach((capa) => capa.refreshClusters());
    };

    mapa.on("zoomend", actualizarZoom);

    return () => mapa.off("zoomend", actualizarZoom);
  }, [mapa]);

  /* CREAR CAPA DE CLUSTERS */

  useEffect(() => {
    let activa = true;

    window.L = L;

    import("leaflet.markercluster").then(() => {
      if (!activa) return;

      capasRef.current = new Map();
      setCapasListas(new Map());
    });

    return () => {
      activa = false;

      marcadoresRef.current.clear();

      capasRef.current.forEach((capa) => {
        capa.off("clusterclick");
        capa.remove();
      });

      capasRef.current.clear();
      setCapasListas(null);
    };
  }, [mapa]);

  /* ESPERAR A QUE EL MAPA TERMINE DE CENTRARSE */

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

  /* ADMINISTRAR MARCADORES */

  useEffect(() => {
    const capas = capasRef.current;

    if (!capasListas) return undefined;

    /*
			Cuando cambia la ciudad,
			limpiamos los marcadores anteriores.
		*/

    if (!mapaPreparado) {
      capas.forEach((capa) => capa.clearLayers());

      marcadoresRef.current.clear();

      lugarSeleccionadoAnteriorRef.current = null;

      zoomAnteriorRef.current = zoomActual;

      return undefined;
    }

    const lugaresPorId = new Map(lugares.map((lugar) => [lugar.id, lugar]));

    /*
			Eliminar marcadores que ya
			no existen en lugares.
		*/

    marcadoresRef.current.forEach((marcador, id) => {
      if (!lugaresPorId.has(id)) {
        capas.get(marcador.options.categoria)?.removeLayer(marcador);

        marcadoresRef.current.delete(id);
      }
    });

    /*
			Agregar solamente marcadores nuevos
			a su cluster de categoría.
		*/

    const idSeleccionadoAnterior = lugarSeleccionadoAnteriorRef.current?.id;

    lugares.forEach((lugar) => {
      const categoria = obtenerCategoriaLugar(lugar);
      const estilo = LUGAR_ESTILOS[categoria];
      const seleccionado = lugar.id === lugarSeleccionado?.id;

      let capa = capas.get(categoria);

      if (!capa) {
        capa = L.markerClusterGroup(
          crearOpcionesCluster(estilo, () => mapa.getZoom()),
        ).addTo(mapa);

        capa.on("clusterclick", () => {
          mapa.closePopup();
          onClusterClick(null);
        });

        capas.set(categoria, capa);
        setCapasListas(new Map(capas));
      }

      const marcadorExistente = marcadoresRef.current.get(lugar.id);

      if (marcadorExistente) {
        if (
          lugar.id === idSeleccionadoAnterior ||
          lugar.id === lugarSeleccionado?.id ||
          zoomActual !== zoomAnteriorRef.current
        ) {
          marcadorExistente.setIcon(
            crearIconoLugar(lugar, seleccionado, zoomActual),
          );
        }

        return;
      }

      const marcador = crearMarcador(
        lugar,
        seleccionado,
        onLugarClick,
        zoomActual,
        categoria,
      );

      marcadoresRef.current.set(lugar.id, marcador);

      capa.addLayer(marcador);
    });

    /*
      Conservar referencias del estado actual.
      El mapa no se recentra automáticamente al cambiar el zoom.
    */

    lugarSeleccionadoAnteriorRef.current = lugarSeleccionado;
    zoomAnteriorRef.current = zoomActual;

    return undefined;
  }, [
    capasListas,
    lugarSeleccionado,
    lugares,
    mapa,
    mapaPreparado,
    onClusterClick,
    onLugarClick,
    zoomActual,
  ]);

  return null;
};

CapaLugares.propTypes = {
  ciudad: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),

  lugares: PropTypes.arrayOf(
    PropTypes.shape({
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
    }),
  ).isRequired,

  lugarSeleccionado: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),

  onLugarClick: PropTypes.func.isRequired,

  onClusterClick: PropTypes.func.isRequired,
};

const noOp = () => {};

export const MapaCiudad = ({
  ciudad = null,
  lugares,
  lugarSeleccionado = null,
  onLugarClick = noOp,
  onClusterClick = noOp,
  altura = "520px",
}) => (
  <div style={{ height: altura }}>
    <MapContainer center={[20, 0]} className="w-100 h-100" zoom={2}>
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
        onClusterClick={onClusterClick}
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

  lugares: PropTypes.arrayOf(
    PropTypes.shape({
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
  ).isRequired,

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

  onClusterClick: PropTypes.func,

  altura: PropTypes.string,
};
