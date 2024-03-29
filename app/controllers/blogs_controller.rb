class BlogsController < ApplicationController
  skip_before_action :authenticate_user!, only: [ :index, :show, :edit, :destroy ]
  before_action :find_blog, only: [:show, :edit, :update, :destroy]
  def index
    @blogs = Blog.all
  end

  def show
    @comment = Comment.where(blog_id: @blog.id)
    @blog = Blog.find(params[:id])
    @blogs = Blog.all
    @comments = @blog.comments
  end

  def new
    @blog = Blog.new
  end

  def create
    @blog = Blog.new(blog_params)
    if @blog.save
      redirect_to blogs_path
    else
      render :new
    end
  end

  def edit
    @blog = Blog.find(params[:id])
  end

  def update
    @blog = Blog.find(params[:id])
    @blog.update(blog_params)
    redirect_to blog_path(@blog)
  end

  def destroy
    @user = current_user
    @blog = Blog.find(params[:id])
    @blog.destroy
    redirect_to blogs_path
  end

  private

  def find_blog
    @blog = Blog.find(params[:id])
  end

  def blog_params
    params.require(:blog).permit(:id, :title, :content, :publisher, :published_at, :subtitle, :image_url)
  end
end
