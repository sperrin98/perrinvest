from flask import jsonify, request, make_response, render_template
from . import main
from app.db_utils import (
    fetch_securities, 
    fetch_market_ratios, 
    fetch_market_ratio_data, 
    fetch_security_data, 
    fetch_price_history, 
    fetch_eco_data_point_histories, 
    fetch_eco_data_point, 
    fetch_eco_data_points, 
    fetch_currencies, 
    fetch_currency, 
    call_divided_price_procedure, 
    get_security_id,
    fetch_currency_price_history, 
    update_price_history, 
    get_correlation_data,
    fetch_5d_moving_average, 
    fetch_40d_moving_average, 
    fetch_200d_moving_average,
    check_email_exists, 
    insert_new_user, 
    get_user_by_email,
    fetch_gld_currency_returns,
    fetch_slv_currency_returns,
    fetch_stock_markets,
    divide_stock_market_by_gold,
    get_annual_returns,
    get_nw_hpi,
    fetch_market_leagues,
    fetch_market_league_table,
    fetch_market_league_data_by_constituent_id,
    fetch_market_league_constituents,
    fetch_asset_classes,
    fetch_daily_moves_by_year_and_security,
    fetch_precious_metals
    )   
import yfinance as yf
from datetime import datetime, timedelta  # Include datetime and timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@main.route('/')
def home():
    return jsonify({"message": "Welcome to Perrinvest"})

@main.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    logger.info(f"Received registration data: {data}")
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        logger.warning("All fields are required.")
        return jsonify({'error': 'All fields are required.'}), 400

    try:
        if check_email_exists(email):
            logger.warning(f"Email already exists: {email}")
            return jsonify({'error': 'Email already exists.'}), 400

        hashed_password = generate_password_hash(password)
        logger.info(f"Hashed password: {hashed_password}")  # Log the hashed password
        
        insert_new_user(username, email, hashed_password)
        logger.info(f"User registered successfully: {username}")
        return jsonify({'message': 'User registered successfully', 'username': username}), 201

    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")  # Log the actual error
        return jsonify({'error': 'Failed to register user.'}), 500


@main.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data['email']
    password = data['password']

    user = get_user_by_email(email)

    # Ensure user is not None and check password
    if user and check_password_hash(user['password'], password):
        return jsonify({'message': 'Login successful', 'username': user['username']}), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401


@main.route('/securities')
def get_securities():
    try:
        securities = fetch_securities()
        return jsonify(securities)
    except Exception as e:
        print(f"Error fetching securities: {e}")
        return jsonify({'error': str(e)}), 500

@main.route('/asset_classes')
def get_asset_classes():
    try:
        asset_classes = fetch_asset_classes()
        return jsonify(asset_classes)
    except Exception as e:
        print(f"Error fetching asset classes: {e}")
        return jsonify({'error': str(e)}), 500

@main.route('/securities/<int:security_id>')
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
        print(f"Error fetching security: {e}")
        return jsonify({'error': str(e)}), 500


@main.route('/securities/<int:security_id>/price-histories', methods=['GET'])
def get_price_histories(security_id):
    timeframe = request.args.get('timeframe', 'all')  # Get timeframe from query parameter
    start_date = None
    
    # Define the timeframes
    if timeframe == '1w':
        start_date = datetime.now() - timedelta(weeks=1)
    elif timeframe == '1m':
        start_date = datetime.now() - timedelta(days=30)
    elif timeframe == '3m':
        start_date = datetime.now() - timedelta(days=90)
    elif timeframe == '6m':
        start_date = datetime.now() - timedelta(days=180)
    elif timeframe == 'ytd':
        start_date = datetime(datetime.now().year, 1, 1)
    elif timeframe == '1y':
        start_date = datetime.now() - timedelta(days=365)
    elif timeframe == '5y':
        start_date = datetime.now() - timedelta(days=5*365)

    price_histories = fetch_price_history(security_id, start_date)
    return jsonify(price_histories)

