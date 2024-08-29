import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SECRET_KEY = os.getenv('SECRET_KEY', 'REDACTED')  # Replace 'default_secret_key' with a more secure key or manage it via environment variable.
