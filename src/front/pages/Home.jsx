import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRevealOnScroll } from "../animaciones/useRevealOnScroll"
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import buenosAires from "../assets/img/buenos-aires-argentina.jpg";
import lima from "../assets/img/lima-peru.jpg";
import rio from "../assets/img/rio-de-janeiro-brasil.jpg";
import sanJose from "../assets/img/san-jose-costa-rica.jpg";
import valparaiso from "../assets/img/valparaiso-chile.jpg";

const destinations = [
  { city: "Valparaíso", country: "Chile", image: valparaiso },
  { city: "San José", country: "Costa Rica", image: sanJose },
  { city: "Río de Janeiro", country: "Brasil", image: rio },
  { city: "Buenos Aires", country: "Argentina", image: buenosAires },
  { city: "Lima", country: "Perú", image: lima },
];

const Boton = ({ children, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const style = {
    backgroundColor: hovered ? "#0F6B78" : "transparent",
    border: "1px solid #0F6B78",
    borderRadius: 0,
    color: hovered ? "#FFFFFF" : "#12343B",
    transition: "background-color 0.25s ease, color 0.25s ease",
  };

  return (
    <button
      type="button"
      className="btn btn-lg px-4 py-3"
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const TarjetaDestino = ({ destination, large = false }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div className={large ? "col-lg-6" : "col-sm-6"}>
      <div
        className="h-100"
        style={{
          minHeight: large ? "390px" : "190px",
          borderRadius: 0,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          boxShadow: hovered
            ? "0 0.5rem 1rem rgba(18,52,59,0.18)"
            : "0 0.125rem 0.25rem rgba(18,52,59,0.12)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            height: large ? "290px" : "125px",
            overflow: "hidden",
            lineHeight: 0,
          }}
        >
          <img
            src={destination.image}
            alt={`${destination.city}, ${destination.country}`}
            className="w-100 h-100 object-fit-cover d-block"
            style={{
              transform:
                destination.city === "Valparaíso" ? "scale(1.12)" : "scale(1)",
              objectPosition: "center",
            }}
          />
        </div>
        <div className="p-3" style={{ minHeight: large ? "100px" : "65px" }}>
          <p className="mb-1 small" style={{ color: "#456B75" }}>
            {destination.country}
          </p>
          <h3
            className={large ? "h3 mb-0" : "h6 mb-0"}
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              color: "#12343B",
              fontWeight: 600,
            }}
          >
            {destination.city}
          </h3>
        </div>
      </div>
    </div>
  );
};

