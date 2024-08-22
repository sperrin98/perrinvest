# app/__init__.py

from flask import Flask

def create_app():
    app = Flask(__name__)
    # Initialize your app, e.g., register blueprints, configure settings
    @app.route('/')
    def home():
        return "Hello, World!"
    return app
