import json
import os
from functools import lru_cache
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


NOMINATIM_URL = os.getenv(
    "NOMINATIM_URL",
    "https://nominatim.openstreetmap.org/reverse",
)
TIMEOUT_SEGUNDOS = 10


class NominatimError(Exception):
    def __init__(self, message, status_code=502):
        super().__init__(message)
        self.status_code = status_code


def _obtener_ciudad(direccion):
    return (
        direccion.get("city")
        or direccion.get("town")
        or direccion.get("village")
        or direccion.get("municipality")
        or ""
    )


@lru_cache(maxsize=256)
def buscar_direccion(latitud, longitud):
    parametros = urlencode(
        {
            "lat": latitud,
            "lon": longitud,
            "format": "jsonv2",
            "addressdetails": 1,
            "accept-language": "es",
        }
    )
    solicitud = Request(
        "{}?{}".format(NOMINATIM_URL, parametros),
        headers={
            "Accept": "application/json",
            "User-Agent": "Planificador-de-viajes/1.0 (proyecto educativo)",
        },
        method="GET",
    )

    try:
        with urlopen(solicitud, timeout=TIMEOUT_SEGUNDOS) as respuesta:
            if respuesta.status != 200:
                raise NominatimError(
                    "Nominatim respondió con HTTP {}.".format(respuesta.status)
                )
            datos = json.loads(respuesta.read().decode("utf-8"))
    except HTTPError as error:
        if error.code == 429:
            raise NominatimError(
                "Nominatim limitó temporalmente las consultas.", 429
            )
        raise NominatimError(
            "Nominatim respondió con HTTP {}.".format(error.code)
        )
    except (URLError, OSError, TimeoutError):
        raise NominatimError("No se pudo conectar con Nominatim.")
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise NominatimError("Nominatim devolvió una respuesta inválida.")

    direccion = datos.get("address", {})
    calle = direccion.get("road") or direccion.get("pedestrian") or ""
    numero = direccion.get("house_number") or ""
    ciudad = _obtener_ciudad(direccion)
    partes = [" ".join(parte for parte in (calle, numero) if parte), ciudad]

    return {
        "address": ", ".join(parte for parte in partes if parte)
        or datos.get("display_name", "Dirección no disponible"),
        "road": calle,
        "house_number": numero,
        "city": ciudad,
        "country": direccion.get("country", ""),
        "display_name": datos.get("display_name", ""),
        "source": "Nominatim / OpenStreetMap",
    }
