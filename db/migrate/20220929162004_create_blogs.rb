class CreateBlogs < ActiveRecord::Migration[6.1]
  def change
    create_table :blogs do |t|
      t.string :title
      t.text :content
      t.string :image_url
      t.string :subtitle
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
