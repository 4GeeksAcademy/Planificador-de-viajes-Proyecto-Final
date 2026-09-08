import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CargadorMapa } from "../animaciones/CargadorMapa";
import { useEntradaPagina } from "../animaciones/useEntradaPagina";
import { MapaCiudad } from "../components/MapaCiudad";
import { BotonFavoritoLugar } from "../components/BotonFavoritoLugar";
import { TarjetaCiudad } from "../components/TarjetaCiudad";
import { ciudades, LUGAR_ESTILOS } from "../data/ciudades.mjs";
import "../explorar.css";

const estiloTitulo = {
  color: "#12343B",
  fontFamily: "Fraunces, Georgia, serif",
  fontWeight: 600,
};

const GRUPOS_CONSULTA = [
  "turismo_cultura",
  "comida",
  "vida_nocturna",
  "alojamiento",
  "paseos",
];

const ESPERAS_REINTENTO_MS = [1500];
const ESPERA_ENTRE_GRUPOS_MS = 500;
const DISTANCIA_CENTROS_CONSULTA_KM = 5;

const esperar = (milisegundos) =>
  new Promise((resolve) => window.setTimeout(resolve, milisegundos));

const esErrorTransitorio = (error) =>
  !error.status || [429, 502, 503, 504].includes(error.status);

const obtenerMensajeError = (datos, fallback) =>
  datos?.msg || datos?.error || fallback;

const consultarDireccion = async (lugar) => {
  const parametros = new URLSearchParams({
    lat: lugar.latitude,
    lon: lugar.longitude,
  });
  const respuesta = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/explorar/direccion?${parametros}`,
  );

  if (!respuesta.ok) {
    const datosError = await respuesta.json().catch(() => null);
    throw new Error(
      obtenerMensajeError(datosError, "No pudimos obtener la dirección."),
    );
  }

  return respuesta.json();
};

const tieneCoordenadasValidas = (lugar) =>
  Number.isFinite(lugar.latitude) &&
  Number.isFinite(lugar.longitude) &&
  lugar.latitude >= -90 &&
  lugar.latitude <= 90 &&
  lugar.longitude >= -180 &&
  lugar.longitude <= 180;

const obtenerPuntosConsulta = (ciudad) => {
  const latitudEnRadianes = (ciudad.latitude * Math.PI) / 180;
  const gradosPorKilometro = 1 / (111.32 * Math.cos(latitudEnRadianes));
  const desplazamiento =
    DISTANCIA_CENTROS_CONSULTA_KM * gradosPorKilometro;

  return [
    {
      lado: "oeste",
      latitude: ciudad.latitude,
      longitude: ciudad.longitude - desplazamiento,
    },
    {
      lado: "este",
      latitude: ciudad.latitude,
      longitude: ciudad.longitude + desplazamiento,
    },
  ];
};

const consultarGrupo = async (ciudad, grupo, puntoConsulta) => {
  const parametros = new URLSearchParams({
    lat: puntoConsulta.latitude,
    lon: puntoConsulta.longitude,
    grupo,
  });

  const respuesta = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/explorar/lugares?${parametros}`,
  );

  if (!respuesta.ok) {
    const datosError = await respuesta.json().catch(() => null);

    const error = new Error(
      obtenerMensajeError(
        datosError,
        "No pudimos cargar los lugares en este momento. Intenta nuevamente más tarde.",
      ),
    );

    error.status = respuesta.status;
    throw error;
  }

  const datos = await respuesta.json();

  return (datos.places || [])
    .filter(tieneCoordenadasValidas)
    .map((lugar) => ({
      ...lugar,
      city: ciudad.city,
      country: ciudad.country,
      style: LUGAR_ESTILOS[lugar.category] || LUGAR_ESTILOS.attraction,
    }));
};

const consultarGrupoConReintentos = async (ciudad, grupo, puntoConsulta) => {
  for (let intento = 0; intento <= ESPERAS_REINTENTO_MS.length; intento += 1) {
    try {
      return await consultarGrupo(ciudad, grupo, puntoConsulta);
    } catch (error) {
      const quedanReintentos = intento < ESPERAS_REINTENTO_MS.length;

      if (!quedanReintentos || !esErrorTransitorio(error)) {
        throw error;
      }

      await esperar(ESPERAS_REINTENTO_MS[intento]);
    }
  }

  return [];
};

const unirLugares = (lugaresActuales, lugaresNuevos) => {
  const lugaresPorId = new Map(
    [...lugaresActuales, ...lugaresNuevos].map((lugar) => [lugar.id, lugar]),
  );

  return [...lugaresPorId.values()];
};

