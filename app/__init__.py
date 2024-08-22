from flask import Flask
from .routes import main  # Import your blueprint

def create_app():
    app = Flask(__name__)
    
    # Register the blueprint
    app.register_blueprint(main)

    # Add any other configurations or setup here
    # For example, app.config.from_object('config.Config')

    return app
