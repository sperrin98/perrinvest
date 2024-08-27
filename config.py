import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('JAWSDB_URL')  # Get DB URL from environment variables
    SECRET_KEY = os.environ.get('SECRET_KEY')               # Get secret key from environment variables
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Optional: Disable SQLAlchemy track modifications to save resources

# Additional configuration settings can be added here
