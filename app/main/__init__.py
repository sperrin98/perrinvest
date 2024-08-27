from flask import Flask

def create_app():
    app = Flask(__name__)
    # Additional configuration and initialization
    from app.main.routes import main
    app.register_blueprint(main)
    return app
