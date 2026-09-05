"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Trip, Destination, Activity, Place, Favorite
from api.utils import generate_sitemap, APIException
from api.overpass import OverpassError, buscar_lugares, validar_coordenada
from api.nominatim import NominatimError, buscar_direccion
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (create_access_token, create_refresh_token, JWTManager, jwt_required, get_jwt_identity)
from datetime import date, time as datetime_time
from sqlalchemy import or_
from api.utils.verification import (
    generar_token_verificacion, 
    verificar_token,
    generar_token_recuperacion,
    verificar_token_recuperacion
)
from api.utils.email import enviar_correo_verificacion, enviar_correo_recuperacion
api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


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
        verification_token=token   
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
    from api.utils.verification import verificar_token
    from datetime import datetime
    
    email = verificar_token(token)
    if not email:
        return jsonify({"error": "Token inválido o expirado"}), 400
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    if user.is_verified:
        return jsonify({"message": "El correo ya ha sido verificado."}), 200
    
    user.is_verified = True
    user.is_active = True
    user.verified_at = datetime.utcnow()
    user.verification_token = None
    db.session.commit()
    
    return jsonify({"message": "¡Correo verificado exitosamente!"}), 200
    
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
        "msg": "⚠️ Verifica tu correo antes de iniciar sesión.",
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
            "email": existing_user.email
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
    destinations = Destination.query.filter_by(trip_id= trip_id).all()
    return jsonify([destination.serialize() for destination in destinations]), 200


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

@api.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    current_user_id = get_jwt_identity()
    favorites = Favorite.query.filter_by(user_id=current_user_id).all()
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