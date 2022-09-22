class StocksController < ApplicationController

  def index
    @stocks = Stock.all
  end

  def show
    @stock = Stock.find(params[:id])
    @history = History.find(params[:stock_id])
    @stocks = Stock.where(id: @stock_id)
    @histories = History.where(stock_id: @stock.id)
  end
end
