class Config:
    SQLALCHEMY_DATABASE_URI = 'mysql+mysqlconnector://root:REDACTED@localhost/perrinvest'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'my_secret_key'