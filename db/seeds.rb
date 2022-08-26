require 'csv'
# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)


stocks = []
filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/stocks.csv'

CSV.foreach(Rails.root.join(filepath), headers: true) do |row|
  Stock.create( {
    id: row["id"],
    name: row["name"]
  })
  puts "#{row[0]}, #{row[1]}"
end
