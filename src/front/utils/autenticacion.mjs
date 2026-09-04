// src/front/utils/autenticacion.mjs
// ⚠️ ESTE ARCHIVO ES PARA EL FRONTEND (React)

/**
 * Cierra la sesión del usuario
 * @param {Storage} almacenamiento - localStorage o sessionStorage
 */
export const cerrarSesion = (almacenamiento = localStorage) => {
	almacenamiento.removeItem("token");
	almacenamiento.removeItem("refresh_token");
	almacenamiento.removeItem("user");
	
	// Redirigir al login
	window.location.href = '/login';
};

/**
 * Obtiene el mensaje de error del backend
 * @param {Object} datos - Respuesta del backend
 * @param {string} mensajePredeterminado - Mensaje por defecto
 * @returns {string}
 */
export const obtenerMensajeErrorBackend = (datos, mensajePredeterminado) => (
	datos?.msg || datos?.error || mensajePredeterminado
);

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export const estaAutenticado = () => {
	const token = localStorage.getItem('token');
	return token !== null && token !== undefined && token !== '';
};

/**
 * Obtiene el usuario actual
 * @returns {Object|null}
 */
export const obtenerUsuario = () => {
	try {
		const user = localStorage.getItem('user');
		return user ? JSON.parse(user) : null;
	} catch {
		return null;
	}
};

/**
 * Obtiene el token de autenticación
 * @returns {string|null}
 */
export const obtenerToken = () => {
	return localStorage.getItem('token');
};

/**
 * Obtiene el token de refresco
 * @returns {string|null}
 */
export const obtenerRefreshToken = () => {
	return localStorage.getItem('refresh_token');
};