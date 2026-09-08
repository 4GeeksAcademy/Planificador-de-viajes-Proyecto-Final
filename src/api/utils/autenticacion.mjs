export const cerrarSesion = (almacenamiento) => {
	almacenamiento.removeItem("token");
	almacenamiento.removeItem("refresh_token");
	almacenamiento.removeItem("user");
};

export const obtenerMensajeErrorBackend = (datos, mensajePredeterminado) => (
	datos?.msg || datos?.error || mensajePredeterminado
);
