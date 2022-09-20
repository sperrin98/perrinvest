class AddImageUrlToStocks < ActiveRecord::Migration[6.1]
  def change
    add_column :stocks, :image_url, :string
  end
end
