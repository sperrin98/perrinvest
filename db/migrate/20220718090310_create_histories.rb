class CreateHistories < ActiveRecord::Migration[6.1]
  def change
    create_table :histories do |t|
      t.date :date
      t.integer :price
      t.references :stock, null: false, foreign_key: true

      t.timestamps
    end
  end
end
