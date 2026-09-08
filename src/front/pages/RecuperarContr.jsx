import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useSplitEntrance } from "../animaciones/useSplitEntrance";
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

export const RecuperarContr = () => {
  const [correo, setCorreo] = useState("");
  const [solicitudLista, setSolicitudLista] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const layoutRef = useRef(null);

  const manejarSolicitud = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    try {
      const respuesta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        throw new Error(obtenerMensajeErrorBackend(datos, "No fue posible solicitar la recuperación."));
      }
      setSolicitudLista(true);
      setMensaje(datos.message || "Si el correo está registrado, recibirás un enlace de recuperación.");
    } catch (errorDeRed) {
      setError(errorDeRed.message || "No fue posible conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useSplitEntrance(layoutRef);

  return (
    <main
      className="min-vh-100 d-flex align-items-center py-5"
      style={{ backgroundColor: "#EAF7FA" }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="row g-0 shadow-sm" ref={layoutRef}>
              {/* Flujo de recuperación */}
              <section
                className="col-lg-7 p-4 p-lg-5 split-left"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <p
                  className="mb-2 text-uppercase fw-semibold"
                  style={{
                    color: "#078A9A",
                    letterSpacing: "0.14em",
                    fontSize: "0.75rem",
                  }}
                >
                  Acceso a tu cuenta
                </p>

                {error && (
                  <div className="alert alert-danger rounded-0" role="alert">
                    {error}
                  </div>
                )}
                {mensaje && (
                  <div className="alert alert-success rounded-0" role="status">
                    {mensaje}
                  </div>
                )}

                {solicitudLista ? (
                  <div>
                    <h1 className="display-6 mb-3" style={estiloTitulo}>
                      Revisa tu correo
                    </h1>
                    <p className="mb-4" style={{ color: "#456B75", lineHeight: 1.6 }}>
                      Abre el enlace recibido para establecer una nueva contraseña.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={manejarSolicitud}>
                    <h1 className="display-6 mb-3" style={estiloTitulo}>
                      Recupera tu contraseña
                    </h1>
                    <p
                      className="mb-4"
                      style={{ color: "#456B75", lineHeight: 1.6 }}
                    >
                      Primero indica tu correo. Luego podrás definir una nueva
                      contraseña.
                    </p>
                    <label
                      htmlFor="recovery-email"
                      className="form-label small fw-semibold"
                      style={{ color: "#12343B" }}
                    >
                      Correo electrónico
                    </label>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      value={correo}
                      onChange={(event) => setCorreo(event.target.value)}
                      className="form-control mb-3"
                      placeholder="tu@email.com"
                      style={estiloInput}
                    />
                    <button
                      type="submit"
                      className="btn w-100 py-3"
                      disabled={cargando}
                      style={{
                        backgroundColor: "#12343B",
                        color: "#FFFFFF",
                        borderRadius: 0,
                      }}
                    >
                      {cargando ? "Enviando solicitud..." : "Solicitar recuperación"}
                    </button>
                  </form>
                )}

                <p
                  className="small text-center mt-4 mb-0"
                  style={{ color: "#456B75" }}
                >
                  ¿Recordaste tu contraseña?{" "}
                  <Link
                    to="/login"
                    className="text-decoration-none"
                    style={{ color: "#078A9A" }}
                  >
                    Inicia sesión
                  </Link>
                </p>
              </section>

              {/* Información de seguridad */}
              <section
                className="col-lg-5 d-none d-lg-flex align-items-center p-5 split-right"
                style={{ backgroundColor: "#12343B", height: "620px" }}
              >
                <div
                  className="p-4"
                  style={{ borderLeft: "3px solid #28C3D4" }}
                >
                  <p
                    className="mb-2 text-uppercase fw-semibold"
                    style={{
                      color: "#28C3D4",
                      letterSpacing: "0.14em",
                      fontSize: "0.75rem",
                    }}
                  >
                    Seguridad de tu cuenta
                  </p>
                  <h2
                    className="h1 mb-3"
                    style={{ ...estiloTitulo, color: "#FFFFFF" }}
                  >
                    Recupera el acceso con calma.
                  </h2>
                  <p
                    className="mb-0"
                    style={{ color: "#D4F0F5", lineHeight: 1.7 }}
                  >
                    Nunca compartas tu contraseña ni códigos de recuperación con
                    otras personas.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
