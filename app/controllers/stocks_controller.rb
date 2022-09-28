class StocksController < ApplicationController
  skip_before_action :authenticate_user!, only: [ :index, :show ]

  def index
    @stocks = Stock.all
    @categories = Category.all
    # @category = Category.find(params[:category_id])
    # @stock = @category.stocks.find(params[:id])
  end

  def show
    @category = Category.find(params[:id])
    @stock = Stock.where(params[:category_id])
  end
end
