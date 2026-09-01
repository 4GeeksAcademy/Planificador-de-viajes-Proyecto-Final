import { useEffect, useRef, useState } from "react";

export const ModalConfirmacionEliminacion = ({
	visible,
	cargando,
	alCancelar,
	alConfirmar,
}) => {
	const [manteniendo, setManteniendo] = useState(false);
	const temporizadorRef = useRef(null);

	const limpiarTemporizador = () => {
		if (temporizadorRef.current) {
			window.clearTimeout(temporizadorRef.current);
			temporizadorRef.current = null;
		}
	};

	const cancelarConfirmacion = () => {
		limpiarTemporizador();
		setManteniendo(false);
	};

	useEffect(() => {
		return limpiarTemporizador;
	}, []);

	const cerrarModal = () => {
		if (cargando) {
			return;
		}

		cancelarConfirmacion();
		alCancelar();
	};

	const manejarFondoPresionado = (event) => {
		if (event.target === event.currentTarget) {
			cerrarModal();
		}
	};

	const iniciarConfirmacion = () => {
		if (cargando || temporizadorRef.current) {
			return;
		}

		setManteniendo(true);
		temporizadorRef.current = window.setTimeout(() => {
			temporizadorRef.current = null;
			setManteniendo(false);
			alConfirmar();
		}, 1000);
	};

	const manejarTeclaPresionada = (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			iniciarConfirmacion();
		}
	};

	const manejarTeclaLiberada = (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			cancelarConfirmacion();
		}
	};

	if (!visible) {
		return null;
	}

	return (
		<div
			className="modal-eliminacion-fondo"
			role="presentation"
			onMouseDown={manejarFondoPresionado}
		>
			<section
				className="modal-eliminacion"
				role="dialog"
				aria-modal="true"
				aria-labelledby="delete-trip-title"
			>
				<p
					className="text-uppercase fw-semibold mb-2"
					style={{
						color: "#078A9A",
						letterSpacing: "0.12em",
						fontSize: "0.75rem",
					}}
				>
					Acción irreversible
				</p>
				<h2
					id="delete-trip-title"
					className="h2 mb-3"
					style={{
						fontFamily: "Fraunces, Georgia, serif",
						color: "#12343B",
					}}
				>
					¿Eliminar este viaje?
				</h2>
				<p
					className="mb-4"
					style={{ color: "#456B75", lineHeight: 1.6 }}
				>
					Esta acción eliminará el viaje de forma permanente y no se puede deshacer.
				</p>
				<div className="d-flex flex-wrap justify-content-end gap-2">
					<button
						type="button"
						className="btn boton-cancelar-eliminacion px-3 py-2"
						disabled={cargando}
						onClick={cerrarModal}
					>
						Cancelar
					</button>
					<button
						type="button"
						className="btn boton-confirmar-eliminacion px-3 py-2"
						disabled={cargando}
						onPointerDown={iniciarConfirmacion}
						onPointerUp={cancelarConfirmacion}
						onPointerLeave={cancelarConfirmacion}
						onPointerCancel={cancelarConfirmacion}
						onKeyDown={manejarTeclaPresionada}
						onKeyUp={manejarTeclaLiberada}
					>
						<span className="position-relative">
							{cargando
								? "Eliminando..."
								: manteniendo
									? "Confirmando..."
									: "Mantén 1 segundo para confirmar"}
						</span>
						<span
							className={`progreso-confirmacion ${manteniendo ? "progreso-confirmacion-activo" : ""}`}
							aria-hidden="true"
						/>
					</button>
				</div>
			</section>
		</div>
	);
};
