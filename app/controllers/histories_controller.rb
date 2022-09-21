class HistoriesController < ApplicationController
  def index
    @histories = History.all
  end

  def show
    @history = History.find(params[:stock_id])
    @stock = Stock.find(params[:id])
    @histories = History.where(stock_id: @stock.id)
    @stocks = Stock.where(id: @stock_id)
  end
end
