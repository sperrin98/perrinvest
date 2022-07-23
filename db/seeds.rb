require 'csv'
# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

gold = Stock.create(name: "Gold")
silver = Stock.create(name: "Silver")
platinum = Stock.create(name: "Platinum")
nikkei = Stock.create(name: "Nikkei")
spx = Stock.create(name: "SPX")
ftse = Stock.create(name: "FTSE100")
shcomp = Stock.create(name: "Shanghai Comp")
dow = Stock.create(name: "Dow Jones")
puts "Stocks created"

bond = Category.create(category_name: "Bond");
share = Category.create(category_name: "Share");
equity_index = Category.create(category_name: "Equity Index");
commodity = Category.create(category_name: "Commodity");
currency = Category.create(category_name: "Currency");
crytocurrency = Category.create(category_name: "Crytocurrency");
puts "Categories created";

# file = '/Users/stanleyperrin/code/sperrin98/perrinvest/gold.csv'


# CSV.foreach(file.path, headers: true) do |row|
#   History.create! row.to_hash
# end
# CSV.foreach(filepath, headers: true) do |row|
#   row = History.create({
#     :stock_id  => row[0],
#     :date => row[1],
#     :price => row[2]
#   })
# end
