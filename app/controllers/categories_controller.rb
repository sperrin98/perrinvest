class CategoriesController < ApplicationController
  skip_before_action :authenticate_user!, only: [ :index, :show ]
  def index
    @categories = Category.all
    @stocks = Stock.all
  end

  def show
    @category = Category.find(params[:id])
    @stock = Stock.find(params[:id])
    @categories = Category.where(id: @stocks)
    @stocks = Stock.where(category_id: @stock.id)
  end

private

  def category_params
    params.require(:category).permit(:id, :name)
  end

end
