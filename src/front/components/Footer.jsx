export const Footer = () => (
  <footer
    id="footer"
    className="py-4"
    style={{ backgroundColor: "#12343B", color: "#EAF7FA" }}
  >
    <div className="container d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <p
        className="mb-0"
        style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "1.25rem" }}
      >
        Viajero
      </p>
      <p className="mb-0 small text-white-50">
        Proyecto realizado por Jorge Montiel &amp; Vicente Flores 
      </p>
      <a
        href="https://github.com/Bisual0/Planificador-de-viajes-Proyecto-Final"
        target="_blank"
        rel="noreferrer"
        className="small text-decoration-none"
        style={{ color: "#28C3D4" }}
      >
        Ver repositorio ↗
      </a>
    </div>
  </footer>
);
