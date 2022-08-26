# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2022_08_26_131127) do

  create_table "categories", force: :cascade do |t|
    t.string "category_name"
    t.integer "stocks_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["stocks_id"], name: "index_categories_on_stocks_id"
  end

  create_table "histories", force: :cascade do |t|
    t.integer "price"
    t.date "date"
    t.integer "stocks_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["stocks_id"], name: "index_histories_on_stocks_id"
  end

  create_table "stocks", force: :cascade do |t|
    t.string "name"
    t.integer "category_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  add_foreign_key "categories", "stocks", column: "stocks_id"
  add_foreign_key "histories", "stocks", column: "stocks_id"
end
