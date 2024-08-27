from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

# Initialize the Flask application
app = Flask(__name__)

# Load configuration from config.py
app.config.from_object('config.Config')

# Initialize the SQLAlchemy object
db = SQLAlchemy(app)

# Define your models here
# Example:
# class User(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     username = db.Column(db.String(80), unique=True, nullable=False)

# Define your routes here
@app.route('/')
def index():
    return "Hello, World!"

# More routes and views can be defined here

if __name__ == '__main__':
    app.run(debug=True)
