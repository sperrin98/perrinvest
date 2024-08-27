from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

# Import the configuration classes
from config import ProductionConfig, DevelopmentConfig, TestingConfig

# Initialize Flask app and SQLAlchemy
app = Flask(__name__)
db = SQLAlchemy(app)

# Load configuration based on APP_SETTINGS environment variable
app_settings = os.getenv('APP_SETTINGS', 'ProductionConfig')

if app_settings == 'DevelopmentConfig':
    app.config.from_object(DevelopmentConfig)
elif app_settings == 'TestingConfig':
    app.config.from_object(TestingConfig)
else:
    app.config.from_object(ProductionConfig)

# Import routes after initializing app and config
from your_module import routes  # Replace 'your_module' with the actual module name containing your routes

# Initialize the database
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run()
