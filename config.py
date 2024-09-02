import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('CLEARDB_DATABASE_URL')
    SECRET_KEY = os.getenv('SECRET_KEY', 'Royals106#')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
