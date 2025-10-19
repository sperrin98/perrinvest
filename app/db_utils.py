import mysql.connector
from flask import current_app
import datetime
import yfinance as yf
import logging
from dotenv import load_dotenv
import os
import base64

load_dotenv()

# ---------------- Database Connection ---------------- #
def get_db_connection():
    db_host = os.getenv('DB_HOST')
    db_user = os.getenv('DB_USER')
    db_name = os.getenv('DB_NAME')
    db_password = os.getenv('DB_PASSWORD')

    print(f"Connecting to DB: {db_name} at {db_host} using {db_user}")  # Debugging
    return mysql.connector.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        database=db_name
    )



def fetch_securities():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        s.security_id,  
        s.security_long_name,
        s.security_short_name,
        ph.price AS latest_price,
        ROUND((ph.price - prev_ph.price) / prev_ph.price * 100, 2) AS percent_change,
        s.asset_class_id
    FROM securities s
    JOIN price_histories ph ON s.security_id = ph.security_id
    LEFT JOIN price_histories prev_ph 
        ON s.security_id = prev_ph.security_id 
        AND prev_ph.price_date = (SELECT MAX(price_date) FROM price_histories WHERE security_id = s.security_id AND price_date < ph.price_date)
    WHERE ph.price_date = (SELECT MAX(price_date) FROM price_histories WHERE security_id = s.security_id)
    ORDER BY s.security_id;
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    
    return [
        {
            'security_id': row[0],
            'security_long_name': row[1],
            'security_short_name': row[2],
            'latest_price': row[3],
            'percent_change': row[4],
            'asset_class_id': row[5]
        }
        for row in rows
    ]

def fetch_asset_classes():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT asset_class_id, asse_class_name FROM asset_classes ORDER BY asse_class_name;"
    cursor.execute(query)
    rows = cursor.fetchall()
    
    return [{'asset_class_id': row[0], 'asset_class_name': row[1]} for row in rows]



