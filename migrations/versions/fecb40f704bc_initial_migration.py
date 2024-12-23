"""Initial migration

Revision ID: fecb40f704bc
Revises: 
Create Date: 2024-08-27 22:19:29.197293

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'fecb40f704bc'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('accounts')
    op.drop_table('security')
    op.drop_table('brokers')
    op.drop_table('countries')
    op.drop_table('investment_types')
    op.drop_table('currencies')
    op.drop_table('market_ratios')
    op.drop_table('transactions')
    op.drop_table('market_league_data')
    with op.batch_alter_table('market_league_constituents', schema=None) as batch_op:
        batch_op.drop_index('constituent_ID_UNIQUE')

    op.drop_table('market_league_constituents')
    op.drop_table('clients')
    op.drop_table('holding_trades')
    op.drop_table('price_histories')
    op.drop_table('transaction_types')
    op.drop_table('markets')
    op.drop_table('securities')
    with op.batch_alter_table('market_leagues', schema=None) as batch_op:
        batch_op.drop_index('market_league_ID_UNIQUE')

    op.drop_table('market_leagues')
    op.drop_table('asset_classes')
    op.drop_table('eco_data_points_histories')
    op.drop_table('eco_data_points')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('eco_data_points',
    sa.Column('eco_data_point_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('eco_data_point_name', mysql.VARCHAR(length=225), nullable=True),
    sa.Column('period', mysql.VARCHAR(length=45), nullable=True),
    sa.PrimaryKeyConstraint('eco_data_point_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('eco_data_points_histories',
    sa.Column('eco_data_point_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('price_date', sa.DATE(), nullable=True),
    sa.Column('price', mysql.DECIMAL(precision=5, scale=2), nullable=True),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('asset_classes',
    sa.Column('asset_class_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('asse_class_name', mysql.VARCHAR(length=45), nullable=True),
    sa.Column('position_size_min', mysql.DECIMAL(precision=5, scale=2), nullable=True),
    sa.Column('position_size_max', mysql.DECIMAL(precision=5, scale=2), nullable=True),
    sa.PrimaryKeyConstraint('asset_class_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('market_leagues',
    sa.Column('market_league_ID', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('market_league_name', mysql.VARCHAR(length=45), nullable=False),
    sa.Column('start_date', sa.DATE(), nullable=True),
    sa.PrimaryKeyConstraint('market_league_ID'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    with op.batch_alter_table('market_leagues', schema=None) as batch_op:
        batch_op.create_index('market_league_ID_UNIQUE', ['market_league_ID'], unique=True)

    op.create_table('securities',
    sa.Column('security_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('security_long_name', mysql.VARCHAR(length=255), nullable=True),
    sa.Column('security_short_name', mysql.VARCHAR(length=255), nullable=True),
    sa.Column('ticker', mysql.VARCHAR(length=255), nullable=True),
    sa.Column('currency_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('asset_class_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('investment_type_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('country_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('price_adjustment_factor', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('notes', mysql.VARCHAR(length=255), nullable=True),
    sa.Column('market_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('tradeable', mysql.TINYINT(), autoincrement=False, nullable=True),
    sa.Column('ISIN', mysql.VARCHAR(length=12), nullable=True),
    sa.PrimaryKeyConstraint('security_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('markets',
    sa.Column('market_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('market_name', mysql.VARCHAR(length=45), nullable=True),
    sa.PrimaryKeyConstraint('market_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('transaction_types',
    sa.Column('trade_type_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('trade_type_name', mysql.VARCHAR(length=225), nullable=True),
    sa.Column('investment_type_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('investment_buy_or_sell', mysql.TINYINT(), autoincrement=False, nullable=True),
    sa.Column('nominal_ledger_notes', mysql.VARCHAR(length=225), nullable=True),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('price_histories',
    sa.Column('security_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('price_date', sa.DATE(), nullable=False),
    sa.Column('price', mysql.DOUBLE(asdecimal=True), nullable=True),
    sa.Column('MA_5d', mysql.DOUBLE(asdecimal=True), nullable=True),
    sa.Column('MA_40d', mysql.DOUBLE(asdecimal=True), nullable=True),
    sa.Column('MA_200d', mysql.DOUBLE(asdecimal=True), nullable=True),
    sa.PrimaryKeyConstraint('security_id', 'price_date'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('holding_trades',
    sa.Column('ID', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('client_ID', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('security_ID', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('trade_date', mysql.DATETIME(), nullable=True),
    sa.Column('trade_quantity', mysql.DECIMAL(precision=20, scale=8), nullable=True),
    sa.Column('running_quantity', mysql.DECIMAL(precision=20, scale=8), nullable=True),
    sa.Column('price', mysql.DECIMAL(precision=20, scale=8), nullable=True),
    sa.Column('P&L', mysql.DECIMAL(precision=20, scale=8), nullable=True),
    sa.Column('book_price', mysql.DECIMAL(precision=20, scale=8), nullable=True),
    sa.PrimaryKeyConstraint('ID'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('clients',
    sa.Column('client_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('client_name', mysql.VARCHAR(length=225), nullable=True),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('market_league_constituents',
    sa.Column('constituent_ID', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('market_league_ID', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('security_ID', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('constituent_ID'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    with op.batch_alter_table('market_league_constituents', schema=None) as batch_op:
        batch_op.create_index('constituent_ID_UNIQUE', ['constituent_ID'], unique=True)

    op.create_table('market_league_data',
    sa.Column('price_date', sa.DATE(), nullable=False),
    sa.Column('constituent_ID', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('price', mysql.DOUBLE(asdecimal=True), nullable=False),
    sa.Column('daily_move', mysql.DOUBLE(asdecimal=True), nullable=True),
    sa.Column('relative_index', mysql.DOUBLE(asdecimal=True), nullable=True),
    sa.Column('relative_index_EMA13', mysql.DOUBLE(asdecimal=True), nullable=True),
    sa.Column('relative_index_EMA55', mysql.DOUBLE(asdecimal=True), nullable=True),
    sa.PrimaryKeyConstraint('price_date', 'constituent_ID'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('transactions',
    sa.Column('transaction_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('trade_date', mysql.DATETIME(), nullable=True),
    sa.Column('settlement_date', mysql.DATETIME(), nullable=True),
    sa.Column('client_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('trade_type_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('broker_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('security_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('BuyOrSell', mysql.TINYINT(), autoincrement=False, nullable=True, comment='1 forf Buy, -1 for Sell'),
    sa.Column('quantity', mysql.DECIMAL(precision=20, scale=8), nullable=True),
    sa.Column('price', mysql.DECIMAL(precision=20, scale=8), nullable=True),
    sa.Column('fees', mysql.DECIMAL(precision=10, scale=2), nullable=True),
    sa.Column('total_consideration', mysql.DECIMAL(precision=20, scale=2), nullable=True),
    sa.Column('notes', mysql.VARCHAR(length=225), nullable=True),
    sa.PrimaryKeyConstraint('transaction_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('market_ratios',
    sa.Column('market_ratio_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('ratio_name', mysql.VARCHAR(length=225), nullable=True),
    sa.Column('description', mysql.VARCHAR(length=225), nullable=True),
    sa.Column('security_id1', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('security_id2', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('market_ratio_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('currencies',
    sa.Column('currency_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('currency_name', mysql.VARCHAR(length=45), nullable=True),
    sa.Column('currency_code', mysql.VARCHAR(length=45), nullable=True),
    sa.PrimaryKeyConstraint('currency_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('investment_types',
    sa.Column('investment_type_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('investment_type_name', mysql.VARCHAR(length=45), nullable=True),
    sa.PrimaryKeyConstraint('investment_type_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('countries',
    sa.Column('country_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('country_name', mysql.VARCHAR(length=45), nullable=True),
    sa.PrimaryKeyConstraint('country_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('brokers',
    sa.Column('broker_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('broker_name', mysql.VARCHAR(length=225), nullable=True),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('security',
    sa.Column('security_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('security_long_name', mysql.VARCHAR(length=225), nullable=True),
    sa.Column('security_short_name', mysql.VARCHAR(length=225), nullable=True),
    sa.Column('ticker', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('currency_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('asset_class_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('investment_type_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('country_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('price_adjustment_factor', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('notes', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('market_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('tradeable', mysql.TINYINT(display_width=1), autoincrement=False, nullable=True),
    sa.Column('ISIN', mysql.VARCHAR(length=12), nullable=True),
    sa.PrimaryKeyConstraint('security_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('accounts',
    sa.Column('account_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('client_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('transaction_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('account_date', sa.DATE(), nullable=True),
    sa.Column('account_class_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('amount', mysql.INTEGER(), autoincrement=False, nullable=True),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    # ### end Alembic commands ###
