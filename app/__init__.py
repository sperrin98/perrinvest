from flask import Flask
from .main.routes import main

def create_app():
    app = Flask(__name__, static_folder='static/build', static_url_path='')
    app.register_blueprint(main)
    return app

app = create_app()
