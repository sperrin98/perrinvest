class AddImageUrlToBlog < ActiveRecord::Migration[6.1]
  def change
    add_column :blogs, :image_url, :string
  end
end
