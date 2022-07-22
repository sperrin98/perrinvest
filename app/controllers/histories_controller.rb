class HistoriesController < ApplicationController
  def index
    @histories = History.all
  end

  def show
    @history = History.new
  end

  def import
    History.import(params[:file])
    redirect_to root_url, notice: "Stock data imported"
  end
end