def get_security_id(security_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT security_id FROM securities WHERE security_long_name = %s"  # Adjust based on your schema
    cursor.execute(query, (security_name,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result[0] if result else None

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

def fetch_price_history(security_id, start_date=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM price_histories WHERE security_id = %s"
    params = [security_id]

    # If a start_date is provided, limit the query to that timeframe
    if start_date:
        query += " AND price_date >= %s"
        params.append(start_date)

    query += " ORDER BY price_date"

    cursor.execute(query, tuple(params))
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
    SELECT 
        s.security_id,
        s.security_long_name,
        ph.price AS latest_price,
        ROUND((ph.price - prev_ph.price) / prev_ph.price * 100, 2) AS percent_change
    FROM securities s
    JOIN price_histories ph ON s.security_id = ph.security_id
    LEFT JOIN price_histories prev_ph 
        ON s.security_id = prev_ph.security_id
        AND prev_ph.price_date = (
            SELECT MAX(price_date)
            FROM price_histories
            WHERE security_id = s.security_id AND price_date < ph.price_date
        )
    WHERE s.security_id IN (16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 43)
      AND ph.price_date = (
          SELECT MAX(price_date)
          FROM price_histories
          WHERE security_id = s.security_id
      )
    """
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        return rows
    except Exception as e:
        print(f"Error fetching currencies: {str(e)}")
        return []
    finally:
        cursor.close()
        conn.close()



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

def update_price_history(security_id, ticker_symbol):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        today = datetime.datetime.now().date()
        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period="1d") 
        if not hist.empty:
            closing_price = hist['Close'].iloc[0]
            query = """
                INSERT INTO price_histories (security_id, price_date, price)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE price = %s
            """
            cursor.execute(query, (security_id, today, closing_price, closing_price))
            conn.commit()
            return {"message": "Price updated successfully"}
        else:
            return {"error": "No data found for ticker"}, 404
    except Exception as e:
        print(f"Error updating price history for {ticker_symbol}: {e}")
        return {"error": str(e)}, 500
    finally:
        cursor.close()
        conn.close()

def get_correlation_data(sec_id, sec_id2, period, timeframe_type, end_date):
    connection = get_db_connection()
    try:
        cursor = connection.cursor(dictionary=True)

        # Log the procedure call and parameters
        logging.debug(f"Calling stored procedure with parameters: sec_id={sec_id}, sec_id2={sec_id2}, period={period}, timeframe_type={timeframe_type}, end_date={end_date}")

        # Call the stored procedure with correct order
        cursor.callproc('correlation_dwmqy', [sec_id, sec_id2, period, timeframe_type, end_date])

        # Fetch the results from the stored procedure
        data = []
        for result in cursor.stored_results():
            fetched_data = result.fetchall()  # Collect all results
            logging.debug(f"Fetched data: {fetched_data}")
            data.extend(fetched_data)

        if data:
            return data
        else:
            logging.debug("No data returned by the stored procedure")
            return None

    except mysql.connector.Error as e:
        logging.error(f"Database Error: {e}")
        return None  # Handle error appropriately
    finally:
        cursor.close()
        connection.close()  # Ensure connection is closed

def fetch_5d_moving_average(security_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.callproc('5d_moving_average', [security_id])
        result = []
        for result_set in cursor.stored_results():
            result = result_set.fetchall()
        return result
    except mysql.connector.Error as err:
        print(f"Error fetching 5-day moving average: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def fetch_40d_moving_average(security_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.callproc('40d_moving_average', [security_id])
        result = []
        for result_set in cursor.stored_results():
            result = result_set.fetchall()
        return result
    except mysql.connector.Error as err:
        print(f"Error fetching 40-day moving average: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def fetch_200d_moving_average(security_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.callproc('200d_moving_average', [security_id])
        result = []
        for result_set in cursor.stored_results():
            result = result_set.fetchall()
        return result
    except mysql.connector.Error as err:
        print(f"Error fetching 200-day moving average: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

def check_email_exists(email):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
    user = cursor.fetchone()
    cursor.close()
    connection.close()
    return user is not None  

def insert_new_user(username, email, password_hash):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute('INSERT INTO users (username, email, password) VALUES (%s, %s, %s)', 
                   (username, email, password_hash))
    connection.commit()
    cursor.close()
    connection.close()

def get_user_by_email(email):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute('SELECT user_id, username, email, password, is_admin FROM users WHERE email = %s', (email,))
    user = cursor.fetchone()
    cursor.close()
    connection.close()
    if user:
        return {
            'user_id': user[0],
            'username': user[1],
            'email': user[2],
            'password': user[3],
            'is_admin': bool(user[4])
        }
    return None


def insert_blog_post(title, content, author_id, image_filename=None, image_data=None):
    query = """
        INSERT INTO blog_posts (title, content, author_id, image_filename, image)
        VALUES (%s, %s, %s, %s, %s)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, (title, content, author_id, image_filename, image_data))
    conn.commit()
    cursor.close()
    conn.close()

# Fetch all blog posts
def fetch_all_blog_posts():
    query = """
        SELECT 
            p.post_id,
            p.title,
            p.content,
            p.created_at,
            u.username AS author,
            p.image,
            p.image_filename
        FROM blog_posts p
        JOIN users u ON p.author_id = u.user_id
        ORDER BY p.created_at DESC
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query)
    posts = cursor.fetchall()
    cursor.close()
    conn.close()
    return posts

# Fetch single blog post by ID
def fetch_blog_post_by_id(post_id):
    query = """
        SELECT 
            p.post_id,
            p.title,
            p.content,
            p.created_at,
            u.username AS author,
            p.image,
            p.image_filename
        FROM blog_posts p
        JOIN users u ON p.author_id = u.user_id
        WHERE p.post_id = %s
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, (post_id,))
    post = cursor.fetchone()
    cursor.close()
    conn.close()
    return post

def fetch_gld_currency_returns():
    conn = get_db_connection()  # Ensure this function works
    cursor = conn.cursor()
    query = "CALL annual_gld_price_in_major_currencies()"  
    cursor.execute(query)
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in rows]
    cursor.close()
    conn.close()
    return result

def fetch_slv_currency_returns():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "CALL annual_slv_price_in_major_currencies()"
    cursor.execute(query)
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in rows]
    cursor.close()
    conn.close()
    return result

def fetch_stock_markets():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM securities WHERE asset_class_id = 2"
        cursor.execute(query)
        stock_markets = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
    return stock_markets

