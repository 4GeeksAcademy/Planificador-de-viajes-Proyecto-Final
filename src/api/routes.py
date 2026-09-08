"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import request, jsonify, Blueprint
from api.models import db, User, Trip, Destination, Activity, Place, Favorite
from api.overpass import OverpassError, buscar_lugares, validar_coordenada
from api.nominatim import NominatimError, buscar_direccion
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (create_access_token, create_refresh_token, jwt_required, get_jwt_identity, verify_jwt_in_request)
from datetime import date, datetime, timedelta, time as datetime_time
from functools import wraps
from sqlalchemy import func, or_
import re
from api.utils.verification import (
    generar_token_verificacion,
    verificar_token,
    generar_token_recuperacion,
    verificar_token_recuperacion
)
from api.utils.email import enviar_correo_verificacion, enviar_correo_recuperacion
api = Blueprint('api', __name__)


def admin_required(view):
    """Allow access only to authenticated users marked as administrators."""
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        verify_jwt_in_request()
        current_user = User.query.get(get_jwt_identity())
        if not current_user or not current_user.is_admin:
            return jsonify({"msg": "Se requieren permisos de administrador."}), 403
        return view(*args, **kwargs)

    return wrapped_view


@api.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200


@api.route('/explorar/lugares', methods=['GET'])
def get_explorar_lugares():
    try:
        latitud = validar_coordenada(request.args.get("lat"), -90, 90, "lat")
        longitud = validar_coordenada(request.args.get("lon"), -180, 180, "lon")
        lugares = buscar_lugares(latitud, longitud, request.args.get("grupo"))
    except ValueError as error:
        return jsonify({"msg": str(error)}), 400
    except OverpassError as error:
        return jsonify({"msg": str(error)}), error.status_code

    return jsonify({"places": lugares}), 200


@api.route('/explorar/direccion', methods=['GET'])
def get_explorar_direccion():
    try:
        latitud = validar_coordenada(request.args.get("lat"), -90, 90, "lat")
        longitud = validar_coordenada(request.args.get("lon"), -180, 180, "lon")
        direccion = buscar_direccion(round(latitud, 6), round(longitud, 6))
    except ValueError as error:
        return jsonify({"msg": str(error)}), 400
    except NominatimError as error:
        return jsonify({"msg": str(error)}), error.status_code

    return jsonify(direccion), 200


@api.route('/signup', methods=['POST'])
def signup():
    data = request.json
    
    existing_user = User.query.filter(
        or_(User.email == data["email"], User.username == data["username"])
    ).first()
    
    if existing_user:
        return jsonify({"error": "Usuario o email no disponible"}), 409
    
    token = generar_token_verificacion(data["email"])
    
    if not token:
        return jsonify({"error": "Error al generar token de verificación"}), 500
    
    new_user = User(
        username=data["username"],
        email=data["email"],
        password_hash=generate_password_hash(data["password"]),
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        is_active=False,
        is_verified=False,
        verification_token=token,
        verification_token_expires_at=datetime.utcnow() + timedelta(hours=1)
    )

    db.session.add(new_user)
    db.session.commit()
    
    email_sent = enviar_correo_verificacion(data["email"], token)
    
    if email_sent:
        return jsonify({
            "message": "Usuario creado exitosamente. Revisa tu correo para verificar tu cuenta.",
            "email": data["email"]
        }), 201
    else:
        return jsonify({
            "message": "Usuario creado pero no se pudo enviar el correo de verificación.",
            "email": data["email"]
        }), 201
        
