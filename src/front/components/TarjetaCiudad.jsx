import { useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useRevealOnScroll } from "../animaciones/useRevealOnScroll";

export const TarjetaCiudad = ({ ciudad, indice = 0, seleccionada, onSeleccionar }) => {
	const tarjetaRef = useRef(null);
	useRevealOnScroll(tarjetaRef, "left", {
		distance: 90,
		duration: 0.8,
		delay: indice * 0.08,
		start: "top 92%",
	});

	return (
	<article
		ref={tarjetaRef}
		className={`explorar-ciudad-card ${seleccionada ? "explorar-ciudad-card-activa" : ""}`}
	>		<button
			aria-label={`Seleccionar ${ciudad.city}`}
			aria-pressed={seleccionada}
			className="explorar-ciudad-imagen-boton"
			onClick={() => onSeleccionar(ciudad)}
			type="button"
		>
			<span className="explorar-ciudad-imagen-wrapper">
				<img
					alt={`${ciudad.city}, ${ciudad.country}`}
					loading="lazy"
					decoding="async"
					className="explorar-ciudad-imagen"
					src={ciudad.image}
					style={{ transform: `scale(${ciudad.imageScale || 1})` }}
				/>
			</span>
		</button>
		<div className="explorar-ciudad-contenido">
			<button
				aria-pressed={seleccionada}
				className="explorar-ciudad-seleccion flex-grow-1"
				onClick={() => onSeleccionar(ciudad)}
				type="button"
			>
				<span className="explorar-ciudad-copy">
					<span className="explorar-ciudad-titulo">
						<strong style={{ fontWeight: 600 }}>{ciudad.city}</strong>
						<span style={{ fontWeight: 400 }}>, {ciudad.country}</span>
					</span>
					<span className="explorar-ciudad-categorias">{ciudad.bestFor}</span>
				</span>
			</button>
			<Link className="explorar-ciudad-ver-mas" to={`/explorar/${ciudad.slug}`}>
				Ver más →
			</Link>
		</div>
	</article>
	);
};

TarjetaCiudad.propTypes = {
	indice: PropTypes.number,
	ciudad: PropTypes.shape({
		slug: PropTypes.string.isRequired,
		city: PropTypes.string.isRequired,
		country: PropTypes.string.isRequired,
		image: PropTypes.string.isRequired,
		imageScale: PropTypes.number,
		bestFor: PropTypes.string.isRequired,
	}).isRequired,
	seleccionada: PropTypes.bool.isRequired,
	onSeleccionar: PropTypes.func.isRequired,
};
