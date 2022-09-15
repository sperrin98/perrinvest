class BlogsController < ApplicationController
  def index
  end

  def new
    @blog = Blog.new
  end

  def create
  end
end
