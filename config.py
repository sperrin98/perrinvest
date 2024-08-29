import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'mysql+mysqlconnector://k3vplcl9qdlqp9tm:i22fwidifwtddran@q57yawiwmnaw13d2.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/xsgfymqt315ntykm')
