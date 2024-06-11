from . import db

class Security(db.Model):
    __tablename__ = 'securities'
    security_id = db.Column(db.Integer, primary_key=True, nullable=False)
    security_long_name = db.Column(db.String(255), unique=False, nullable=True)
    security_short_name = db.Column(db.String(255), unique=False, nullable=True)
    ticker = db.Column(db.String(255), unique=False, nullable=True)
    currency_id = db.Column(db.Integer, unique=False, nullable=True)
    asset_class_id = db.Column(db.Integer, unique=False, nullable=True)
    investment_type_id = db.Column(db.Integer, unique=False, nullable=True)
    country_id = db.Column(db.Integer, unique=False, nullable=True)
    price_adjustment_factor = db.Column(db.Integer, unique=False, nullable=True)
    notes = db.Column(db.String(255), unique=False, nullable=True)
    market_id = db.Column(db.Integer, unique=False, nullable=True)
    tradeable = db.Column(db.Boolean, unique=False, nullable=True)
    ISIN = db.Column(db.String(12), unique=False, nullable=True)

    def __repr__(self):
        return f'<Security {self.security_long_name}>'
    
class MarketRatio(db.Model):
    __tablename__ = 'market_ratios'
    market_ratio_id = db.Column(db.Integer, primary_key = True, nullable=False)
    ratio_name = db.Column(db.String(225), unique=False, nullable=False)
    description = db.Column(db.String(225), unique=False, nullable=False)
    security_id1 = db.Integer(db.Integer, unique=False, nullable=False)
    security_id2 = db.Integer(db.Integer, unique=False, nullable=False)

class PriceHistory(db.Model):
     security_id = db.Column(db.Integer, primary_key=True, nullable=False)
     price_date = db.Column(db.Date, primary_key=True, nullable=False)
     price = db.Column(db.Double, unique=False, nullable=False)
     MA_5d = db.Column(db.Double, unique=False, nullable=False)
     MA_40d = db.Column(db.Double, unique=False, nullable=False)
     MA_200d = db.Column(db.Double, unique=False, nullable=False)

