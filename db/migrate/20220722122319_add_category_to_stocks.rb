class AddCategoryToStocks < ActiveRecord::Migration[6.1]
  def change
    add_column :stocks, :category, :string
  end
end
