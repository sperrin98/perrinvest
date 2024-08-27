import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('JAWSDB_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY', 'my_secret_key')
