class HistoriesController < ApplicationController
  skip_before_action :authenticate_user!, only: :index
  def index
    @histories = History.all
    @history = History.find(params[:stock_id])
    @stock = Stock.find(params[:stock_id])
    @histories = History.where(stock_id: @stock.id)
    @stocks = Stock.where(id: @histories)
  end

  # def prices
  #   render json: History.group_by_month(:price).count
  # end

  # def dates
  #   render json: History
  # end
  # end



  # def show
  #   @history = History.find(params[:stock_id])
  #   @stock = Stock.find(params[:id])
  #   @histories = History.where(stock_id: @stock.id)
  #   @stocks = Stock.where(id: @histories)
  # end
end
