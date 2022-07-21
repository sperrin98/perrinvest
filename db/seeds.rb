require 'csv'
# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

gold = Stock.create(name: "Gold")
puts "Stock: Gold created"

filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/gold.csv'

CSV.foreach(filepath, headers: true) do |row|
  row = History.create({
    :stock_id  => row[0],
    :date => row[1],
    :price => row[2]
  })
end
