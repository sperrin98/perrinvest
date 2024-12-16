from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os

db = SQLAlchemy()

def create_app():
    # Load .env variables explicitly
    load_dotenv()

    # Debug log to ensure .env values are loaded
    print("Environment Variables Loaded:")
    print(f"DB_USER: {os.getenv('DB_USER')}")
    print(f"DB_PASSWORD: {os.getenv('DB_PASSWORD')}")
    print(f"DB_HOST: {os.getenv('DB_HOST')}")
    print(f"DB_NAME: {os.getenv('DB_NAME')}")

    app = Flask(__name__)

    # Load configuration from config.py
    app.config.from_object('config.Config')

    # Debug print the database URI to confirm it uses the correct values
    print(f"Final SQLALCHEMY_DATABASE_URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

    # Initialize extensions
    db.init_app(app)
    CORS(app)

    # Register blueprints
    from app.main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app
