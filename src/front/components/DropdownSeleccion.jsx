import { useEffect, useRef, useState } from "react";

export const DropdownSeleccion = ({
	id,
	labelId,
	valor,
	opciones,
	alCambiar,
}) => {
	const [abierto, setAbierto] = useState(false);
	const contenedorRef = useRef(null);
	const botonRef = useRef(null);
	const opcionActual = opciones.find((opcion) => opcion.valor === valor);

	useEffect(() => {
		if (!abierto) {
			return undefined;
		}

		const cerrarAlHacerClickFuera = (event) => {
			if (!contenedorRef.current?.contains(event.target)) {
				setAbierto(false);
			}
		};

		const cerrarConEscape = (event) => {
			if (event.key === "Escape") {
				setAbierto(false);
				botonRef.current?.focus();
			}
		};

		document.addEventListener("mousedown", cerrarAlHacerClickFuera);
		document.addEventListener("keydown", cerrarConEscape);

		return () => {
			document.removeEventListener("mousedown", cerrarAlHacerClickFuera);
			document.removeEventListener("keydown", cerrarConEscape);
		};
	}, [abierto]);

	const seleccionarOpcion = (nuevoValor) => {
		alCambiar(nuevoValor);
		setAbierto(false);
		botonRef.current?.focus();
	};

	return (
		<div
			ref={contenedorRef}
			className="dropdown-seleccion"
		>
			<button
				ref={botonRef}
				id={id}
				type="button"
				className="dropdown-seleccion-boton"
				aria-expanded={abierto}
				aria-haspopup="listbox"
				aria-labelledby={`${labelId} ${id}`}
				onClick={() => setAbierto((actual) => !actual)}
			>
				<span>{opcionActual?.etiqueta}</span>
				<i
					className="fa-solid fa-chevron-down"
					aria-hidden="true"
				/>
			</button>

			{abierto && (
				<ul
					className="dropdown-seleccion-menu"
					role="listbox"
					aria-labelledby={labelId}
				>
					{opciones.map((opcion) => (
						<li key={opcion.valor}>
							<button
								type="button"
								className="dropdown-seleccion-opcion"
								role="option"
								aria-selected={opcion.valor === valor}
								onClick={() => seleccionarOpcion(opcion.valor)}
							>
								{opcion.etiqueta}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
