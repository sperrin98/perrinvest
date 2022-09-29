class CommentsController < ApplicationController

  def new
    @comment = Comment.new
  end

  def create
    @blog = Blog.find(params[:blog_id])
    @comment = Comment.new(comment_params)
    @comment.blog = @blog
    @comment.user = current_user
    @comment.save
    redirect_to blog_path(@blog)
  end

  def show
    @comments = Comment.all
  end

  private

  def comment_params
    params.require(:comment).permit(:body)
  end
end
