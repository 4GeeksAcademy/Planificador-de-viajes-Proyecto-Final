# src/api/utils/email.py
from flask_mail import Message
from flask import current_app

import logging

logger = logging.getLogger(__name__)


def enviar_correo_verificacion(email, token):
    # 1️⃣ CONSTRUIR LA URL DE VERIFICACIÓN
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    verification_url = f"{frontend_url}/verificar/{token}"
    
    print(f"📧 Enviando correo a: {email}")
    print(f"🔗 URL de verificación: {verification_url}")
    
    # 2️⃣ CREAR EL CONTENIDO HTML DEL CORREO
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Verifica tu correo</title>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #eef1f4; margin: 0; padding: 0; color: #2d3748; }}
            .wrapper {{ max-width: 560px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }}
            .header {{ background-color: #12343B; padding: 32px 40px; }}
            .header .logo {{ color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }}
            .accent-bar {{ height: 4px; background-color: #078A9A; }}
            .content {{ padding: 40px; }}
            .content h1 {{ font-size: 22px; color: #12343B; margin: 0 0 16px 0; font-weight: 600; }}
            .content p {{ font-size: 15px; line-height: 1.6; color: #4a5568; margin: 0 0 16px 0; }}
            .button-wrap {{ text-align: center; margin: 32px 0; }}
            .button {{ display: inline-block; background-color: #078A9A; color: #ffffff !important; padding: 13px 36px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }}
            .divider {{ border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }}
            .fallback-label {{ font-size: 13px; color: #718096; margin-bottom: 8px; }}
            .link-box {{ background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #078A9A; }}
            .expiry-note {{ font-size: 13px; color: #a0682c; background-color: #fdf6ec; border-left: 3px solid #d69e2e; padding: 10px 14px; border-radius: 4px; margin: 24px 0; }}
            .footer {{ background-color: #f7fafc; padding: 24px 40px; text-align: center; }}
            .footer p {{ font-size: 12px; color: #a0aec0; margin: 4px 0; }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header">
                <span class="logo">✈️ VIAJERO</span>
            </div>
            <div class="accent-bar"></div>
            <div class="content">
                <h1>Confirma tu dirección de correo</h1>
                <p>Hola, gracias por crear tu cuenta en Viajero. Antes de continuar, necesitamos confirmar que esta dirección de correo te pertenece.</p>

                <div class="button-wrap">
                    <a href="{verification_url}" class="button">✅ Confirmar mi correo</a>
                </div>

                <div class="expiry-note">⏰ Este enlace es válido durante <strong>1 hora</strong> por motivos de seguridad.</div>

                <hr class="divider">

                <p class="fallback-label">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <div class="link-box">{verification_url}</div>

                <p style="margin-top: 32px; font-size: 13px; color: #a0aec0;">Si no creaste esta cuenta, puedes ignorar este mensaje de forma segura.</p>
            </div>
            <div class="footer">
                <p>© 2026 Viajero. Todos los derechos reservados.</p>
                <p>Este es un mensaje automático — por favor no respondas a este correo.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # 3️⃣ CREAR Y ENVIAR EL MENSAJE
    try:
        msg = Message(
            subject="🔐 Verifica tu correo electrónico - Viajero",
            recipients=[email],
            html=html_content,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'no-reply@viajero.com')
        )
        
        mail = current_app.extensions.get('mail')
        
        if mail:
            mail.send(msg)
            logger.info(f"✅ Correo enviado a: {email}")
            return True
        else:
            logger.error("❌ Flask-Mail no está configurado")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error al enviar correo: {str(e)}")
        return False
    
def enviar_correo_recuperacion(email, token):
    #enviar correo con el enlace para restablecer constraseña
    
    #Url de recuperación
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url}/reset-password/{token}"
    
    print(f"Enviando correo de recuperación a: {email}")
    print(f"URL para resetear: {reset_url}")
    
    #crear contenido HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Restablece tu contraseña</title>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #eef1f4; margin: 0; padding: 0; color: #2d3748; }}
            .wrapper {{ max-width: 560px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }}
            .header {{ background-color: #12343B; padding: 32px 40px; }}
            .header .logo {{ color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }}
            .accent-bar {{ height: 4px; background-color: #078A9A; }}
            .content {{ padding: 40px; }}
            .content h1 {{ font-size: 22px; color: #12343B; margin: 0 0 16px 0; font-weight: 600; }}
            .content p {{ font-size: 15px; line-height: 1.6; color: #4a5568; margin: 0 0 16px 0; }}
            .button-wrap {{ text-align: center; margin: 32px 0; }}
            .button {{ display: inline-block; background-color: #078A9A; color: #ffffff !important; padding: 13px 36px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }}
            .divider {{ border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }}
            .fallback-label {{ font-size: 13px; color: #718096; margin-bottom: 8px; }}
            .link-box {{ background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #078A9A; }}
            .expiry-note {{ font-size: 13px; color: #a0682c; background-color: #fdf6ec; border-left: 3px solid #d69e2e; padding: 10px 14px; border-radius: 4px; margin: 24px 0; }}
            .footer {{ background-color: #f7fafc; padding: 24px 40px; text-align: center; }}
            .footer p {{ font-size: 12px; color: #a0aec0; margin: 4px 0; }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header">
                <span class="logo">✈️ VIAJERO</span>
            </div>
            <div class="accent-bar"></div>
            <div class="content">
                <h1>Restablece tu contraseña</h1>
                <p>Hola, recibimos una solicitud para restablecer la contraseña de tu cuenta en Viajero. Haz clic en el botón para crear una nueva.</p>

                <div class="button-wrap">
                    <a href="{reset_url}" class="button">🔄 Restablecer contraseña</a>
                </div>

                <div class="expiry-note">⏰ Este enlace es válido durante <strong>1 hora</strong> por motivos de seguridad.</div>

                <hr class="divider">

                <p class="fallback-label">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <div class="link-box">{reset_url}</div>

                <p style="margin-top: 32px; font-size: 13px; color: #a0aec0;">Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura — tu contraseña actual seguirá funcionando.</p>
            </div>
            <div class="footer">
                <p>© 2026 Viajero. Todos los derechos reservados.</p>
                <p>Este es un mensaje automático — por favor no respondas a este correo.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
#crear y enviar el mensaje
    try:
        msg = Message(
            subject=" Recuperación de contraseña - Viajero",
            recipients=[email],
            html=html_content,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'no-reply@viajero.com')
            )
        mail = current_app.extensions.get('mail')
    
        if mail:
            mail.send(msg)
            logger.info(f"Correo de recuperación enviado a: {email}")
            return True
        else:
            logger.error("Flask-Mail no está configurado")
            return False
    except Exception as e:
        logger.error(f"Error al enviar correo: {str(e)}")
        return False