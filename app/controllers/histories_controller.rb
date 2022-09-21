class HistoriesController < ApplicationController
  def index
    @histories = History.all
  end

  def show
    @history = History.find(params[:stock_id])
  end
end
