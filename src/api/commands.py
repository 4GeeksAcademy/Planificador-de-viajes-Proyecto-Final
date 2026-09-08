import click
from werkzeug.security import generate_password_hash
from api.models import db, User, Place

"""
In this file, you can add as many commands as you want using the @app.cli.command decorator
Flask commands are usefull to run cronjobs or tasks outside of the API but sill in integration 
with youy database, for example: Import the price of bitcoin every night as 12am
"""
def setup_commands(app):
    
    """ 
    This is an example command "insert-test-users" that you can run from the command line
    by typing: $ flask insert-test-users 5
    Note: 5 is the number of users to add
    """
    @app.cli.command("insert-test-users") # name of our command
    @click.argument("count") # argument of out command
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User()
            user.email = "test_user" + str(x) + "@test.com"
            user.password = "123456"
            user.is_active = True
            db.session.add(user)
            db.session.commit()
            print("User: ", user.email, " created.")

        print("All test users created")

    @app.cli.command("create-admin")
    @click.option("--username", prompt="Username")
    @click.option("--email", prompt="Email")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    @click.option("--first-name", default="", show_default=False)
    @click.option("--last-name", default="", show_default=False)
    def create_admin(username, email, password, first_name, last_name):
        """Create an administrator or promote an existing user."""
        user = User.query.filter((User.email == email) | (User.username == username)).first()
        if user:
            user.is_admin = True
            user.is_active = True
            user.is_verified = True
            click.echo(f"Administrador actualizado: {user.username}")
        else:
            user = User(
                username=username,
                email=email,
                password_hash=generate_password_hash(password),
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_verified=True,
                is_admin=True,
            )
            db.session.add(user)
            click.echo(f"Administrador creado: {username}")
        db.session.commit()

    @app.cli.command("insert-test-data")
    def insert_test_data():
        pass

    @app.cli.command("seed-places")
    def seed_places():
        """Poblar la tabla place con datos iniciales"""
        
        places_data = [
            {
                "name": "Valparaíso",
                "slug": "valparaiso-chile",
                "city": "Valparaíso",
                "country": "Chile",
                "region": "Región de Valparaíso",
                "image": "/src/front/assets/valparaiso-chile.jpg",
                "latitude": -33.0458456,
                "longitude": -71.6196749,
                "description": "Una ciudad portuaria de cerros coloridos, ascensores históricos y una intensa vida cultural frente al Pacífico.",
                "best_for": "Arte, miradores y paseos junto al mar"
            },
            {
                "name": "San José",
                "slug": "san-jose-costa-rica",
                "city": "San José",
                "country": "Costa Rica",
                "region": "Provincia de San José",
                "image": "/src/front/assets/san-jose-costa-rica.jpg",
                "latitude": 9.9327707,
                "longitude": -84.0796144,
                "description": "La capital costarricense combina museos, mercados, arquitectura histórica y una puerta de entrada a la naturaleza del país.",
                "best_for": "Cultura, gastronomía y escapadas naturales"
            },
            {
                "name": "Río de Janeiro",
                "slug": "rio-de-janeiro-brasil",
                "city": "Río de Janeiro",
                "country": "Brasil",
                "region": "Estado de Río de Janeiro",
                "image": "/src/front/assets/rio-de-janeiro-brasil.jpg",
                "latitude": -22.9110137,
                "longitude": -43.2093727,
                "description": "Una ciudad de playas, montañas y barrios llenos de ritmo, con paisajes reconocibles y muchas formas de explorar.",
                "best_for": "Playas, naturaleza y vida urbana"
            },
            {
                "name": "Buenos Aires",
                "slug": "buenos-aires-argentina",
                "city": "Buenos Aires",
                "country": "Argentina",
                "region": "Ciudad Autónoma de Buenos Aires",
                "image": "/src/front/assets/buenos-aires-argentina.jpg",
                "latitude": -34.6095579,
                "longitude": -58.3887904,
                "description": "Una capital de barrios con personalidad, cafés, librerías, arquitectura y una agenda cultural que nunca se detiene.",
                "best_for": "Gastronomía, cultura y arquitectura"
            },
            {
                "name": "Lima",
                "slug": "lima-peru",
                "city": "Lima",
                "country": "Perú",
                "region": "Provincia de Lima",
                "image": "/src/front/assets/lima-peru.jpg",
                "latitude": -12.0459808,
                "longitude": -77.0305912,
                "description": "La capital peruana reúne patrimonio histórico, cocina reconocida y una extensa costa para recorrer con calma.",
                "best_for": "Historia, comida y costa"
            }
        ]
        
        for data in places_data:
            existing = Place.query.filter_by(slug=data["slug"]).first()
            if not existing:
                place = Place(**data)
                db.session.add(place)
                print(f"Agregado: {data['city']}")
            else:
                print(f"Ya existe: {data['city']}")
        
        db.session.commit()
        print(f"{len(places_data)} lugares procesados correctamente")