export const Home = () => {
  const navigate = useNavigate();
  const [activeDestination, setActiveDestination] = useState(0);
  const heroRef = useRef(null)
  const destinationSelectionRef = useRef(null)

  useGSAP(()=>{
    gsap.from(".hero-left", {
      x: -210,
      opacity: 0,
      duration: 1.5,
      ease: "power3.out"
    })
    gsap.from(".hero-right", {
      x: 210,
      opacity: 0,
      duration: 1.5,
      ease: "power3.out"
    })
  }, {scope: heroRef})

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveDestination((current) => (current + 1) % destinations.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  useRevealOnScroll(destinationSelectionRef, "left", {
    distance: 520,
    duration: 1.7,
    start: "top 80%"
  })

  return (
    <main style={{ backgroundColor: "#FFFFFF", color: "#12343B" }}>
      {/* Hero */}
      <section
        className="container-fluid px-0"
        style={{ minHeight: "calc(100vh - 77px)" }}
        ref={heroRef}
      >
        <div
          className="row g-0 align-items-stretch"
          style={{ minHeight: "calc(100vh - 77px)" }}
        >
          <div
            className="col-lg-6 d-flex align-items-center hero-left"
            style={{ backgroundColor: "#EAF7FA" }}
          >
            <div
              className="w-100 px-4 px-md-5 px-xl-6 py-5"
              style={{ maxWidth: "700px", margin: "0 auto" }}
            >
              <p
                className="text-uppercase fw-semibold mb-3"
                style={{
                  color: "#078A9A",
                  letterSpacing: "0.16em",
                  fontSize: "0.78rem",
                }}
              >
                Tu próximo viaje empieza aquí
              </p>
              <h1
                className="display-3 mb-4"
                style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  color: "#12343B",
                  fontWeight: 600,
                  lineHeight: 1.05,
                }}
              >
                Planifica tu próxima aventura sin perderte en los detalles.
              </h1>
              <p
                className="lead mb-4"
                style={{ color: "#456B75", lineHeight: 1.65 }}
              >
                Organiza destinos, actividades y lugares favoritos en un solo
                espacio para disfrutar más y preocuparte menos.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Boton onClick={() => navigate("/trips/new")}>Crear mi viaje</Boton>
                <Boton onClick={() => navigate("/explorar")}>Explorar destinos</Boton>
              </div>
            </div>
          </div>

          <div
            className="col-lg-6 position-relative overflow-hidden hero-right"
            style={{ minHeight: "520px" }}
          >
            <div
              className="d-flex h-100"
              style={{
                width: `${destinations.length * 100}%`,
                transform: `translateX(-${activeDestination * (100 / destinations.length)}%)`,
                transition: "transform 0.7s ease-in-out",
              }}
            >
              {destinations.map((destination) => (
                <div
                  key={destination.city}
                  className="position-relative h-100"
                  style={{
                    width: `${100 / destinations.length}%`,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={destination.image}
                    alt={`${destination.city}, ${destination.country}`}
                    className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
                    style={{
                      transform:
                        destination.city === "Valparaíso"
                          ? "scale(1.07)"
                          : "none",
                      objectPosition: "center",
                    }}
                  />
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(18,52,59,0.04) 35%, rgba(18,52,59,0.88) 100%)",
                    }}
                  />
                  <div className="position-absolute bottom-0 start-0 end-0 p-4 p-md-5">
                    <p
                      className="mb-1 text-white-50 text-uppercase fw-semibold"
                      style={{
                        letterSpacing: "0.12em",
                        fontSize: "0.75rem",
                      }}
                    >
                      {destination.country}
                    </p>
                    <h2
                      className="mb-0 text-white"
                      style={{
                        fontFamily: "Fraunces, Georgia, serif",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        fontSize: "clamp(2.3rem, 4vw, 4.5rem)",
                      }}
                    >
                      {destination.city}
                    </h2>
                    <button
                      type="button"
                      className="btn mt-3 px-3 py-2"
                      style={{
                        backgroundColor: "#28C3D4",
                        color: "#12343B",
                        borderColor: "#28C3D4",
                        borderRadius: 0,
                      }}
                    >
                      Planifica tu Viaje
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="position-absolute top-0 end-0 p-4 d-flex gap-2"
              style={{ zIndex: 2 }}
            >
              {destinations.map((destination, index) => (
                <button
                  key={destination.city}
                  type="button"
                  aria-label={`Mostrar ${destination.city}`}
                  onClick={() => setActiveDestination(index)}
                  className="border-0 rounded-circle p-0"
                  style={{
                    width: "11px",
                    height: "11px",
                    backgroundColor:
                      index === activeDestination ? "#28C3D4" : "#FFFFFF",
                    opacity: index === activeDestination ? 1 : 0.75,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Destinos Destacados */}
      <section
        id="destinos"
        className="container-fluid px-0 pb-5 pb-lg-6"
        style={{ backgroundColor: "#EAF7FA" }}
        ref={destinationSelectionRef}
      >
        <div className="container pt-5">
          <div className="d-flex justify-content-between align-items-end mb-4 gap-3">
            <div>
              <p
                className="text-uppercase fw-semibold mb-2"
                style={{
                  color: "#078A9A",
                  letterSpacing: "0.14em",
                  fontSize: "0.75rem",
                }}
              >
                Inspírate
              </p>
              <h2
                className="display-6 mb-0"
                style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  color: "#12343B",
                  fontWeight: 600,
                }}
              >
                Destinos destacados
              </h2>
            </div>
            <button
              type="button"
              className="d-none d-md-inline text-decoration-none fw-semibold border-0 bg-transparent p-0"
              onClick={() => navigate("/explorar")}
              style={{ color: "#0F6B78" }}
            >
              Ver todos los destinos <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="row g-2">
            <TarjetaDestino destination={destinations[0]} large />
            <div className="col-lg-6">
              <div className="row g-2 h-100">
                <TarjetaDestino destination={destinations[2]} />
                <TarjetaDestino destination={destinations[3]} />
                <TarjetaDestino destination={destinations[1]} />
                <TarjetaDestino destination={destinations[4]} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios Clave */}
      <section
        id="accesos"
        className="py-5"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="container">
          <p
            className="text-uppercase fw-semibold mb-2"
            style={{
              color: "#078A9A",
              letterSpacing: "0.14em",
              fontSize: "0.75rem",
            }}
          >
            Variación 3 · Banner Contraste Oscuro
          </p>
          <h2
            className="display-6 mb-5"
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              color: "#12343B",
              fontWeight: 600,
            }}
          >
            ¿Por qué planificar con Viajero?
          </h2>
          <div className="row g-0">
            <div className="col-md-4 pe-md-4">
              <h3
                className="h4 mb-2"
                style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  color: "#12343B",
                  fontWeight: 600,
                }}
              >
                Todo centralizado
              </h3>
              <p className="mb-0" style={{ color: "#456B75", lineHeight: 1.7 }}>
                Itinerarios y lugares en un solo sitio.
              </p>
            </div>
            <div
              className="col-md-4 px-md-4 mt-4 mt-md-0 border-start"
              style={{ borderColor: "#B8DCE3" }}
            >
              <h3
                className="h4 mb-2"
                style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  color: "#12343B",
                  fontWeight: 600,
                }}
              >
                A tu propio ritmo
              </h3>
              <p className="mb-0" style={{ color: "#456B75", lineHeight: 1.7 }}>
                Rutas flexibles según tu estilo.
              </p>
            </div>
            <div
              className="col-md-4 ps-md-4 mt-4 mt-md-0 border-start"
              style={{ borderColor: "#B8DCE3" }}
            >
              <h3
                className="h4 mb-2"
                style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  color: "#12343B",
                  fontWeight: 600,
                }}
              >
                Siempre a mano
              </h3>
              <p className="mb-0" style={{ color: "#456B75", lineHeight: 1.7 }}>
                Acceso desde cualquier dispositivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section
        className="container py-5 py-lg-6"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="row justify-content-center text-center">
          <div className="col-lg-8">
            <p
              className="text-uppercase fw-semibold mb-2"
              style={{
                color: "#078A9A",
                letterSpacing: "0.14em",
                fontSize: "0.75rem",
              }}
            >
              En tres pasos
            </p>
            <h2
              className="display-6 mb-5"
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                color: "#12343B",
                fontWeight: 600,
              }}
            >
              De la idea al itinerario
            </h2>
          </div>
        </div>
        <div className="row g-4 text-center">
          <div className="col-md-4">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "#28C3D4",
                color: "#12343B",
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: "1.5rem",
              }}
            >
              1
            </span>
            <h3
              className="h4"
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                color: "#12343B",
                fontWeight: 600,
              }}
            >
              Elige un destino
            </h3>
            <p style={{ color: "#456B75" }}>
              Encuentra una ciudad que quieras descubrir.
            </p>
          </div>
          <div className="col-md-4">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "#28C3D4",
                color: "#12343B",
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: "1.5rem",
              }}
            >
              2
            </span>
            <h3
              className="h4"
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                color: "#12343B",
                fontWeight: 600,
              }}
            >
              Organiza tus actividades
            </h3>
            <p style={{ color: "#456B75" }}>
              Construye un plan que se adapte a tu viaje.
            </p>
          </div>
          <div className="col-md-4">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "#28C3D4",
                color: "#12343B",
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: "1.5rem",
              }}
            >
              3
            </span>
            <h3
              className="h4"
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                color: "#12343B",
                fontWeight: 600,
              }}
            >
              Disfruta tu viaje
            </h3>
            <p style={{ color: "#456B75" }}>
              Ten toda tu aventura organizada en un solo lugar.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
