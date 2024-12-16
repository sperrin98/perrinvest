import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')  # Default value

    # Dynamically construct SQLAlchemy URI based on environment variables
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'SQLALCHEMY_DATABASE_URI',  # Primary: Look for SQLALCHEMY_DATABASE_URI
        f"mysql+mysqlconnector://{os.getenv('DB_USER', 'root')}:"
        f"{os.getenv('DB_PASSWORD', '')}@"
        f"{os.getenv('DB_HOST', '35.232.119.108')}/"
        f"{os.getenv('DB_NAME', 'perrinvest')}"  # Secondary: Construct from other env vars
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
