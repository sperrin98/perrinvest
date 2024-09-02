import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('CLEARDB_DATABASE_URL')  # Use ClearDB URL
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key') 
