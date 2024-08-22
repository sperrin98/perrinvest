from flask import Flask
from .routes import main  # Adjust the import based on your file structure

app = Flask(__name__)
app.register_blueprint(main, url_prefix='/api')  # Register blueprint with a prefix if using Blueprints
