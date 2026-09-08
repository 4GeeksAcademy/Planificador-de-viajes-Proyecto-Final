import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";

export const SelectorHorarioMUI = ({ value, onSave, onCancel }) => {
	const [valorTemporal, setValorTemporal] = useState(null);

	useEffect(() => {
		if (!value) {
			setValorTemporal(null);
			return;
		}
		const [horas, minutos] = value.slice(0, 5).split(":").map(Number);
		setValorTemporal(dayjs().hour(horas).minute(minutos).second(0).millisecond(0));
	}, [value]);

	const valorInicial = useMemo(() => valorTemporal || dayjs().hour(12).minute(0).second(0).millisecond(0), [valorTemporal]);

	return <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
		<StaticTimePicker
			value={valorInicial}
			onChange={setValorTemporal}
			views={["hours", "minutes"]}
			ampm={false}
			minutesStep={5}
			localeText={{ toolbarTitle: "Seleccionar horario" }}
			slotProps={{ actionBar: { actions: [] } }}
			sx={{
				width: "100%",
				"& .MuiPickersLayout-root": { width: "100%" },
				"& .MuiPickersLayout-contentWrapper": { width: "100%" },
				"& .MuiTimeClock-root": { width: "100%", maxWidth: "20rem", margin: "0 auto" },
				"& .MuiPickersToolbar-root": { padding: "0 0 1rem", backgroundColor: "transparent" },
				"& .MuiPickersToolbar-content": { alignItems: "baseline" },
				"& .MuiTimePickerToolbar-hourMinuteLabel": { color: "#12343B" },
				"& .MuiTypography-root": { fontFamily: "DM Sans, sans-serif" },
				"& .Mui-selected": { backgroundColor: "#078A9A !important" },
				"& .MuiClock-pin": { backgroundColor: "#078A9A" },
				"& .MuiClockPointer-root": { backgroundColor: "#078A9A" },
				"& .MuiClockPointer-thumb": { backgroundColor: "#078A9A", borderColor: "#078A9A" }
			}}
		/>
		<div className="d-flex justify-content-end gap-2 mt-3">
			<button type="button" onClick={onCancel} className="btn btn-sm px-3 rounded-0" style={{ color: "#456B75", border: "1px solid #B8DCE3" }}>
				Cancelar
			</button>
			<button type="button" onClick={() => onSave(valorTemporal ? valorTemporal.format("HH:mm") : "")} disabled={!valorTemporal} className="btn btn-sm px-3 rounded-0" style={{ backgroundColor: "#12343B", color: "#FFFFFF" }}>
				Guardar horario
			</button>
		</div>
	</LocalizationProvider>;
};

SelectorHorarioMUI.propTypes = {
	value: PropTypes.string,
	onSave: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired
};
