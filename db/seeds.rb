require 'csv'
# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/stocks.csv'

CSV.foreach(Rails.root.join(filepath), headers: true) do |row|
  Stock.create!( {
    id: row["id"],
    name: row["name"]
  })
  puts "#{row[0]}, #{row[1]}"
  puts "Stocks created"
end

gold_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/gold.csv'

CSV.foreach(Rails.root.join(gold_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stocks_id: x["stocks_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Gold histories created"

silver_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/silver.csv'

CSV.foreach(Rails.root.join(silver_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stocks_id: x["stocks_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Silver histories created"

platinum_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/platinum.csv'

CSV.foreach(Rails.root.join(platinum_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stocks_id: x["stocks_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Platinum histories created"

dow_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/dowjones.csv'

CSV.foreach(Rails.root.join(dow_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stocks_id: x["stocks_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "DOW Jones histories created"

shcomp_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/shcomp.csv'

CSV.foreach(Rails.root.join(shcomp_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stocks_id: x["stocks_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Shanghai Composite histories created"
