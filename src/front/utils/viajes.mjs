const mesesCortos = [
	"ene",
	"feb",
	"mar",
	"abr",
	"may",
	"jun",
	"jul",
	"ago",
	"sept",
	"oct",
	"nov",
	"dic",
];

export const obtenerFechaMinimaViaje = (fechaActual) => {
	const year = fechaActual.getFullYear();
	const mes = String(fechaActual.getMonth() + 1).padStart(2, "0");
	const dia = String(fechaActual.getDate()).padStart(2, "0");
	return `${year}-${mes}-${dia}`;
};

export const validarFechaInicioViaje = (fechaInicio, fechaMinima) => {
	if (fechaInicio < fechaMinima) {
		return "La fecha de inicio no puede ser anterior a hoy.";
	}

	return "";
};

export const validarFechasViaje = (fechaInicio, fechaFin) => {
	if (fechaFin <= fechaInicio) {
		return "La fecha de regreso debe ser posterior a la fecha de inicio.";
	}

	return "";
};

export const ordenarViajes = (viajes, criterio, direccion) => {
	const factor = direccion === "desc" ? -1 : 1;

	return [...viajes].sort((viajeA, viajeB) => (
		String(viajeA[criterio] || "").localeCompare(
			String(viajeB[criterio] || ""),
			"es"
		) * factor
	));
};

export const truncarNombreViaje = (nombre, limite = 18) => {
	if (nombre.length <= limite) {
		return nombre;
	}

	return `${nombre.slice(0, limite)}...`;
};

export const formatearFechaViaje = (fechaIso) => {
	if (!fechaIso) {
		return "Sin fecha";
	}

	const [year, mes, dia] = fechaIso.split("-");
	return `${Number(dia)} ${mesesCortos[Number(mes) - 1]} ${year}`;
};
