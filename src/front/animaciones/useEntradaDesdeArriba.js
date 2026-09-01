import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export const useEntradaDesdeArriba = (elementoRef, opciones = {}) => {
	const {
		delay = 0,
		opacity = 0,
		position = -96,
		tiempo = 0.65,
	} = opciones;

	useGSAP(() => {
		if (!elementoRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return undefined;
		}

		const entrada = gsap.from(elementoRef.current, {
			delay,
			duration: tiempo,
			ease: "power3.out",
			opacity,
			y: position,
		});

		return () => entrada.kill();
	}, {
		dependencies: [tiempo, delay, position, opacity],
		revertOnUpdate: true,
		scope: elementoRef,
	});
};
