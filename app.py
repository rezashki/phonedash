import webbrowser
from flask import Flask
from waitress import serve
from config import SECRET_KEY, setup_logging
from database import init_db

# Import route modules
from routes.main import main_routes
from routes.auth import auth_routes
from routes.contacts import contacts_routes
from routes.companies import companies_routes
from routes.users import users_routes

app = Flask(__name__)
app.secret_key = SECRET_KEY

# Setup logging
setup_logging()

# Initialize the database when the application starts
with app.app_context():
    init_db()

# Register blueprints
app.register_blueprint(main_routes)
app.register_blueprint(auth_routes, url_prefix="/api")
app.register_blueprint(contacts_routes, url_prefix="/api")
app.register_blueprint(companies_routes, url_prefix="/api")
app.register_blueprint(users_routes, url_prefix="/api")


if __name__ == "__main__":
    webbrowser.open("http://127.0.0.1:5000/login.html")
    serve(app, host="0.0.0.0", port=5000)
