class CreateBlogs < ActiveRecord::Migration[6.1]
  def change
    create_table :blogs do |t|
      t.string :title
      t.text :content
      t.string :publisher
      t.datetime :published_at

      t.timestamps
    end
  end
end
