import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export const CargadorMapa = () => {
	const contenedorRef = useRef(null);
	const puntosRef = useRef([]);

	useGSAP(() => {
		const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (movimientoReducido) return undefined;

		const salto = gsap.timeline({ repeat: -1, repeatDelay: 0.15 });
		puntosRef.current.forEach((punto) => {
			salto
				.to(punto, { duration: 0.18, ease: "power1.out", y: -10 })
				.to(punto, { duration: 0.18, ease: "power1.in", y: 0 });
		});

		return () => salto.kill();
	}, {
		dependencies: [],
		revertOnUpdate: true,
		scope: contenedorRef,
	});

	return (
		<div
			ref={contenedorRef}
			aria-label="Cargando lugares de la ciudad"
			aria-live="polite"
			role="status"
			style={{
				alignItems: "center",
				color: "#12343B",
				display: "flex",
				flexDirection: "column",
				fontFamily: "DM Sans, sans-serif",
				fontWeight: 600,
				gap: "0.85rem",
				inset: 0,
				justifyContent: "center",
				pointerEvents: "none",
				position: "absolute",
				textShadow: "0 1px 2px #FFFFFF",
				zIndex: 700,
			}}
		>
			<div
				aria-hidden="true"
				style={{
					alignItems: "center",
					display: "flex",
					gap: "0.45rem",
					minHeight: "1.5rem",
				}}
			>
				{Array.from({ length: 3 }, (_, indice) => (
					<span
						ref={(elemento) => { puntosRef.current[indice] = elemento; }}
						key={indice}
						style={{
							alignSelf: "center",
							aspectRatio: "1 / 1",
							backgroundColor: "#078A9A",
							borderRadius: "50%",
							display: "block",
							flex: "0 0 0.85rem",
							height: "0.85rem",
							maxWidth: "0.85rem",
							minWidth: "0.85rem",
							width: "0.85rem",
						}}
					/>
				))}
			</div>
			<p className="mb-0">Buscando lugares...</p>
		</div>
	);
};
