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
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in rows]
    cursor.close()
    conn.close()
    return result


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

def fetch_currencies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
    SELECT * FROM securities 
    WHERE security_id IN (16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 43)
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def fetch_currency(currency_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
    SELECT * FROM securities 
    WHERE security_id = %s AND security_id IN (16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 43)
    """
    cursor.execute(query, (currency_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row

def fetch_currency_price_history(currency_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT price_date, price
        FROM price_histories
        WHERE security_id = %s
        ORDER BY price_date
    """
    cursor.execute(query, (currency_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def get_security_id(security_long_name):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT security_id FROM securities WHERE security_long_name = %s"
    try:
        cursor.execute(query, (security_long_name,))
        result = cursor.fetchone()
        if result:
            return result['security_id']
        return None
    except Exception as e:
        print(f"Error fetching security ID for {security_long_name}: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def call_divided_price_procedure(security_id1, security_id2):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Call the stored procedure
        cursor.callproc('divided_price', [security_id1, security_id2])
        
        # Fetch the results
        result = []
        for result_set in cursor.stored_results():
            result = result_set.fetchall()
        
        return result

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return []
    finally:
        cursor.close()
        conn.close()