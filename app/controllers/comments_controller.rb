class CommentsController < ApplicationController
  before_action :find_blog, only: [:new, :create]

  def index
    @comment = Comment.where(blog_id: @blog.id)
  end

  def new
    @comment = Comment.new
  end

  def create
    @blog = Blog.find(params[:blog_id])
    @comments = @blog.comments.build(comment_params.merge({user: current_user}))
    @comments.save
    redirect_to blog_path(@blog)
  end

  def show
    @comment = Comment.new
  end

  private

  def find_blog
    @blog = Blog.find(params[:blog_id])
  end

  def comment_params
    params.require(:comment).permit(:body)
  end
end
