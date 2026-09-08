# src/api/utils/__init__.py

class APIException(Exception):
    """Clase de excepción para la API"""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

    def to_dict(self):
        return {"error": self.message}

def generate_sitemap(app):
    """Genera un sitemap con todos los endpoints"""
    return "Sitemap generado"