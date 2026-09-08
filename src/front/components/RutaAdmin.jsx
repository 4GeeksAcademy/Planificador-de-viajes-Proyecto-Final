import { Navigate, Outlet } from "react-router-dom";

export const RutaAdmin = () => {
	const user = JSON.parse(localStorage.getItem("user") || "null");

	if (!user?.is_admin) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
};
