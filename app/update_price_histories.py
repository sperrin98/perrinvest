import mysql.connector
import yfinance as yf
from datetime import datetime, timedelta

# Database connection
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Royals106#',
        database='perrinvest'
    )

def update_price_histories():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Calculate the previous day's date
    today = datetime.now().date()
    previous_day = today - timedelta(days=1)

    # Fetch all ticker symbols from the securities table
    cursor.execute("SELECT security_id, security_long_name, ticker_symbol FROM securities")
    securities = cursor.fetchall()

    for security_id, security_long_name, ticker_symbol in securities:
        if not ticker_symbol:
            print(f"Skipping entry with missing ticker symbol for security: {security_long_name}")
            continue

        try:
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(start=previous_day, end=today)

            if not hist.empty:
                closing_price = hist['Close'].iloc[0]

                # Update or insert the price history into the database
                query = """
                    INSERT INTO price_histories (security_id, price_date, price)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE price = %s
                """
                cursor.execute(query, (security_id, previous_day, closing_price, closing_price))
                conn.commit()

                # Print the security long name, price, and date to the console
                print(f"Security: {security_long_name}, Price: {closing_price}, Date: {previous_day}")

            else:
                print(f"No price data found for ticker: {ticker_symbol} (Date: {previous_day})")

        except Exception as e:
            print(f"Error processing ticker symbol: {ticker_symbol}. Error: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    update_price_histories()