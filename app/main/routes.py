from . import main
from flask import jsonify, Flask
from flask_cors import CORS
from app.db_utils import fetch_securities, fetch_market_ratios, fetch_market_ratio_data, fetch_security_data, fetch_price_history

app = Flask(__name__)
CORS(app)

@main.route('/')
def home():
    return jsonify({"message": "Welcome to Perrinvest"})

@main.route('/securities')
def get_securities():
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

@main.route('/market-ratios')
def market_ratios():
    # Fetch market ratios data
    market_ratios_data = fetch_market_ratios()
    # Return JSON response
    return jsonify(market_ratios_data)

def market_ratio(market_ratio_id):
    # Fetch market ratio data
    market_ratio_data = fetch_market_ratio_data(market_ratio_id)
    ratio_name = market_ratio_data[0][0] if market_ratio_data else "Unknown Ratio"
    market_ratio_data = [(row[1], row[2]) for row in market_ratio_data]  # Remove the ratio name from each row
    # Construct JSON response
    response = {
        "ratio_name": ratio_name,
        "market_ratio": market_ratio_data
    }
    # Return JSON response
    return jsonify(response)