export const Explorar = () => {
  const paginaRef = useRef(null);
  useEntradaPagina(paginaRef);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState(null);
  const [lugares, setLugares] = useState([]);
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
  const [estado, setEstado] = useState("idle");
  const [error, setError] = useState("");
  const [respuestaCorrectaRecibida, setRespuestaCorrectaRecibida] = useState(false);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [estadoDireccion, setEstadoDireccion] = useState("idle");

  useEffect(() => {
    if (!lugarSeleccionado) {
      setDireccionSeleccionada(null);
      setEstadoDireccion("idle");
      return undefined;
    }

    let activa = true;
    setDireccionSeleccionada(null);
    setEstadoDireccion("loading");

    consultarDireccion(lugarSeleccionado)
      .then((direccion) => {
        if (!activa) return;
        setDireccionSeleccionada(direccion);
        setEstadoDireccion("success");
      })
      .catch(() => {
        if (!activa) return;
        setEstadoDireccion("error");
      });

    return () => {
      activa = false;
    };
  }, [lugarSeleccionado]);

  useEffect(() => {
    if (!ciudadSeleccionada) return undefined;

    let activa = true;

    setEstado("loading");
    setError("");
    setLugares([]);
    setLugarSeleccionado(null);
    setRespuestaCorrectaRecibida(false);

    const puntosConsulta = obtenerPuntosConsulta(ciudadSeleccionada);

    const consultas = GRUPOS_CONSULTA.flatMap((grupo, indiceGrupo) =>
      puntosConsulta.map((puntoConsulta, indicePunto) =>
        esperar(
          (indiceGrupo * puntosConsulta.length + indicePunto) *
            ESPERA_ENTRE_GRUPOS_MS,
        )
          .then(() => {
            if (!activa) return [];

            return consultarGrupoConReintentos(
              ciudadSeleccionada,
              grupo,
              puntoConsulta,
            );
          })
          .then((lugaresDelGrupo) => {
            if (!activa) return lugaresDelGrupo;

            setRespuestaCorrectaRecibida(true);
            setLugares((lugaresActuales) =>
              unirLugares(lugaresActuales, lugaresDelGrupo),
            );

            return lugaresDelGrupo;
          }),
      ),
    );

    Promise.allSettled(consultas).then((resultados) => {
      if (!activa) return;

      const respuestasCorrectas = resultados
        .filter((resultado) => resultado.status === "fulfilled")
        .flatMap((resultado) => resultado.value);

      const primerError = resultados.find(
        (resultado) => resultado.status === "rejected",
      )?.reason;

      if (respuestasCorrectas.length) {
        setEstado("success");
        return;
      }

      if (primerError) {
        setError(
          primerError.message ||
            "No pudimos cargar los lugares en este momento. Intenta nuevamente más tarde.",
        );

        setEstado("error");
        return;
      }

      setEstado("empty");
    });

    return () => {
      activa = false;
    };
  }, [ciudadSeleccionada]);

  const mostrarCargador = estado === "loading" && !respuestaCorrectaRecibida;
  const direccionMostrada =
    direccionSeleccionada?.address || lugarSeleccionado?.address || "Dirección no disponible";
  const ciudadMostrada = direccionSeleccionada?.city || lugarSeleccionado?.city;

  return (
    <main ref={paginaRef} className="explorar-page pagina-animada" style={{ backgroundColor: "#EAF7FA" }}>
      <section className="explorar-panel container-xl py-4 py-lg-5">
        <div className="row g-4 align-items-start">
          <aside className="col-lg-6 explorar-ciudades-panel">
            <div className="explorar-ciudades-cabecera">
              <Link
                className="explorar-volver-inicio text-decoration-none small"
                style={{ color: "#078A9A" }}
                to="/"
                aria-label="Volver al inicio"
              >
                ←
              </Link>

              <h1 className="display-5 mb-0" style={estiloTitulo}>
                Explora ciudades
              </h1>
            </div>

            <div
              className="explorar-ciudades-list px-3 pb-3"
              aria-label="Ciudades disponibles"
            >
              {ciudades.map((ciudad, indice) => (
                <TarjetaCiudad
                  ciudad={ciudad}
                  indice={indice}
                  key={ciudad.slug}
                  onSeleccionar={setCiudadSeleccionada}
                  seleccionada={ciudadSeleccionada?.slug === ciudad.slug}
                />
              ))}
            </div>
          </aside>

          <section className="col-lg-6 explorar-mapa-panel">
            <div className="explorar-mapa-wrapper">
              <MapaCiudad
                altura="100%"
                ciudad={ciudadSeleccionada}
                lugares={lugares}
                lugarSeleccionado={lugarSeleccionado}
                onLugarClick={setLugarSeleccionado}
                onClusterClick={setLugarSeleccionado}
              />

              {mostrarCargador && <CargadorMapa />}

              {lugarSeleccionado && (
                <article className="explorar-lugar-detalle" aria-live="polite">
                  <div className="explorar-lugar-detalle-contenido">
                    <p
                      className="explorar-lugar-detalle-categoria small text-uppercase fw-semibold mb-1"
                      style={{ color: lugarSeleccionado.style.color }}
                    >
                      {lugarSeleccionado.style.label}
                    </p>

                    <h3 className="h4 mb-2" style={estiloTitulo}>
                      {lugarSeleccionado.name}
                    </h3>

                    <div className="explorar-lugar-detalle-datos">
                      <p className="mb-0">
                        <strong>Dirección</strong>
                        <span>
                          {estadoDireccion === "loading"
                            ? "Buscando dirección..."
                            : direccionMostrada}
                        </span>
                      </p>

                      {ciudadMostrada && (
                        <p className="mb-0">
                          <strong>Ciudad</strong>
                          <span>{ciudadMostrada}</span>
                        </p>
                      )}
                    </div>

                    <small className="explorar-lugar-detalle-fuente">
                      {direccionSeleccionada?.source || lugarSeleccionado.source}
                    </small>
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid #DDECEF" }}>
                      <BotonFavoritoLugar lugar={lugarSeleccionado} ciudad={ciudadSeleccionada} />
                    </div>
                  </div>

                  <button
                    className="btn-close"
                    aria-label="Cerrar información del lugar"
                    onClick={() => setLugarSeleccionado(null)}
                    type="button"
                  />
                </article>
              )}
            </div>

            <div className="visually-hidden" aria-live="polite">
              {estado === "loading" && (
                <p role="status">Cargando lugares de la ciudad...</p>
              )}

              {estado === "error" && <p role="alert">{error}</p>}

              {estado === "empty" && (
                <p role="status">
                  No encontramos lugares con nombre y coordenadas.
                </p>
              )}

            </div>
          </section>
        </div>
      </section>
    </main>
  );
};
