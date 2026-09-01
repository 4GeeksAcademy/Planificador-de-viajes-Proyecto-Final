import React from "react";
import { Link, useParams } from "react-router-dom";
import { obtenerCiudad } from "../data/ciudades.mjs";
import "../explorar.css";

export const Ciudad = () => {
	const { citySlug } = useParams();
	const ciudad = obtenerCiudad(citySlug);

	if (!ciudad) {
		return (
			<main className="ciudad-propuestas-page">
				<div className="container ciudad-propuestas-no-encontrada">
					<h1>Ciudad no encontrada</h1>
					<Link to="/explorar">Volver a explorar</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="ciudad-propuestas-page">
			<div className="ciudad-propuestas-intro container-xl">
				<Link className="ciudad-propuestas-volver" to="/explorar">← Explorar ciudades</Link>
				<p>Vista previa de dirección visual</p>
				<h1>Propuestas para {ciudad.city}</h1>
				<span>Desplázate para comparar tres composiciones estáticas.</span>
			</div>

			<section className="ciudad-propuesta ciudad-propuesta-editorial" aria-labelledby="propuesta-editorial">
				<div className="ciudad-propuesta-contenedor container-xl">
					<div className="ciudad-propuesta-etiqueta"><span>01</span> Editorial</div>
					<div className="ciudad-propuesta-editorial-copy">
						<p>{ciudad.country} · {ciudad.region}</p>
						<h2 id="propuesta-editorial">{ciudad.city}</h2>
						<div className="ciudad-propuesta-linea" />
						<span>Una portada de lectura lenta: nombre, contexto y fotografía como única prioridad.</span>
					</div>
					<div className="ciudad-propuesta-editorial-imagen">
						<img src={ciudad.image} alt={`${ciudad.city}, ${ciudad.country}`} />
					</div>
				</div>
			</section>

			<section className="ciudad-propuesta ciudad-propuesta-ficha" aria-labelledby="propuesta-ficha">
				<div className="ciudad-propuesta-contenedor container-xl">
					<div className="ciudad-propuesta-etiqueta"><span>02</span> Ficha de destino</div>
					<div className="ciudad-propuesta-ficha-imagen">
						<img src={ciudad.image} alt="" />
					</div>
					<div className="ciudad-propuesta-ficha-copy">
						<p>{ciudad.country}</p>
						<h2 id="propuesta-ficha">Una ciudad,<br />un punto de partida.</h2>
						<dl>
							<div><dt>Destino</dt><dd>{ciudad.city}</dd></div>
							<div><dt>Región</dt><dd>{ciudad.region}</dd></div>
							<div><dt>Enfoque</dt><dd>{ciudad.bestFor}</dd></div>
						</dl>
					</div>
				</div>
			</section>

			<section className="ciudad-propuesta ciudad-propuesta-cartel" aria-labelledby="propuesta-cartel">
				<img className="ciudad-propuesta-cartel-imagen" src={ciudad.image} alt="" />
				<div className="ciudad-propuesta-cartel-capa" />
				<div className="ciudad-propuesta-contenedor container-xl ciudad-propuesta-cartel-contenido">
					<div className="ciudad-propuesta-etiqueta"><span>03</span> Cartel inmersivo</div>
					<div>
						<p>{ciudad.country}</p>
						<h2 id="propuesta-cartel">{ciudad.city}</h2>
						<span>La imagen ocupa el primer plano y el nombre funciona como señal de entrada.</span>
					</div>
				</div>
			</section>
		</main>
	);
};
