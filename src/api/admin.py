import os
import inspect
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask_admin.theme import Bootstrap4Theme
from flask import redirect, url_for, flash, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from . import models
from .models import db, User

class ProtectedModelView(ModelView):
    """
    🔒 Protege todas las vistas del admin con JWT
    """
    
    def is_accessible(self):
        """Verifica si el usuario tiene acceso al admin"""
        try:
            # Verificar el token JWT
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            # Buscar el usuario en la base de datos
            user = User.query.get(int(user_id))
            
            # Solo admins pueden acceder
            return user is not None and user.is_admin
            
        except Exception as e:
            return False
    
    def inaccessible_callback(self, name, **kwargs):
        """Redirige al login si no tiene acceso"""
        flash('⚠️ Necesitas ser administrador para acceder a esta sección.', 'danger')
        return redirect('/login')



def setup_admin(app):
    """
    🚀 Configura el panel de administración con seguridad
    """
    
    # Clave secreta para el admin
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    
    # Crear el admin
    admin = Admin(
        app, 
        name='✈️ Viajero Admin',
        theme=Bootstrap4Theme(swatch='cerulean'),
        url='/admin'
    )
    
    # Agregar todos los modelos automáticamente (con protección)
    for name, obj in inspect.getmembers(models):
        if inspect.isclass(obj) and issubclass(obj, db.Model):
            admin.add_view(ProtectedModelView(obj, db.session))
    
    print("✅ Panel de administración configurado en /admin")
    print("📋 Modelos detectados automáticamente")