from flask import Flask
from .main.routes import main  # Import your blueprint from the main subdirectory

def create_app():
    app = Flask(__name__)
    
    # Register the blueprint
    app.register_blueprint(main)

    return app
