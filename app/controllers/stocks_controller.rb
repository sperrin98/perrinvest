class StocksController < ApplicationController

  def index
    @stocks = Stock.all
  end

  def show
    @stock = Stock.find(params[:id])
    @history - History.find(params[:stock_id])
  end
end
