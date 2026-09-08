import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export const useSplitEntrance = (containerRef, options = {}) => {
	const {
		distance = 120,
		duration = 1.3,
		delay = 0.15,
	} = options;

	useGSAP(() => {
		const container = containerRef.current;
		const movimientoReducido = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (!container || movimientoReducido) return undefined;

		const leftElement = container.querySelector(".split-left");
		const rightElement = container.querySelector(".split-right");

		if (!leftElement || !rightElement) return undefined;

		const entrada = gsap.timeline({ delay });
		entrada.from(leftElement, {
			x: -distance,
			opacity: 0,
			duration,
			ease: "power3.out",
		});
		entrada.from(
			rightElement,
			{
				x: distance,
				opacity: 0,
				duration,
				ease: "power3.out",
			},
			"<",
		);

		return () => entrada.kill();
	}, {
		dependencies: [distance, duration, delay],
		revertOnUpdate: true,
		scope: containerRef,
	});
};
