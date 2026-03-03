from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os

db = SQLAlchemy()

def create_app():
    # Load backend env file explicitly
    load_dotenv("app/.env")

    print("Environment Variables Loaded:")
    print(f"DB_USER: {os.getenv('DB_USER')}")
    print(f"DB_HOST: {os.getenv('DB_HOST')}")
    print(f"DB_NAME: {os.getenv('DB_NAME')}")

    app = Flask(__name__)

    # Load config
    app.config.from_object("config.Config")

    print(f"Final SQLALCHEMY_DATABASE_URI: {app.config.get('SQLALCHEMY_DATABASE_URI')}")

    db.init_app(app)
    CORS(app)

    from app.main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app