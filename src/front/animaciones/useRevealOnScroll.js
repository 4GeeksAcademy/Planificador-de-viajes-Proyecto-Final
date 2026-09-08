import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const useRevealOnScroll = (
	targetRef,
	direction = "left",
	options = {},
) => {
	const {
		distance = 120,
		duration = 1,
		delay = 0,
		start = "top 85%",
		once = true,
	} = options;

	useGSAP(() => {
		const element = targetRef.current;
		const movimientoReducido = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (!element || movimientoReducido) return undefined;

		const initialX = direction === "right" ? distance : -distance;
		const entrada = gsap.from(element, {
			x: initialX,
			opacity: 0,
			duration,
			delay,
			ease: "power3.out",
			scrollTrigger: {
				trigger: element,
				start,
				once,
			},
		});

		return () => entrada.kill();
	}, {
		dependencies: [direction, distance, duration, delay, start, once],
		scope: targetRef,
		revertOnUpdate: true,
	});
};
