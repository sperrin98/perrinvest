class CreateHistories < ActiveRecord::Migration[6.1]
  def change
    create_table :histories do |t|
      t.integer :price
      t.date :date
      t.references :stock, null: false, foreign_key: true

      t.timestamps
    end
  end
end