def divide_stock_market_by_gold(security_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Call the stored procedure with the security_id parameter
        cursor.callproc('DivideStockMarketByGold', (security_id,))
        divided_stock_market = []
        for result in cursor.stored_results():
            divided_stock_market = result.fetchall()
    finally:
        cursor.close()
        conn.close()
    return divided_stock_market

def fetch_securities_with_prices():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT 
        s.security_id,  
        s.security_long_name,
        s.security_short_name,
        ph.price AS latest_price,
        ROUND((ph.price - prev_ph.price) / prev_ph.price * 100, 2) AS percent_change
    FROM securities s
    JOIN price_histories ph ON s.security_id = ph.security_id
    LEFT JOIN price_histories prev_ph 
        ON s.security_id = prev_ph.security_id 
        AND prev_ph.price_date = (SELECT MAX(price_date) FROM price_histories WHERE security_id = s.security_id AND price_date < ph.price_date)
    WHERE ph.price_date = (SELECT MAX(price_date) FROM price_histories WHERE security_id = s.security_id)
    ORDER BY s.security_id;
    """
    
    try:
        cursor.execute(query)
        results = cursor.fetchall()
        print("Fetched Securities with Latest Price and Percent Change:", results)  # Debugging line
        return results  
    except Exception as e:
        print(f"Error executing query: {str(e)}")
        return None
    finally:
        cursor.close()
        conn.close()


def get_annual_returns():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.callproc('calculate_average_annual_returns') 

    cursor.execute("SELECT * FROM annual_returns")  
    results = cursor.fetchall()

    cursor.close()
    conn.close()

    return results

def get_nw_hpi(eco_data_point_id):
    """
    Fetches Nationwide House Price Index (NW HPI) data for a given ID.
    """
    connection = None
    try:
        connection = get_db_connection()  # Reuse your existing connection function
        cursor = connection.cursor(dictionary=True)
        
        # Call the stored procedure
        cursor.callproc('calculate_gold_hpi_indexed', [eco_data_point_id])
        
        # Fetch results
        results = []
        for result in cursor.stored_results():
            results = result.fetchall()
        
        return results
    except Exception as e:
        print(f"Error fetching NW HPI data: {e}")
        return []
    finally:
        if connection:
            connection.close()

def fetch_market_leagues():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM market_leagues"
    print("Executing query:", query)  # Debugging line
    cursor.execute(query)
    rows = cursor.fetchall()
    print("Fetched rows:", rows)  # Debugging line
    cursor.close()
    conn.close()
    return rows

def fetch_market_league_table(league_id, date):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        print(f"Calling stored procedure: market_league_table({league_id}, '{date}')")
        
        # Call the stored procedure
        cursor.callproc('market_league_table', [league_id, date])
        
        # Fetch results from the procedure
        results = []
        for result in cursor.stored_results():
            results = result.fetchall()
            print(f"Stored procedure returned: {results}")
        
        cursor.close()
        conn.close()
        return results
    except Exception as e:
        print(f"Error executing stored procedure: {e}")
        cursor.close()
        conn.close()
        return []

def fetch_market_league_constituents(ml_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT constituent_id, security_long_name
            FROM market_league_constituents c
            JOIN securities s ON s.security_id = c.security_id
            WHERE market_league_id = %s
            ORDER BY security_long_name
        """
        cursor.execute(query, (ml_id,))
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return results
    except Exception as e:
        print(f"Error fetching market league constituents: {e}")
        cursor.close()
        conn.close()
        return []

def fetch_market_league_data_by_constituent_id(constituent_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.callproc('get_market_league_data_by_constituent_id', [constituent_id])
        
        results = []
        for result in cursor.stored_results():
            results = result.fetchall()

        cursor.close()
        conn.close()
        return results
    except Exception as e:
        print(f"Error fetching market league data: {e}")
        cursor.close()
        conn.close()
        return []
    
def fetch_precious_metals():
    precious_ids = [36, 37, 38, 149, 153, 154, 155, 156]
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        format_ids = ",".join(str(i) for i in precious_ids)
        query = f"""
            SELECT security_id, security_long_name
            FROM securities
            WHERE security_id IN ({format_ids})
            ORDER BY security_id
        """
        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return results
    except Exception as e:
        cursor.close()
        conn.close()
        print(f"Error fetching precious metals: {e}")
        return []

def fetch_daily_moves_by_year_and_security(year, security_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.callproc("get_daily_moves_by_year_and_security", [year, security_id])
        results = []
        for result in cursor.stored_results():
            results = result.fetchall()
        cursor.close()
        conn.close()
        return [
            {
                "year": row[0],
                "week": row[1],
                "monday": row[2],
                "tuesday": row[3],
                "wednesday": row[4],
                "thursday": row[5],
                "friday": row[6],
                "week_total": row[7]
            }
            for row in results
        ]
    except Exception as e:
        cursor.close()
        conn.close()
        print(f"Error fetching daily moves: {e}")
        return []

def fetch_monthly_returns_by_year(security_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.callproc("get_monthly_returns_by_year", [security_id])
        results = []
        for result in cursor.stored_results():
            results.extend(result.fetchall())
        cursor.close()
        conn.close()
        return results
    except Exception as e:
        cursor.close()
        conn.close()
        print(f"Error fetching monthly returns: {e}")
        return []

def get_gold_priced_securities():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT security_id, security_long_name
            FROM securities
            WHERE gold_pricing_security_id > 0
              AND investment_type_id = 4;
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


def get_equity_market_data(security_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Directly execute the stored procedure
        cursor.execute("CALL get_equity_market_priced_in_gold(%s)", (security_id,))
        rows = cursor.fetchall()

        # Normalize keys to match React expectations
        normalized = []
        for r in rows:
            normalized.append({
                "security_id": r.get("security_id"),
                "price_date": str(r.get("price_date")),
                "price": r.get("price"),
                "price_in_gold": r.get("price_in_gold"),
            })
        return normalized
    finally:
        cursor.close()
        conn.close()

def fetch_commodities():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM securities WHERE investment_type_id = 5")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def fetch_commodity_priced_in_gold(security_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.callproc("get_commodity_priced_in_gold", [security_id])
    rows = []
    for result in cursor.stored_results():
        rows.extend(result.fetchall())
    cursor.close()
    conn.close()
    return rows

def get_summary_data_period_end_returns(date_str, param):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)  
    cursor.callproc("get_summary_data_period_end_returns", [date_str, param])

    results = []
    for result in cursor.stored_results():
        results.extend(result.fetchall()) 

    cursor.close()
    conn.close()
    return results
