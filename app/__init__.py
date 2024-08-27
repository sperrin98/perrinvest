from flask import Flask
from .main.routes import main  # Updated import to reflect the correct path

def create_app():
    app = Flask(__name__)

    app.register_blueprint(main)  # Register the main blueprint

    # Other app setup here (configurations, extensions, etc.)

    return app