@api.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    from api.utils.verification import verificar_token_recuperacion
    #verificar el token
    email = verificar_token_recuperacion(token)
    if not email:
        return jsonify({"error": "Token inválido o expirado"}), 400
    #buscar usuario
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if not user.is_verified:
        return jsonify({
            "error": "Debes confirmar tu correo antes de cambiar la contraseña.",
            "requires_verification": True
        }), 403

    #obtener nueva contraseña
    data = request.json
    new_password = data.get("new_password")
    
    if not new_password:
        return jsonify({"error": "La nueva contraseña es requerida"}), 400
    
    if len(new_password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400
    
    #actualizar contraseña
    user.password_hash = generate_password_hash(new_password)
    user.verification_token = None #limpiar token
    db.session.commit()
    
    return jsonify({"message": "Contraseña actualizada exitosamente. Ya puedes inicar sesión."}), 200


@api.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({"user": user.serialize()}), 200


@api.route('/profile', methods=['PATCH'])
@jwt_required()
def update_profile():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json(silent=True) or {}
    allowed_fields = {"first_name", "last_name", "username", "email"}
    unknown_fields = set(data) - allowed_fields
    if unknown_fields:
        return jsonify({"error": "Solo se pueden actualizar los datos del perfil."}), 400

    username = str(data.get("username", user.username)).strip()
    email = str(data.get("email", user.email)).strip().lower()
    if not username or not email:
        return jsonify({"error": "El nombre de usuario y el correo son obligatorios."}), 400

    username_owner = User.query.filter(User.username == username, User.id != user.id).first()
    if username_owner:
        return jsonify({"error": "El nombre de usuario ya está registrado."}), 409

    email_owner = User.query.filter(User.email == email, User.id != user.id).first()
    if email_owner:
        return jsonify({"error": "El correo ya está registrado."}), 409

    email_changed = email != user.email
    user.first_name = str(data.get("first_name", user.first_name or "")).strip()
    user.last_name = str(data.get("last_name", user.last_name or "")).strip()
    user.username = username
    user.email = email

    if email_changed:
        user.is_verified = False
        user.is_active = False
        user.verification_token = generar_token_verificacion(email)
        user.verification_token_expires_at = datetime.utcnow() + timedelta(hours=1)

    db.session.commit()

    if email_changed:
        enviar_correo_verificacion(email, user.verification_token)

    return jsonify({
        "user": user.serialize(),
        "message": "Perfil actualizado correctamente."
            if not email_changed else
            "Perfil actualizado. Confirma tu nuevo correo para volver a iniciar sesión."
    }), 200


@api.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email') 
    
    if not email:
        return jsonify({"error": "El email es requerido"}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if user:
        token = generar_token_recuperacion(email)
        if token:
            user.verification_token = token
            db.session.commit()
            enviar_correo_recuperacion(email, token)
    
    return jsonify({
        "message": "Si el email está registrado, recibirás un enlace para restablecer tu contraseña."
    }), 200
    
@api.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    email = verificar_token(token)
    if not email:
        return jsonify({
            "error": "Token inválido o expirado",
            "can_resend": True
        }), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if user.verification_token_expires_at and user.verification_token_expires_at < datetime.utcnow():
        return jsonify({
            "error": "El token ha expirado. Solicita un nuevo enlace.",
            "can_resend": True
        }), 400

    if user.is_verified:
        return jsonify({"message": "El correo ya ha sido verificado."}), 200

    user.is_verified = True
    user.is_active = True
    user.verified_at = datetime.utcnow()
    user.verification_token = None
    user.verification_token_expires_at = None
    db.session.commit()

    return jsonify({"message": "¡Correo verificado exitosamente!"}), 200


@api.route('/resend-verification', methods=['POST'])
def resend_verification():
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({"error": "El email es requerido"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or user.is_verified:
        return jsonify({
            "message": "Si el email está registrado y pendiente de verificación, recibirás un nuevo enlace."
        }), 200

    new_token = generar_token_verificacion(email)
    if not new_token:
        return jsonify({"error": "Error al generar el token"}), 500

    user.verification_token = new_token
    user.verification_token_expires_at = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    email_sent = enviar_correo_verificacion(email, new_token)

    if email_sent:
        return jsonify({
            "message": "¡Nuevo enlace de verificación enviado! Revisa tu correo (incluyendo SPAM)."
        }), 200

    return jsonify({
        "message": "No se pudo enviar el correo. Intenta de nuevo más tarde."
    }), 500
    
@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    identifier = data.get("identifier") or data.get("email") or data.get("username")
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"msg": "Falta el identificador (email/usuario) o la contraseña"}), 400

    existing_user = User.query.filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()

    if not existing_user:
        return jsonify({"msg": "El usuario o la contraseña son incorrectos"}), 404
    
    if not existing_user.is_verified:
        return jsonify({
        "msg": "Verifica tu correo antes de iniciar sesión.",
        "requires_verification": True,
        "email": existing_user.email
    }), 403

    if not check_password_hash(existing_user.password_hash, password):
        return jsonify({"msg": "El usuario o la contraseña son incorrectos"}), 401

    access_token = create_access_token(identity=str(existing_user.id))
    refresh_token = create_refresh_token(identity=str(existing_user.id))

    return jsonify({
        "msg": "Inicio de sesión exitoso",
        "token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": existing_user.id,
            "username": existing_user.username,
            "email": existing_user.email,
            "is_admin": existing_user.is_admin
        }
    }), 200

    
@api.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    return jsonify({"token": create_access_token(identity=str(current_user_id))}), 200


@api.route('/private', methods=['GET'])
@jwt_required()
def private():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@api.route('/trips', methods=['POST'])#Crear trip
@jwt_required()
def create_trip():
    data = request.json
    current_user_id = get_jwt_identity()
    
    new_trip = Trip(
        name= data["name"],
        start_date= data["start_date"],
        end_date= data["end_date"],
        user_id= current_user_id
    )
    db.session.add(new_trip)
    db.session.commit()
    return jsonify(new_trip.serialize()), 201

@api.route('/trips', methods=['GET']) # Listar todos los trips
@jwt_required()
def get_trips():
    current_user_id = get_jwt_identity()
    existing_user_trips = Trip.query.filter_by(user_id=current_user_id).all()
    trips_serialized =[trip.serialize() for trip in existing_user_trips]
    return jsonify(trips_serialized), 200

@api.route('/trips/<int:trip_id>', methods=['GET']) #Listar un solo trip
@jwt_required()
def get_trip(trip_id):
        trip = Trip.query.get(trip_id)
        if not trip:
            return jsonify ({"error": "Viaje no encontrado"}), 404
        
        current_user_id = get_jwt_identity()
        if str(trip.user_id) != current_user_id:
            return jsonify ({"error": "No tienes permisos sobre este viaje"}), 403
        return jsonify(trip.serialize()), 200
        
@api.route('/trips/<int:trip_id>', methods=['PUT']) #Actualizar un trip
@jwt_required()
def update_trip(trip_id):
    data = request.json
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify ({"error": "Viaje no encontrado"}), 404
    
    current_user_id = get_jwt_identity()
    if str(trip.user_id) != current_user_id:
        return jsonify ({"error": "No tienes permisos sobre este viaje"}), 403
    
    trip.name = data.get("name", trip.name)
    trip.start_date = date.fromisoformat(data["start_date"]) if data.get("start_date") else trip.start_date
    trip.end_date = date.fromisoformat(data["end_date"]) if data.get("end_date") else trip.end_date

    db.session.commit()
    return jsonify(trip.serialize()), 200

@api.route('/trips/<int:trip_id>', methods=['DELETE']) #Borrar un trip
@jwt_required()
def delete_trip(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Viaje no encontrado"}), 404
    current_user_id = get_jwt_identity()
    if str(trip.user_id) != current_user_id:
        return jsonify ({"error": "No tienes permisos sobre este viaje"}), 403
    trip_name = trip.name
    db.session.delete(trip)
    db.session.commit()
    return jsonify({"message": f"Viaje '{trip_name}' eliminado correctamente"}), 200

@api.route('/trips/<int:trip_id>/itinerary', methods=['GET'])
@jwt_required()
def get_itinerary(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Viaje no encontrado"}), 404
    
    current_user_id = get_jwt_identity()
    if str(trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre este viaje"}), 403
    
    date_param = request.args.get("date")
    date_converted = date.fromisoformat(date_param) if date_param else None
    activities = Activity.query.join(Destination).filter(
        Destination.trip_id == trip_id,
        Activity.date == date_converted
    ).order_by(Activity.time).all()
    return jsonify([activity.serialize() for activity in activities]), 200

@api.route('/destinations/<int:destination_id>', methods=['GET'])
@jwt_required()
def get_destination(destination_id):
    destination = Destination.query.get(destination_id)
    if not destination:
        return jsonify({"error": "Destino no encontrado"}), 404
    current_user_id = get_jwt_identity()
    if str(destination.trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre este destino"}), 403
    
    return jsonify(destination.serialize()), 200


@api.route('/trips/<int:trip_id>/destinations', methods=['POST'])
@jwt_required()
def create_destination(trip_id):
    data = request.json
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify ({"error": "Viaje no encontrado"}), 404
    current_user_id = get_jwt_identity()
    if str(trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre este viaje"}), 403
    destino_actual = Destination.query.filter_by(trip_id=trip_id).order_by(Destination.id.desc()).first()
    if destino_actual:
        destinos_del_viaje = Destination.query.filter_by(trip_id=trip_id).all()
        for destino_relacionado in destinos_del_viaje:
            Activity.query.filter_by(destination_id=destino_relacionado.id).delete(synchronize_session=False)
            if destino_relacionado.id != destino_actual.id:
                db.session.delete(destino_relacionado)
        destino_actual.name = data["name"]
        destino_actual.country = data["country"]
        db.session.commit()
        return jsonify(destino_actual.serialize()), 200

    new_destination = Destination(
            name= data["name"],
            country= data["country"],
            trip_id= trip_id
        )
    db.session.add(new_destination)
    db.session.commit()
    return jsonify(new_destination.serialize()), 201

@api.route('/trips/<int:trip_id>/destinations', methods=['GET'])
@jwt_required()
def get_destinations(trip_id):
    trip= Trip.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Viaje no encontrado"}), 404
    current_user_id = get_jwt_identity()
    if str(trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre este viaje"}), 403
    destino_actual = Destination.query.filter_by(trip_id=trip_id).order_by(Destination.id.desc()).first()
    return jsonify([destino_actual.serialize()] if destino_actual else []), 200


@api.route('/destinations/<int:destination_id>', methods=['PUT'])
@jwt_required()
def update_destination(destination_id):
    data = request.json
    destination = Destination.query.get(destination_id)
    if not destination:
        return jsonify({"error": "destino no encontrado"}), 404
    current_user_id = get_jwt_identity()
    if str(destination.trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre este viaje"}), 403
    destinos_del_viaje = Destination.query.filter_by(trip_id=destination.trip_id).all()
    for destino_relacionado in destinos_del_viaje:
        Activity.query.filter_by(destination_id=destino_relacionado.id).delete(synchronize_session=False)
        if destino_relacionado.id != destination_id:
            db.session.delete(destino_relacionado)

    destination.name = data.get("name", destination.name)
    destination.country = data.get("country", destination.country)
    db.session.commit()
    return jsonify(destination.serialize()), 200

@api.route('/destinations/<int:destination_id>', methods=['DELETE']) #Borrar un destino
@jwt_required()
def delete_destination(destination_id):
    destination = Destination.query.get(destination_id)
    if not destination:
        return jsonify({"error": "destino no encontrado"}), 404
    current_user_id = get_jwt_identity()
    if str(destination.trip.user_id) != current_user_id:
        return jsonify ({"error": "No tienes permisos sobre este destino"}), 403
    destination_name = destination.name
    db.session.delete(destination)
    db.session.commit()
    return jsonify({"message": f"Destino '{destination_name}' eliminado correctamente"}), 200

@api.route('/activities/<int:activity_id>', methods=['GET'])
@jwt_required()
def get_activity(activity_id):
    activity = Activity.query.get(activity_id)
    if not activity:
        return jsonify({"error": "Actividad no encontrada"}), 404
    current_user_id = get_jwt_identity()
    if str(activity.destination.trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre esta actividad"}), 403
    return jsonify(activity.serialize()), 200

@api.route('/destinations/<int:destination_id>/activities', methods=['POST'])
@jwt_required()
def create_activity(destination_id):
    data = request.json
    destination = Destination.query.get(destination_id)
    if not destination:
        return jsonify({"error": "Destino no encontrado"}), 404
    current_user_id = get_jwt_identity()
    if str(destination.trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre esta actividad"}), 403
    new_activity = Activity(
        name=data["name"],
        date=date.fromisoformat(data["date"]) if data.get("date") else None,
        time=datetime_time.fromisoformat(data["time"]) if data.get("time") else None,
        notes=data.get("notes"),
        place_ref=data.get("place_id"),
        place_category=data.get("place_category"),
        place_address=data.get("place_address"),
        place_city=data.get("place_city"),
        place_source=data.get("place_source"),
        place_latitude=data.get("place_latitude"),
        place_longitude=data.get("place_longitude"),
        destination_id=destination_id
    )   
    db.session.add(new_activity)
    db.session.commit()
    
    return jsonify(new_activity.serialize()), 201

@api.route('/destinations/<int:destination_id>/activities', methods=['GET'])
@jwt_required()
def get_activities(destination_id):
    destination = Destination.query.get(destination_id)
    if not destination:
        return jsonify({"error": "Destino no encontrado"}), 404
    current_user_id = get_jwt_identity()
    if str(destination.trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre este destino"}), 403
    activities = Activity.query.filter_by(destination_id = destination_id).all()
    return jsonify([activity.serialize() for activity in activities]), 200

@api.route('/activities/<int:activity_id>', methods=['PUT'])
@jwt_required()
def update_activity(activity_id):
    data = request.json
    activity = Activity.query.get(activity_id)
    if not activity:
        return jsonify({"error": "Actividad no encontrada"}), 404
    current_user_id = get_jwt_identity()
    if str(activity.destination.trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre esta actividad"}), 403
    activity.name = data.get("name", activity.name)
    activity.date = date.fromisoformat(data["date"]) if data.get("date") else activity.date
    if "time" in data:
        activity.time = datetime_time.fromisoformat(data["time"]) if data["time"] else None
    activity.notes = data.get("notes", activity.notes)
    activity.place_ref = data.get("place_id", activity.place_ref)
    activity.place_category = data.get("place_category", activity.place_category)
    activity.place_address = data.get("place_address", activity.place_address)
    activity.place_city = data.get("place_city", activity.place_city)
    activity.place_source = data.get("place_source", activity.place_source)
    activity.place_latitude = data.get("place_latitude", activity.place_latitude)
    activity.place_longitude = data.get("place_longitude", activity.place_longitude)
    
    db.session.commit()
    return jsonify(activity.serialize()), 200

@api.route('/activities/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity(activity_id):
    activity = Activity.query.get(activity_id)
    if not activity:
        return jsonify({"error": "Actividad no encontrada"}), 404
    current_user_id = get_jwt_identity()
    if str(activity.destination.trip.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre esta actividad"}), 403
    activity_name = activity.name
    db.session.delete(activity)
    db.session.commit()
    return jsonify({"message": f"Actividad `{activity_name}` eliminada correctamente"}), 200

@api.route('/places', methods=['GET'])
@jwt_required()
def get_places():
    places = Place.query.all()
    return jsonify([place.serialize() for place in places]), 200
    
@api.route('/places/<int:place_id>', methods=['GET'])
@jwt_required()
def get_place(place_id):
    place = Place.query.get(place_id)
    if not place:
        return jsonify({"error": "Lugar no encontrado"}), 404
    return jsonify(place.serialize()), 200

@api.route('/places/<int:place_id>/favorites', methods=['POST'])
@jwt_required()
def create_favorite(place_id):
    place = Place.query.get(place_id)
    if not place: 
        return jsonify({"error": "Lugar no encontrado"}), 404
    current_user_id = get_jwt_identity()
    existing_favorite = Favorite.query.filter_by(user_id=current_user_id, place_id=place_id).first()
    if existing_favorite:
        return jsonify({"error": "Ya tienes este lugar en tus favoritos"}), 409
    new_favorite = Favorite(user_id=current_user_id, place_id=place_id)
    db.session.add(new_favorite)
    db.session.commit()
    return jsonify(new_favorite.serialize()), 201

@api.route('/favorites', methods=['POST'])
@jwt_required()
def create_map_favorite():
    data = request.get_json(silent=True) or {}
    place_ref = str(data.get("id") or data.get("place_ref") or "").strip()
    name = str(data.get("name") or "").strip()
    city = str(data.get("city") or "").strip()

    if not place_ref or not name or not city:
        return jsonify({"msg": "El lugar debe incluir un identificador, nombre y ciudad."}), 400

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if latitude is None or longitude is None:
        return jsonify({"msg": "El lugar debe incluir coordenadas."}), 400

    source = str(data.get("source") or "OpenStreetMap").strip()
    slug_base = re.sub(r"[^a-z0-9]+", "-", f"{source}-{place_ref}".lower()).strip("-")
    slug = slug_base[:120] or f"place-{place_ref}"[:120]
    current_user_id = get_jwt_identity()

    place = Place.query.filter_by(place_ref=place_ref, place_source=source).first()
    if not place:
        place = Place(
            name=name,
            country=str(data.get("country") or "").strip() or "Desconocido",
            description=str(data.get("description") or "").strip(),
            slug=slug,
            city=city,
            region=str(data.get("region") or city).strip(),
            image=str(data.get("image") or ""),
            latitude=latitude,
            longitude=longitude,
            best_for=str(data.get("bestFor") or data.get("category") or "Lugar guardado").strip(),
            place_ref=place_ref,
            place_category=data.get("category"),
            place_address=data.get("address"),
            place_source=source,
        )
        db.session.add(place)
        db.session.flush()

    existing_favorite = Favorite.query.filter_by(user_id=current_user_id, place_id=place.id).first()
    if existing_favorite:
        return jsonify(existing_favorite.serialize()), 200

    new_favorite = Favorite(user_id=current_user_id, place_id=place.id)
    db.session.add(new_favorite)
    db.session.commit()
    return jsonify(new_favorite.serialize()), 201


@api.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    current_user_id = get_jwt_identity()
    favorites = Favorite.query.filter_by(user_id=current_user_id).order_by(Favorite.created_at.desc()).all()
    return jsonify([favorite.serialize() for favorite in favorites]), 200

@api.route('/favorites/<int:favorite_id>', methods=['DELETE'])
@jwt_required()
def delete_favorite(favorite_id):
    favorite = Favorite.query.get(favorite_id)
    if not favorite:
        return jsonify({"error": "Favorito no encontrado"}), 404
    current_user_id = get_jwt_identity()
    if str(favorite.user_id) != current_user_id:
        return jsonify({"error": "No tienes permisos sobre este favorito"}), 403
    db.session.delete(favorite)
    db.session.commit()
    return jsonify({"message": "Favorito eliminado correctamente"}), 200


@api.route('/admin/users', methods=['GET'])
@admin_required
def get_admin_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [user.serialize() for user in users]}), 200


@api.route('/admin/users/<int:user_id>', methods=['PATCH'])
@admin_required
def update_admin_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json(silent=True) or {}
    if "email" in data:
        email = str(data["email"]).strip().lower()
        if not email:
            return jsonify({"error": "El correo es obligatorio"}), 400
        email_owner = User.query.filter(User.email == email, User.id != user.id).first()
        if email_owner:
            return jsonify({"error": "El correo ya está registrado"}), 409
        user.email = email

    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    if "is_verified" in data:
        user.is_verified = bool(data["is_verified"])
        user.verified_at = datetime.utcnow() if user.is_verified else None

    if user.is_admin and (not user.is_active or not user.is_verified):
        admin_count = User.query.filter_by(is_admin=True).count()
        if admin_count <= 1:
            return jsonify({"error": "No puedes desactivar o desverificar al último administrador"}), 400

    db.session.commit()
    return jsonify({"user": user.serialize(), "message": "Usuario actualizado correctamente"}), 200


@api.route('/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_admin_user(user_id):
    user = User.query.get(user_id)
    current_user_id = str(get_jwt_identity())
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    if str(user.id) == current_user_id:
        return jsonify({"error": "No puedes eliminar tu propia cuenta de administrador"}), 400
    if user.is_admin and User.query.filter_by(is_admin=True).count() <= 1:
        return jsonify({"error": "No puedes eliminar al último administrador"}), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Usuario eliminado correctamente"}), 200


@api.route('/admin/summary', methods=['GET'])
@admin_required
def get_admin_summary():
    recent_users = User.query.order_by(User.created_at.desc()).limit(8).all()
    return jsonify({
        "metrics": {
            "users": db.session.query(func.count(User.id)).scalar() or 0,
            "trips": db.session.query(func.count(Trip.id)).scalar() or 0,
            "places": db.session.query(func.count(Place.id)).scalar() or 0,
            "favorites": db.session.query(func.count(Favorite.id)).scalar() or 0,
        },
        "recent_users": [user.serialize() for user in recent_users],
    }), 200
