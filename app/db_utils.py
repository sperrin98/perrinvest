import mysql.connector
from flask import current_app

def get_db_connection():
    config = {
        'user': 'root',
        'password': 'Royals106#',
        'host': 'localhost',
        'database': 'perrinvest'
    }
    return mysql.connector.connect(**config)

def fetch_securities():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM securities"
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def fetch_security_data(security_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM securities WHERE security_id = %s"
    cursor.execute(query, (security_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row

def fetch_market_ratios():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM market_ratios"
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def fetch_market_ratio_data(market_ratio_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT mr.ratio_name, ph1.price_date, ph1.price / ph2.price 
        FROM market_ratios mr 
        INNER JOIN price_histories ph1 ON mr.security_id1 = ph1.security_id 
        INNER JOIN price_histories ph2 ON mr.security_id2 = ph2.security_id 
        WHERE ph1.price_date = ph2.price_date AND mr.market_ratio_id = %s
    """
    cursor.execute(query, (market_ratio_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def fetch_price_history(security_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM price_histories WHERE security_id = %s ORDER BY price_date"
    cursor.execute(query, (security_id,))
    price_history = cursor.fetchall()
    cursor.close()
    conn.close()
    return price_history

def fetch_eco_data_points():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM eco_data_points"
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def fetch_eco_data_point_histories(eco_data_point_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM eco_data_points_histories WHERE eco_data_point_id = %s ORDER BY price_date"
    cursor.execute(query, (eco_data_point_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def fetch_eco_data_point(eco_data_point_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM eco_data_points WHERE eco_data_point_id = %s"
    cursor.execute(query, (eco_data_point_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row