import json
import math
import os

from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


_URL_CONFIGURADA = os.getenv("OVERPASS_URL")
OVERPASS_URLS = tuple(
    dict.fromkeys(
        url
        for url in (
            _URL_CONFIGURADA,
            "https://overpass-api.de/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
        )
        if url
    )
)
RADIO_METROS = 5000
TIMEOUT_SEGUNDOS = 30

GRUPOS_LUGARES = {
    "turismo_cultura": {
        "limit": 17,
        "categorias": [
            ("attraction", "tourism", "attraction"),
            ("museum", "tourism", "museum"),
            ("monument", "historic", "monument"),
            ("gallery", "tourism", "gallery"),
        ],
    },
    "comida": {
        "limit": 15,
        "categorias": [
            ("restaurant", "amenity", "restaurant"),
            ("cafe", "amenity", "cafe"),
            ("fast_food", "amenity", "fast_food"),
        ],
    },
    "vida_nocturna": {
        "limit": 15,
        "categorias": [
            ("bar", "amenity", "bar"),
            ("pub", "amenity", "pub"),
            ("nightclub", "amenity", "nightclub"),
        ],
    },
    "alojamiento": {
        "limit": 20,
        "categorias": [
            ("hotel", "tourism", "hotel"),
            ("hostel", "tourism", "hostel"),
            ("guest_house", "tourism", "guest_house"),
        ],
    },
    "paseos": {
        "limit": 10,
        "categorias": [
            ("pier", "man_made", "pier"),
            ("marina", "leisure", "marina"),
            ("pedestrian", "highway", "pedestrian"),
            ("park", "leisure", "park"),
            ("viewpoint", "tourism", "viewpoint"),
        ],
    },
}


class OverpassError(Exception):
    def __init__(self, message, status_code=502):
        super().__init__(message)
        self.status_code = status_code


def validar_coordenada(valor, minimo, maximo, nombre):
    try:
        coordenada = float(valor)
    except (TypeError, ValueError):
        raise ValueError("El parámetro {} debe ser un número válido.".format(nombre))

    if not math.isfinite(coordenada) or not minimo <= coordenada <= maximo:
        raise ValueError("El parámetro {} está fuera de rango.".format(nombre))

    return coordenada


def _crear_consulta(latitud, longitud, grupo):
    around = "around:{},{},{}".format(RADIO_METROS, latitud, longitud)
    clauses = []

    for _, clave, valor in grupo["categorias"]:
        selector = '[{}="{}"]'.format(clave, valor)
        clauses.append("node{}({});".format(selector, around))
        clauses.append("way{}({});".format(selector, around))

    return "[out:json][timeout:25];({});out center {};".format(
        "".join(clauses), grupo["limit"]
    )


def _normalizar_elemento(elemento, categorias):
    tags = elemento.get("tags", {})
    categoria = next(
        (
            nombre
            for nombre, clave, valor in categorias
            if tags.get(clave) == valor
        ),
        "attraction",
    )
    latitud = elemento.get("lat") or elemento.get("center", {}).get("lat")
    longitud = elemento.get("lon") or elemento.get("center", {}).get("lon")

    if not tags.get("name") or latitud is None or longitud is None:
        return None

    return {
        "id": "{}/{}".format(elemento.get("type"), elemento.get("id")),
        "category": categoria,
        "name": tags["name"],
        "latitude": latitud,
        "longitude": longitud,
        "address": tags.get("addr:street", "Dirección no disponible"),
    }


def _consultar_grupo(latitud, longitud, grupo):
    consulta = _crear_consulta(latitud, longitud, grupo)
    ultimo_error = None

    for url in OVERPASS_URLS:
        solicitud = Request(
            url,
            data=urlencode({"data": consulta}).encode("utf-8"),
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Planificador-de-viajes/1.0",
            },
            method="POST",
        )

        try:
            with urlopen(solicitud, timeout=TIMEOUT_SEGUNDOS) as respuesta:
                estado = respuesta.status
                contenido = respuesta.read()
        except HTTPError as error:
            estado = error.code
            contenido = None
        except (URLError, OSError, TimeoutError):
            ultimo_error = "No se pudo conectar con el servicio de lugares."
            continue

        if estado == 200 and contenido is not None:
            try:
                datos = json.loads(contenido.decode("utf-8"))
            except (AttributeError, UnicodeDecodeError, json.JSONDecodeError):
                ultimo_error = "El servicio de lugares devolvió una respuesta inválida."
                continue

            return [
                lugar
                for elemento in datos.get("elements", [])
                for lugar in [_normalizar_elemento(elemento, grupo["categorias"])]
                if lugar is not None
            ]

        if estado in (429, 500, 502, 503, 504):
            ultimo_error = "El servicio de lugares no está disponible en este momento."
            continue

        raise OverpassError(
            "El servicio de lugares respondió con HTTP {}.".format(estado)
        )

    raise OverpassError(ultimo_error or "No se pudo conectar con el servicio de lugares.")


def buscar_lugares(latitud, longitud, nombre_grupo):
    try:
        grupo = GRUPOS_LUGARES[nombre_grupo]
    except KeyError:
        raise ValueError("El parámetro grupo no es válido.")

    return _consultar_grupo(latitud, longitud, grupo)