@main.route('/securities/<int:security_id>/5d-moving-average', methods=['GET'])
def get_5d_moving_average(security_id):
    try:
        result = fetch_5d_moving_average(security_id)
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching 5-day moving average: {e}")
        return jsonify({'error': str(e)}), 500

@main.route('/securities/<int:security_id>/40d-moving-average', methods=['GET'])
def get_40d_moving_average(security_id):
    try:
        result = fetch_40d_moving_average(security_id)
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching 40-day moving average: {e}")
        return jsonify({'error': str(e)}), 500

@main.route('/securities/<int:security_id>/200d-moving-average', methods=['GET'])
def get_200d_moving_average(security_id):
    try:
        result = fetch_200d_moving_average(security_id)
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching 200-day moving average: {e}")
        return jsonify({'error': str(e)}), 500


@main.route('/market-ratios')
def get_market_ratios():
    market_ratios_data = fetch_market_ratios()
    return jsonify(market_ratios_data)

@main.route('/market-ratios/<int:ratio_id>')
def get_market_ratio(ratio_id):
    market_ratio_data = fetch_market_ratio_data(ratio_id)
    ratio_name = market_ratio_data[0][0] if market_ratio_data else "Unknown Ratio"
    market_ratio_data = [(row[1], row[2]) for row in market_ratio_data]
    response = {
        "ratio_name": ratio_name,
        "market_ratio": market_ratio_data
    }
    return jsonify(response)

@main.route('/eco-data-points')
def get_eco_data_points():
    try:
        eco_data_points = fetch_eco_data_points()
        return jsonify(eco_data_points)
    except Exception as e:
        print(f"Error fetching eco-data-points: {e}")
        return jsonify({"error": "Error fetching eco-data-points"}), 500

@main.route('/eco-data-points/<int:eco_data_point_id>/histories')
def get_eco_data_point_histories(eco_data_point_id):
    try:
        histories = fetch_eco_data_point_histories(eco_data_point_id)
        return jsonify(histories)
    except Exception as e:
        print(f"Error fetching eco-data-point histories: {e}")
        return jsonify({"error": "Error fetching eco-data-point histories"}), 500

@main.route('/eco-data-points/<int:eco_data_point_id>')
def get_eco_data_point(eco_data_point_id):
    try:
        data_point = fetch_eco_data_point(eco_data_point_id)
        return jsonify(data_point)
    except Exception as e:
        print(f"Error fetching eco-data-point: {e}")
        return jsonify({"error": "Error fetching eco-data-point"}), 500

@main.route('/currencies')
def get_currencies():
    try:
        # Call the function that fetches the currencies data with price and percent change
        currencies = fetch_currencies()  # Ensure this function returns the correct data structure

        # If currencies were fetched successfully
        if currencies:
            return jsonify(currencies), 200
        else:
            return jsonify({"message": "No currencies found."}), 404
    except Exception as e:
        # Handle any unexpected errors
        print(f"Error fetching currencies: {e}")
        return jsonify({"error": "Internal server error"}), 500

@main.route('/currencies/<int:currency_id>')
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
        print(f"Error fetching currency data: {e}")
        return jsonify({"error": "Error fetching currency data"}), 500

@main.route('/currencies/divide', methods=['GET'])
def divide_currencies():
    security_long_name1 = request.args.get('security_long_name1')
    security_long_name2 = request.args.get('security_long_name2')

    print(f"Received security_long_name1: {security_long_name1}")  # Debugging line
    print(f"Received security_long_name2: {security_long_name2}")  # Debugging line

    if not security_long_name1 or not security_long_name2:
        return jsonify({'error': 'Security long names are required'}), 400

    try:
        # Get security IDs from long names
        security_id1 = get_security_id(security_long_name1)
        security_id2 = get_security_id(security_long_name2)
        
        if security_id1 is None or security_id2 is None:
            return jsonify({'error': 'Invalid security long names'}), 400

        # Call the stored procedure
        data = call_divided_price_procedure(security_id1, security_id2)

        if not data:
            return jsonify({'error': 'No data found for the given security IDs'}), 404

        # Extracting the last three letters of each security_long_name
        abbrev1 = security_long_name1[-3:]
        abbrev2 = security_long_name2[-3:]

        # Formatting the price_date
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
        return jsonify({'error': str(e)}), 500

