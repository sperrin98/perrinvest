from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config.from_object('config.DevelopmentConfig')  # Ensure this points to the correct config class

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import your models after initializing db
from app import models  # Adjust the import path if needed

if __name__ == "__main__":
    app.run()
