# fix_db.py
import sys
sys.path.append('src')

from app import app
from api.models import db
from sqlalchemy import text

with app.app_context():
    # 1. Verificar si la columna verification_token_expires_at existe
    result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='user' AND column_name='verification_token_expires_at'"))
    
    if result.first():
        print("✅ La columna verification_token_expires_at YA EXISTE")
    else:
        # 2. Agregar la columna
        db.session.execute(text('ALTER TABLE "user" ADD COLUMN verification_token_expires_at TIMESTAMP'))
        db.session.commit()
        print("✅ Columna verification_token_expires_at agregada")
    
    # 3. Verificar que is_admin existe
    result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='user' AND column_name='is_admin'"))
    if result.first():
        print("✅ La columna is_admin YA EXISTE")
    else:
        db.session.execute(text('ALTER TABLE "user" ADD COLUMN is_admin BOOLEAN DEFAULT FALSE'))
        db.session.commit()
        print("✅ Columna is_admin agregada")
    
    # 4. Mostrar todas las columnas
    print("\n📋 Columnas en 'user':")
    result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='user'"))
    for row in result:
        print(f"  - {row[0]}")

print("\n✅ Base de datos lista!")