@main.route('/market-ratios/divide', methods=['GET'])
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

        return jsonify({
            'divided_prices': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@main.route('/correlations', methods=['GET'])
def correlations():
    sec_id = request.args.get('sec_id', type=int)
    sec_id2 = request.args.get('sec_id2', type=int)
    period = request.args.get('period', type=int)
    timeframe_type = request.args.get('timeframe_type', type=str)
    end_date = request.args.get('end_date', type=str)

    results = get_correlation_data(sec_id, sec_id2, period, timeframe_type, end_date)

    if results:
        return jsonify(results)  # or format the results as needed
    else:
        return jsonify({"error": "No data found"}), 404
    
@main.route('/returns', methods=['GET'])
def returns_overview():
    try:
        return render_template('returns.html')  # Renders the main page with links
    except Exception as e:
        print(f"Error loading returns page: {e}")
        return jsonify({'error': str(e)}), 500

# Route for Gold returns (ID = 1)
@main.route('/returns/1', methods=['GET'])
def get_gold_returns():
    try:
        result = fetch_gld_currency_returns()  # Fetch the Gold data
        if result:  
            return jsonify(result), 200  
        else:
            return jsonify({"error": "No data found"}), 404  
    except Exception as e:
        print(f"Error fetching Gold returns: {e}")  
        return jsonify({'error': str(e)}), 500

# Route for Silver returns (ID = 2)
@main.route('/returns/2', methods=['GET'])
def get_silver_returns():
    try:
        result = fetch_slv_currency_returns()  # Fetch the Silver data
        if result:  
            return jsonify(result), 200  
        else:
            return jsonify({"error": "No data found"}), 404  
    except Exception as e:
        print(f"Error fetching Silver returns: {e}")
        return jsonify({'error': str(e)}), 500
    
@main.route('/annualreturns', methods=['GET'])
def annual_returns():
    try:
        data = get_annual_returns()  # Fetch data from stored procedure
        return jsonify(data)  # Return the data as JSON
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@main.route('/securities/asset-class-2', methods=['GET'])
def get_stock_markets_priced_in_gold():
    try:
        # Call the existing function to fetch stock markets
        result = fetch_stock_markets()
        if result:
            return jsonify(result), 200
        else:
            return jsonify({"error": "No data found"}), 404
    except Exception as e:
        print(f"Error fetching stock markets: {e}")
        return jsonify({'error': str(e)}), 500

@main.route('/securities/returns/<int:security_id>', methods=['GET'])
def get_stock_market_return_by_security(security_id):
    """Fetches the stock market return by calling the stored procedure."""
    try:
        # Call the stored procedure with the security_id parameter
        result = divide_stock_market_by_gold(security_id)
        if result:
            return jsonify(result), 200
        else:
            return jsonify({"error": "No data found for this security."}), 404
    except Exception as e:
        print(f"Error fetching stock market return for security_id {security_id}: {e}")
        return jsonify({'error': str(e)}), 500

@main.route('/nw-hpi/<int:eco_data_point_id>', methods=['GET'])
def nw_hpi(eco_data_point_id):
    """
    Route to fetch NW HPI data for a given eco_data_point_id.
    """
    if eco_data_point_id < 1 or eco_data_point_id > 14:
        return jsonify({'error': 'Invalid eco_data_point_id. Must be between 1 and 14.'}), 400
    
    data = get_nw_hpi(eco_data_point_id)
    if not data:
        return jsonify({'error': 'No data found or an error occurred.'}), 404
    
    return jsonify(data)

@main.route('/market_leagues')
def get_market_leagues():
    try:
        market_leagues = fetch_market_leagues()  # Correct function call to fetch market leagues
        return jsonify(market_leagues)
    except Exception as e:
        print(f"Error fetching market leagues: {e}")
        return jsonify({'error': str(e)}), 500
    
@main.route('/market_league_table/<int:league_id>/<string:date>', methods=['GET'])
def get_market_league_table(league_id, date):
    try:
        print(f"Fetching league table for league ID: {league_id} on date: {date}")
        
        # Call the stored procedure through db_utils
        league_table = fetch_market_league_table(league_id, date)
        
        print(f"Fetched league table: {league_table}")
        
        if league_table:
            return jsonify(league_table), 200
        else:
            return jsonify({'error': 'No data found'}), 404
    except Exception as e:
        print(f"Error fetching league table: {e}")
        return jsonify({'error': str(e)}), 500
    
@main.route('/get_market_league_constituents/<int:ml_id>', methods=['GET'])
def get_market_league_constituents(ml_id):
    try:
        data = fetch_market_league_constituents(ml_id)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@main.route('/get_market_league_data/<int:constituent_id>', methods=['GET'])
def get_market_league_data(constituent_id):
    try:
        data = fetch_market_league_data_by_constituent_id(constituent_id)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@main.route("/precious-metals", methods=["GET"])
def get_precious_metals_route():
    try:
        metals = fetch_precious_metals()
        return jsonify({"data": metals})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route("/precious-metals/daily-moves", methods=["GET"])
def get_daily_moves_route():
    security_id = request.args.get("id")
    year = request.args.get("year", datetime.now().year)

    if not security_id:
        return jsonify({"error": "Missing id parameter"}), 400

    try:
        data = fetch_daily_moves_by_year_and_security(year, security_id)
        return jsonify({"data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@main.route('/api/crypto-prices', methods=['GET'])
def get_crypto_prices():
    try:
        # List of cryptocurrencies to fetch data for
        crypto_tickers = ['BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD', 'SOL-USD', 'DOT-USD', 'UNI-USD', 'LTC-USD']
        crypto_data = {}

        for ticker in crypto_tickers:
            print(f"Fetching data for ticker: {ticker}")  # Debugging line
            crypto = yf.Ticker(ticker)
            # Use '1mo' to get up to 1 month of data
            hist = crypto.history(period="1mo")  
            if hist.empty:
                crypto_data[ticker] = {"error": "No data found"}
            else:
                # Filter to the last 10 days
                hist = hist.tail(10)
                crypto_data[ticker] = hist.reset_index().to_dict(orient='records')

        return jsonify(crypto_data)
    except Exception as e:
        print(f"Error fetching cryptocurrency data: {e}")  # Debugging line
        return jsonify({"error": str(e)}), 500

@main.route('/api/crypto-price-history/<ticker>', methods=['GET'])
def get_crypto_price_history(ticker):
    try:
        timeframe = request.args.get('timeframe', '1y')  # Default to 1 year if no timeframe is provided

        # Check if the ticker already ends with '-USD'
        if not ticker.endswith('-USD'):
            ticker = f"{ticker}-USD"  # Append '-USD' only if it's not already present
        
        print(f"Fetching data for ticker: {ticker} with timeframe: {timeframe}")  # Debugging line
        
        # Fetch historical data for the given ticker and timeframe
        crypto = yf.Ticker(ticker)
        data = crypto.history(period=timeframe, interval="1d")
        
        if data.empty:
            print(f"No data found for ticker: {ticker}")  # Debugging line
            return jsonify({"error": "No data found for the specified ticker"}), 404
        
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching cryptocurrency price history for {ticker}: {e}")  # Debugging line
        return jsonify({"error": str(e)}), 500

@main.route('/api/gold-price-history', methods=['GET'])
def get_gold_price_history():
    try:
        gold = yf.Ticker("GC=F")
        hist = gold.history(period="10y")
        data = hist.reset_index().to_dict(orient='records')
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching gold price history: {e}")
        return jsonify({"error": str(e)}), 500

@main.route('/api/bitcoin-price-history', methods=['GET'])
def get_bitcoin_price_history():
    try:
        btc = yf.Ticker("BTC-USD")
        data = btc.history(period="10y", interval="1d")
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching bitcoin price history: {e}")
        return jsonify({"error": str(e)}), 500

@main.route('/api/usd-price-history', methods=['GET'])
def get_usd_price_history():
    try:
        usd = yf.Ticker("DX-Y.NYB")
        data = usd.history(period="10y", interval="1d")
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching USD price history: {e}")
        return jsonify({"error": str(e)}), 500

@main.route('/api/sp500-price-history', methods=['GET'])
def get_sp500_price_history():
    try:
        sp500 = yf.Ticker("^GSPC")
        data = sp500.history(period="10y", interval="1d")
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching S&P 500 price history: {e}")
        return jsonify({"error": str(e)}), 500

@main.route('/api/apple-price-history', methods=['GET'])
def get_apple_price_history():
    try:
        apple = yf.Ticker("AAPL")
        data = apple.history(period="10y", interval="1d")
        data.reset_index(inplace=True)
        result = data[['Date', 'Open', 'High', 'Low', 'Close']].to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching Apple price history: {e}")
        return jsonify({"error": str(e)}), 500
    
@main.route('/update-price/<int:security_id>', methods=['POST'])
def update_price(security_id):
    try:
        security = fetch_security_data(security_id)

        if not security:
            return jsonify({"error": "Security not found"}), 404

        ticker_symbol = security.get("ticker_symbol")
        result = update_price_history(security_id, ticker_symbol)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route('/api/stock-prices', methods=['GET'])
def get_stock_prices():
    try:
        stocks = {
            "Gold": "GC=F",
            "S&P500": "^GSPC",
            "FTSE100": "^FTSE",
            "BlackRock World Mining Trust": "BRWM.L",
            "Natural Gas": "NG=F",
            "BP": "BP",
            "USD/GBP": "GBPUSD=X",
            "Tesla": "TSLA",
            "Ethereum": "ETH-USD",
            "GBP/EUR": "GBPEUR=X",
            "Bitcoin": "BTC-USD",
            "Shell plc": "SHEL.L",
            "Crude Oil": "CL=F",
            "Silver": "SI=F",
            "DAX": "^GDAXI",
            "Hang Seng": "^HSI",
            "S&P GSCI Precious Metals Index": "^SPGSPMTR",
            "Vodafone": "VODL.XC"
        }

        stock_data = {}
        for name, symbol in stocks.items():
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")  # Get last three days of data
            if len(hist) >= 3:
                # Extract the last two closing prices
                current_price = hist['Close'].iloc[-1]
                previous_price = hist['Close'].iloc[-2]
                
                stock_data[name] = {
                    "current_price": current_price,
                    "previous_price": previous_price,
                }

        return jsonify(stock_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@main.route('/trending-securities')
def get_trending_securities():
    try:
        stocks = {
            "Gold": "GC=F",
            "Cocoa": "CC=F",
            "Platinum": "PL=F",
            "Natural Gas": "NG=F",
            "Silver": "SI=F",
            "US Dollar": "DX=F",
            "British Pound": "GBPUSD=X",
            "Bitcoin": "BTC-USD",
            "Euro": "EURUSD=X",
            "Australian Dollar": "AUDUSD=X",
            "Dow Jones": "^DJI",
            "Hang Seng": "^HSI",
            "FTSE100": "^FTSE",
            "DAX": "^GDAXI",
            "Shanghai Composite": "000001.SS"
        }

        stock_data = {}

        for name, symbol in stocks.items():
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")

            if len(hist) >= 2:
                current_price = hist['Close'].iloc[-1]
                previous_price = hist['Close'].iloc[-2]
                percent_change = ((current_price - previous_price) / previous_price) * 100

                stock_data[name] = {
                    "current_price": current_price,
                    "previous_price": previous_price,
                    "percent_change": round(percent_change, 2)
                }
            else:
                stock_data[name] = {
                    "current_price": None,
                    "previous_price": None,
                    "percent_change": "No Data"
                }

        return jsonify(stock_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500