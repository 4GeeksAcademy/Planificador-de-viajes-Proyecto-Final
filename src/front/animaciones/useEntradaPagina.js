import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export const useEntradaPagina = (paginaRef) => {
	useGSAP(() => {
		const pagina = paginaRef.current;
		if (!pagina || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return undefined;
		}

		const entrada = gsap.fromTo(
			pagina,
			{ autoAlpha: 0, y: 18 },
			{ autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out" },
		);

		return () => entrada.kill();
	}, { scope: paginaRef, revertOnUpdate: true });
};
