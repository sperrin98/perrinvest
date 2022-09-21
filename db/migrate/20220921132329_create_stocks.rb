class CreateStocks < ActiveRecord::Migration[6.1]
  def change
    create_table :stocks do |t|
      t.string :name
      t.integer :history_id

      t.timestamps
    end
  end
end
