from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

# Initialize SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configure the app
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+mysqlconnector://root:@localhost:3306/perrinvest')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # To suppress warnings
    
    # Initialize SQLAlchemy with the app
    db.init_app(app)
    
    # Register blueprints
    from .routes import main  # Import routes from within the app package
    app.register_blueprint(main)
    
    return app
