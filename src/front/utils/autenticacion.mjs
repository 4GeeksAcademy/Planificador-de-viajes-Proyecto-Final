export const cerrarSesion = (almacenamiento = localStorage) => {
	almacenamiento.removeItem("token");
	almacenamiento.removeItem("refresh_token");
	almacenamiento.removeItem("user");
	
	window.location.href = '/login';
};

export const obtenerMensajeErrorBackend = (datos, mensajePredeterminado) => (
	datos?.msg || datos?.error || mensajePredeterminado
);

export const estaAutenticado = () => {
	const token = localStorage.getItem('token');
	return token !== null && token !== undefined && token !== '';
};

export const obtenerUsuario = () => {
	try {
		const user = localStorage.getItem('user');
		return user ? JSON.parse(user) : null;
	} catch {
		return null;
	}
};

export const obtenerToken = () => {
	return localStorage.getItem('token');
};


export const obtenerRefreshToken = () => {
	return localStorage.getItem('refresh_token');
};