import os
import pymysql

# Ensure PyMySQL is used as the MySQLdb connector
pymysql.install_as_MySQLdb()

class Config:
    # Remove the `?reconnect=true` parameter from the URL
    SQLALCHEMY_DATABASE_URI = os.getenv('CLEARDB_URL', 'mysql://bef8d401dbcad8:8dd3aadb@us-cluster-east-01.k8s.cleardb.net/heroku_cdb808eab650119')
    SECRET_KEY = os.getenv('SECRET_KEY', 'Royals106#')
