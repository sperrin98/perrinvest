from flask import Blueprint, jsonify, request, send_from_directory
import yfinance as yf
from app.db_utils import (
    fetch_securities, fetch_market_ratios, fetch_market_ratio_data, 
    fetch_security_data, fetch_price_history, fetch_eco_data_point_histories, 
    fetch_eco_data_point, fetch_eco_data_points, fetch_currencies, 
    fetch_currency, call_divided_price_procedure, get_security_id,
    fetch_currency_price_history
)
import logging

main = Blueprint('main', __name__)
logging.basicConfig(level=logging.INFO)

# Serve the React app
@main.route('/')
def home():
    return send_from_directory('static/build', 'index.html')

@main.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static/build', path)

@main.route('/api/securities')
def get_securities():
    try:
        securities = fetch_securities()
        return jsonify(securities)
    except Exception as e:
        logging.error(f"Error fetching securities: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/securities/<int:security_id>')
def get_security(security_id):
    try:
        security = fetch_security_data(security_id)
        price_history = fetch_price_history(security_id)
        response = {
            "security": security,
            "price_history": price_history
        }
        return jsonify(response)
    except Exception as e:
        logging.error(f"Error fetching security {security_id}: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/securities/<int:security_id>/price-histories', methods=['GET'])
def get_price_histories(security_id):
    try:
        price_histories = fetch_price_history(security_id)
        return jsonify(price_histories)
    except Exception as e:
        logging.error(f"Error fetching price histories for security {security_id}: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/market-ratios')
def get_market_ratios():
    try:
        market_ratios_data = fetch_market_ratios()
        return jsonify(market_ratios_data)
    except Exception as e:
        logging.error(f"Error fetching market ratios: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/market-ratios/<int:ratio_id>')
def get_market_ratio(ratio_id):
    try:
        market_ratio_data = fetch_market_ratio_data(ratio_id)
        ratio_name = market_ratio_data[0][0] if market_ratio_data else "Unknown Ratio"
        market_ratio_data = [(row[1], row[2]) for row in market_ratio_data]
        response = {
            "ratio_name": ratio_name,
            "market_ratio": market_ratio_data
        }
        return jsonify(response)
    except Exception as e:
        logging.error(f"Error fetching market ratio {ratio_id}: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/eco-data-points')
def get_eco_data_points():
    try:
        eco_data_points = fetch_eco_data_points()
        return jsonify(eco_data_points)
    except Exception as e:
        logging.error(f"Error fetching eco data points: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/eco-data-points/<int:eco_data_point_id>/histories')
def get_eco_data_point_histories(eco_data_point_id):
    try:
        histories = fetch_eco_data_point_histories(eco_data_point_id)
        return jsonify(histories)
    except Exception as e:
        logging.error(f"Error fetching eco data point histories for ID {eco_data_point_id}: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/eco-data-points/<int:eco_data_point_id>')
def get_eco_data_point(eco_data_point_id):
    try:
        data_point = fetch_eco_data_point(eco_data_point_id)
        return jsonify(data_point)
    except Exception as e:
        logging.error(f"Error fetching eco data point {eco_data_point_id}: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/currencies')
def get_currencies():
    try:
        currencies_data = fetch_currencies()
        security_id1 = request.args.get('security_id1')
        security_id2 = request.args.get('security_id2')

        if security_id1 and security_id2:
            try:
                divided_currency_data = get_divided_currency_price(int(security_id1), int(security_id2))
                if divided_currency_data:
                    new_currency = {
                        'id': f'divided_{security_id1}_{security_id2}',
                        'security_long_name': f'Divided {security_id1}/{security_id2}',
                        'price_history': divided_currency_data
                    }
                    currencies_data.append(new_currency)
            except ValueError:
                return jsonify({'error': 'Invalid security IDs'}), 400
        
        return jsonify(currencies_data)
    except Exception as e:
        logging.error(f"Error fetching currencies: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/currencies/<int:currency_id>')
def get_currency(currency_id):
    try:
        currency_data = fetch_currency(currency_id)
        price_history = fetch_currency_price_history(currency_id)
        response = {
            "currency": currency_data,
            "price_history": price_history
        }
        return jsonify(response)
    except Exception as e:
        logging.error(f"Error fetching currency {currency_id}: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/currencies/divide', methods=['GET'])
def divide_currencies():
    security_long_name1 = request.args.get('security_long_name1')
    security_long_name2 = request.args.get('security_long_name2')

    if not security_long_name1 or not security_long_name2:
        return jsonify({'error': 'Security long names are required'}), 400

    try:
        security_id1 = get_security_id(security_long_name1)
        security_id2 = get_security_id(security_long_name2)
        
        if security_id1 is None or security_id2 is None:
            return jsonify({'error': 'Invalid security long names'}), 400

        data = call_divided_price_procedure(security_id1, security_id2)

        if not data:
            return jsonify({'error': 'No data found for the given security IDs'}), 404

        abbrev1 = security_long_name1[-3:]
        abbrev2 = security_long_name2[-3:]

        for row in data:
            row['price_date'] = row['price_date'].strftime('%Y/%m/%d')

        return jsonify({
            'abbrev1': abbrev1,
            'abbrev2': abbrev2,
            'divided_prices': data
        })
    except ValueError:
        return jsonify({'error': 'Invalid parameters'}), 400
    except Exception as e:
        logging.error(f"Error dividing currencies: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/market-ratios/divide', methods=['GET'])
def divide_market_ratios():
    security_long_name1 = request.args.get('security_long_name1')
    security_long_name2 = request.args.get('security_long_name2')

    if not security_long_name1 or not security_long_name2:
        return jsonify({'error': 'Security long names are required'}), 400

    try:
        security_id1 = get_security_id(security_long_name1)
        security_id2 = get_security_id(security_long_name2)

        if security_id1 is None or security_id2 is None:
            return jsonify({'error': 'Invalid security long names'}), 400

        data = call_divided_price_procedure(security_id1, security_id2)
        if not data:
            return jsonify({'error': 'No data found for the given security IDs'}), 404

        return jsonify({'divided_prices': data})
    except Exception as e:
        logging.error(f"Error dividing market ratios: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/crypto-prices', methods=['GET'])
def get_crypto_prices():
    try:
        crypto_tickers = ['BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD', 'SOL-USD', 'DOT-USD', 'UNI-USD', 'LTC-USD']
        crypto_data = {}

        for ticker in crypto_tickers:
            crypto = yf.Ticker(ticker)
            hist = crypto.history(period="10d")
            crypto_data[ticker] = hist.reset_index().to_dict(orient='records')

        return jsonify(crypto_data)
    except Exception as e:
        logging.error(f"Error fetching crypto prices: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/crypto-price-history/<ticker>', methods=['GET'])
def get_crypto_price_history(ticker):
    try:
        timeframe = request.args.get('timeframe', '1y')

        if not ticker.endswith('-USD'):
            ticker = f"{ticker}-USD"
        
        crypto = yf.Ticker(ticker)
        data = crypto.history(period=timeframe, interval="1d")
        
        if data.empty:
            return jsonify({"error": "No data found for the specified ticker"}), 404
        
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error fetching crypto price history for {ticker}: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/gold-price-history', methods=['GET'])
def get_gold_price_history():
    try:
        gold = yf.Ticker("GC=F")
        hist = gold.history(period="10y")
        data = hist.reset_index().to_dict(orient='records')
        return jsonify(data)
    except Exception as e:
        logging.error(f"Error fetching gold price history: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/bitcoin-price-history', methods=['GET'])
def get_bitcoin_price_history():
    try:
        btc = yf.Ticker("BTC-USD")
        data = btc.history(period="10y", interval="1d")
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error fetching bitcoin price history: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/usd-price-history', methods=['GET'])
def get_usd_price_history():
    try:
        usd = yf.Ticker("DX-Y.NYB")
        data = usd.history(period="10y", interval="1d")
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error fetching USD price history: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/sp500-price-history', methods=['GET'])
def get_sp500_price_history():
    try:
        sp500 = yf.Ticker("^GSPC")
        data = sp500.history(period="10y", interval="1d")
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error fetching S&P 500 price history: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500

@main.route('/api/apple-price-history', methods=['GET'])
def get_apple_price_history():
    try:
        apple = yf.Ticker("AAPL")
        data = apple.history(period="10y", interval="1d")
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error fetching Apple price history: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500
