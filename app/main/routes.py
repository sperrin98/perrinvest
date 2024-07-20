from . import main
from flask import jsonify, Flask
# from flask_cors import CORS
from app.db_utils import fetch_securities, fetch_market_ratios, fetch_market_ratio_data, fetch_security_data, fetch_price_history
import yfinance as yf


# app = Flask(__name__)
# CORS(app)

@main.route('/')
def home():
    return jsonify({"message": "Welcome to Perrinvest"})

@main.route('/securities')
def securities():
    securities = fetch_securities()
    print(securities)  # Add this line to check the data
    return jsonify(securities)

@main.route('/securities/<int:security_id>')
def security(security_id):  # Updated function name
    # Fetch security data
    security = fetch_security_data(security_id)
    price_history = fetch_price_history(security_id)
    # Construct JSON response
    response = {
        "security": security,
        "price_history": price_history
    }
    # Return JSON response
    return jsonify(response)

@main.route('/securities/<int:security_id>/price-histories', methods=['GET'])
def get_price_histories(security_id):
    price_histories = fetch_price_history(security_id)
    return jsonify(price_histories)

@main.route('/market-ratios')
def market_ratios():
    # Fetch market ratios data
    market_ratios_data = fetch_market_ratios()
    # Return JSON response
    return jsonify(market_ratios_data)

@main.route('/market-ratios/<int:ratio_id>')
def market_ratio(ratio_id):
    market_ratio_data = fetch_market_ratio_data(ratio_id)
    ratio_name = market_ratio_data[0][0] if market_ratio_data else "Unknown Ratio"
    market_ratio_data = [(row[1], row[2]) for row in market_ratio_data]  # Remove the ratio name from each row
    response = {
        "ratio_name": ratio_name,
        "market_ratio": market_ratio_data
    }
    return jsonify(response)

@main.route('/api/gold-price-history', methods=['GET'])
def get_gold_price_history():
    gold = yf.Ticker("GC=F")  # Gold futures
    hist = gold.history(period="10y")  # Get 1 year of historical data
    data = hist.reset_index().to_dict(orient='records')
    return jsonify(data)

@main.route('/api/bitcoin-price-history', methods=['GET'])
def get_bitcoin_price_history():
    btc = yf.Ticker("BTC-USD")
    data = btc.history(period="10y", interval="1d")
    data.reset_index(inplace=True)
    result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
    return jsonify(result)

@main.route('/api/usd-price-history', methods=['GET'])
def get_usd_price_history():
    # Fetch data from yfinance
    usd = yf.Ticker("DX-Y.NYB")  # Example ticker for USD Index; replace with actual ticker if needed
    data = usd.history(period="10y", interval="1d")  # Fetch the past year of data
    data.reset_index(inplace=True)
    
    # Convert to JSON-friendly format
    result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
    return jsonify(result)

@main.route('/api/sp500-price-history', methods=['GET'])
def get_sp500_price_history():
    sp500 = yf.Ticker("^GSPC")  # Ticker for S&P 500 index
    data = sp500.history(period="10y", interval="1d")  # Fetch the past year of data
    data.reset_index(inplace=True)
    
    # Convert to JSON-friendly format
    result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
    return jsonify(result)