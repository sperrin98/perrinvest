import os

class Config:
    # Secret key for Flask sessions and security (use a secure key in production)
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')  # Default value if not found in .env

    # Database configuration for the remote MySQL instance
    DB_USER = os.getenv('DB_USER', 'root')  # Default is 'root' if not specified
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'Royals106#')  # Default password if not specified
    DB_HOST = os.getenv('DB_HOST', '35.232.119.108')  # Set your remote DB host here
    DB_NAME = os.getenv('DB_NAME', 'perrinvest')  # Database name

    # SQLAlchemy configuration (connect to MySQL database using mysqlconnector)
    SQLALCHEMY_DATABASE_URI = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

    # Disable track modifications to save resources
    SQLALCHEMY_TRACK_MODIFICATIONS = False
