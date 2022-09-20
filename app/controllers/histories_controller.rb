class HistoriesController < ApplicationController
  def index
    @histories = History.all
  end

  def show
    @history = History.new
  end
end
