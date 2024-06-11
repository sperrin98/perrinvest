from flask import render_template
from app.main import main
from app.db_utils import fetch_securities, fetch_market_ratios, fetch_market_ratio_data, fetch_security_data, fetch_price_history

@main.route('/')
def home():
    return render_template('home.html')

@main.route('/securities')
def securities():
    securities = fetch_securities()
    print(securities)  # Add this line to check the data
    return render_template('securities.html', securities=securities)

@main.route('/securities/<int:security_id>')
def security_detail(security_id):
    security = fetch_security_data(security_id)
    price_history = fetch_price_history(security_id)
    return render_template('security.html', security=security, price_history=price_history)

@main.route('/market-ratios')
def market_ratios():
    market_ratios_data = fetch_market_ratios()
    print(market_ratios_data)
    return render_template('market_ratios.html', market_ratios=market_ratios_data)

@main.route('/market-ratios/<int:market_ratio_id>')
def market_ratio(market_ratio_id):
    market_ratio_data = fetch_market_ratio_data(market_ratio_id)
    ratio_name = market_ratio_data[0][0] if market_ratio_data else "Unknown Ratio"
    market_ratio_data = [(row[1], row[2]) for row in market_ratio_data]  # Remove the ratio name from each row
    return render_template('market_ratio.html', market_ratio=market_ratio_data, ratio_name=ratio_name)

