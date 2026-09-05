# src/back/utils/verification.py
from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from flask_jwt_extended import create_access_token, decode_token
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


def generar_token_verificacion(email, salt="email-verification"):
    
    try:
        s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
        
        token = s.dumps(email, salt=salt)
        
        logger.info(f"✅ Token generado para: {email}")
        return token
        
    except Exception as e:
        logger.error(f"❌ Error generando token : {str(e)}")
        return None


def verificar_token(token, salt="email-verification"):
    try:
        s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
        
        email = s.loads(token, salt, max_age=3600)
        
        logger.info(f"✅ Token generado para: {email}")
        
        return email

        
    except Exception as e:
        logger.warning(f"❌ Token inválido o expirado: {str(e)}")
        return None
    
def generar_token_recuperacion(email):
    try:
        token = create_access_token(
            identity=email,
            expires_delta=timedelta(hours=1),
            additional_claims={"type": "password_reset"}
        )
        logger.info(f"Token de recuperación generado para: {email}")
        return token
    except Exception as e:
        logger.error(f"Error generando token de recuperación: {str(e)}")
        return None
    
def verificar_token_recuperacion(token):
    try:
        claims = decode_token(token)
        
        #verificar que sea de tipo "password_reset"
        if claims.get("type") != "password_reset":
            logger.warning(f"Tipo de token incorrecto: {claims.get('type')}")
            return None
        
        #extraer email
        email = claims.get("sub")
        logger.info(f"Token de recuperación válido para: {email}")
        return email
    
    except Exception as e:
        logger.warning(f"Token de recuperación inválido: {str(e)}")
        return None