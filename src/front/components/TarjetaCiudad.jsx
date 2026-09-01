import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export const TarjetaCiudad = ({ ciudad, seleccionada, onSeleccionar }) => (
	<article className={`explorar-ciudad-card ${seleccionada ? "explorar-ciudad-card-activa" : ""}`}>
		<button
			aria-pressed={seleccionada}
			className="explorar-ciudad-imagen-boton"
			onClick={() => onSeleccionar(ciudad)}
			type="button"
		>
			<span className="explorar-ciudad-imagen-wrapper">
				<img
					alt={`${ciudad.city}, ${ciudad.country}`}
					className="explorar-ciudad-imagen"
					src={ciudad.image}
					style={{ transform: `scale(${ciudad.imageScale || 1})` }}
				/>
			</span>
		</button>
		<div className="explorar-ciudad-contenido">
			<button
				aria-pressed={seleccionada}
				className="explorar-ciudad-seleccion"
				onClick={() => onSeleccionar(ciudad)}
				type="button"
			>
				<span className="explorar-ciudad-copy">
					<span className="explorar-ciudad-titulo">
						<strong>{ciudad.city}</strong>
						<span>, {ciudad.country}</span>
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

TarjetaCiudad.propTypes = {
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
