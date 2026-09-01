import { Link } from "react-router-dom";
import {
	formatearFechaViaje,
	truncarNombreViaje,
} from "../utils/viajes.mjs";

export const TarjetaViaje = ({ viaje }) => {
	return (
		<div className="col-md-6 col-lg-4">
			<Link
				to={`/trips/${viaje.id}`}
				className="text-decoration-none d-block h-100"
			>
				<article
					className="h-100 p-4"
					style={{
						backgroundColor: "#FFFFFF",
						borderTop: "3px solid #28C3D4",
					}}
				>
					<h2
						className="h3 mb-3"
						style={{
							fontFamily: "Fraunces, Georgia, serif",
							color: "#12343B",
						}}
					>
						{truncarNombreViaje(viaje.name)}
					</h2>
					<p
						className="mb-0"
						style={{ color: "#456B75" }}
					>
						{formatearFechaViaje(viaje.start_date)} — {formatearFechaViaje(viaje.end_date)}
					</p>
				</article>
			</Link>
		</div>
	);
};
