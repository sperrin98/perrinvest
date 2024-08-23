from flask import Flask

def create_app():
    app = Flask(__name__)
    
    # Set up configuration
    app.config.from_object('config.Config')

    # Register blueprints or routes
    from app.main.routes import main
    app.register_blueprint(main)
    
    return app
