class CommentsController < ApplicationController

  def new
    @comment = Comment.new
  end

  def create
    @blog = Blog.find(params[:blog_id])
    @comment = @blog.comment.create(comment_params)
    redirect_to blog_path(@blog)
  end

  private

  def comment_params
    params.require(:comment).permit(:comment)
  end
end
