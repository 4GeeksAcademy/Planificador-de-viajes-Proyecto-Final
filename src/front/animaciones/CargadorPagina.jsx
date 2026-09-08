import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export const CargadorPagina = () => {
	const contenedorRef = useRef(null);
	const puntosRef = useRef([]);

	useGSAP(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return undefined;
		}

		const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.1 });
		puntosRef.current.forEach((punto, indice) => {
			timeline
				.to(punto, {
					duration: 0.22,
					ease: "power2.out",
					y: -9,
					delay: indice * 0.04,
				})
				.to(punto, {
					duration: 0.22,
					ease: "power2.in",
					y: 0,
				});
		});

		return () => timeline.kill();
	}, { scope: contenedorRef, revertOnUpdate: true });

	return (
		<div
			ref={contenedorRef}
			className="cargador-pagina"
			role="status"
			aria-live="polite"
			aria-label="Cargando página"
		>
			<div className="cargador-pagina-puntos" aria-hidden="true">
				{Array.from({ length: 3 }, (_, indice) => (
					<span
						key={indice}
						ref={(elemento) => { puntosRef.current[indice] = elemento; }}
					/>
				))}
			</div>
			<span>Cargando...</span>
		</div>
	);
};
