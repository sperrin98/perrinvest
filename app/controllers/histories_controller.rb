class HistoriesController < ApplicationController
  def index
    @histories = History.all
  end

  def show
    @history = History.find(params[:id])
  end
end
