import yfinance as yf
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import sys  # Used to capture command-line arguments
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

def insert_update_date(price_date, db_config):
    """Insert the selected price date into the update_date table."""
    try:
        # Connect to the MySQL database
        connection = mysql.connector.connect(**db_config)

        if connection.is_connected():
            cursor = connection.cursor()

            # Insert the date into the update_date table
            insert_query = "INSERT INTO update_date (update_date_field) VALUES (%s)"
            cursor.execute(insert_query, (price_date,))
            connection.commit()
            print(f"Inserted update date: {price_date} into update_date table.")

    except Error as e:
        print(f"Error while connecting to MySQL: {e}")

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed after inserting update date.")

def fetch_price_from_yahoo(ticker_symbol, price_date):
    """Fetch the closing price for the given ticker_symbol and price_date using Yahoo Finance."""
    try:
        # Convert price_date to datetime object
        date_obj = datetime.strptime(price_date, "%Y-%m-%d")
        
        # Expand date range to ensure data retrieval (fetch 3 days around the target date)
        start_date = (date_obj - timedelta(days=1)).strftime("%Y-%m-%d")
        end_date = (date_obj + timedelta(days=1)).strftime("%Y-%m-%d")
        
        ticker = yf.Ticker(ticker_symbol)
        
        # Fetch historical data for the expanded date range
        data = ticker.history(start=start_date, end=end_date)

        if not data.empty:
            # Check if the price_date exists in the fetched data
            if price_date in data.index.strftime('%Y-%m-%d'):
                closing_price = data.loc[price_date]['Close']
                return closing_price
            else:
                # Use the latest available date within the range
                latest_price_data = data.iloc[-1]
                closing_price = latest_price_data['Close']
                latest_date = latest_price_data.name.strftime('%Y-%m-%d')
                print(f"No exact data found for {price_date}, using closest available data from {latest_date}")
                return closing_price
        else:
            print(f"No data found for {ticker_symbol} between {start_date} and {end_date}")
            return None
    except Exception as e:
        print(f"Error fetching data from Yahoo Finance for {ticker_symbol}: {e}")
        return None

def update_or_insert_prices_for_all_securities(price_date, db_config):
    """Loop over all securities, fetch price data for a given date, and update or insert into the database."""
    try:
        # Connect to the MySQL database
        connection = mysql.connector.connect(**db_config)

        if connection.is_connected():
            cursor = connection.cursor()

            # Step 1: Fetch all securities from the 'securities' table
            cursor.execute("SELECT security_id, ticker_symbol FROM securities")
            securities = cursor.fetchall()

            if not securities:
                print("No securities found.")
                return

            # Step 2: Loop over each security and process the price update/insertion
            for security in securities:
                security_id, ticker_symbol = security
                print(f"Processing {ticker_symbol} for security_id {security_id}.")

                try:
                    # Step 3: Check if price data already exists for the given date
                    cursor.execute("""
                        SELECT price FROM price_histories 
                        WHERE security_id = %s AND price_date = %s
                    """, (security_id, price_date))
                    existing_data = cursor.fetchone()

                    # If price data exists, delete the existing record
                    if existing_data:
                        print(f"Deleting existing price data for security_id {security_id} on {price_date}.")
                        cursor.execute("""
                            DELETE FROM price_histories 
                            WHERE security_id = %s AND price_date = %s
                        """, (security_id, price_date))
                        connection.commit()

                    # Step 4: Fetch the price from Yahoo Finance for the specified date
                    closing_price = fetch_price_from_yahoo(ticker_symbol, price_date)

                    # If price data is found, insert it into the 'price_histories' table
                    if closing_price is not None:
                        insert_query = """
                            INSERT INTO price_histories (security_id, price_date, price)
                            VALUES (%s, %s, %s)
                        """
                        cursor.execute(insert_query, (security_id, price_date, closing_price))
                        connection.commit()
                        print(f"{security_id}: Inserted price {closing_price} for {ticker_symbol} on {price_date}.")
                    else:
                        print(f"{security_id}: No price data available for {ticker_symbol} on {price_date}.")
                
                except Error as e:
                    print(f"Error processing security_id {security_id}: {e}")

    except Error as e:
        print(f"Error while connecting to MySQL: {e}")

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed.")

# Example usage
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python update_prices.py <YYYY-MM-DD>")
        sys.exit(1)

    # Fetch the date from command line argument
    price_date = sys.argv[1]

    # Define your MySQL database configuration
    db_config = {
        'host': os.getenv('DB_HOST'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME')
    }

    # Update prices for all securities on the user-specified date
    update_or_insert_prices_for_all_securities(price_date, db_config)
