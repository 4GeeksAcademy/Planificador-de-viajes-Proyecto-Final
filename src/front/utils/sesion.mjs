let renovacionEnCurso = null;

const obtenerUrlApi = () => `${import.meta.env.VITE_BACKEND_URL}/api`;

const renovarToken = async () => {
	if (renovacionEnCurso) return renovacionEnCurso;

	const refreshToken = localStorage.getItem("refresh_token");
	if (!refreshToken) return null;

	renovacionEnCurso = fetch(`${obtenerUrlApi()}/refresh`, {
		method: "POST",
		headers: { Authorization: `Bearer ${refreshToken}` },
	})
		.then(async (respuesta) => {
			const datos = await respuesta.json().catch(() => ({}));
			if (!respuesta.ok || !datos.token) throw new Error("La sesión ha expirado.");
			localStorage.setItem("token", datos.token);
			return datos.token;
		})
		.catch(() => {
			localStorage.removeItem("token");
			localStorage.removeItem("refresh_token");
			localStorage.removeItem("user");
			window.dispatchEvent(new Event("sesion-cambiada"));
			return null;
		})
		.finally(() => {
			renovacionEnCurso = null;
		});

	return renovacionEnCurso;
};

export const fetchConSesion = async (url, opciones = {}) => {
	const headers = new Headers(opciones.headers || {});
	const token = localStorage.getItem("token");
	if (token) headers.set("Authorization", `Bearer ${token}`);

	const respuesta = await fetch(url, { ...opciones, headers });
	if (respuesta.status !== 401 || !localStorage.getItem("refresh_token")) return respuesta;

	const nuevoToken = await renovarToken();
	if (!nuevoToken) return respuesta;

	const headersReintentados = new Headers(opciones.headers || {});
	headersReintentados.set("Authorization", `Bearer ${nuevoToken}`);
	return fetch(url, { ...opciones, headers: headersReintentados });
};
