require 'csv'
# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

user1 = User.create!( email: 'test@test.com', password: '123455',
  username: 'testuser')

blog1 = Blog.create!({ title: 'Blog 1', subtitle: 'This is a test
  subtitle for my blog show page, has to be over 50 characters', content: '
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
    commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
    velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
    cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
    est laborum.', user_id: '1' })

blog2 = Blog.create!({ title: 'Blog 2', subtitle: 'This is another test
      subtitle for my blog show page, has to be over 50 characters', content: '
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
        est laborum.', user_id: '1' })

blog3 = Blog.create!({ title: 'Blog 3', subtitle: 'SUBTITLE: READING FC
  ARE THE GREATEST FOOTBALL TEAM IN THE WORLD', content: '
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
    commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
    velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
    cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
    est laborum.', user_id: '1' })

blog4 = Blog.create!({ title: 'Another blog', subtitle: 'A shorter subtitle', content: '
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
        est laborum.', user_id: '1' })

blog5 = Blog.create!({ title: 'England World Cup', subtitle: 'Its is coming home', content: '
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
            commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
            velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
            est laborum.', user_id: '1' })

blog6 = Blog.create!({ title: 'Latin code generator', subtitle: 'Lorem ipsum is very useful', content: '
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
                velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
                est laborum.', user_id: '1' })


puts blog1, blog2, blog3, blog4, blog5, blog6



category_filepath = "/Users/stanleyperrin/code/sperrin98/perrinvest/category.csv"

CSV.foreach(Rails.root.join(category_filepath), headers: true) do |row|
  Category.create!( {
    id: row["id"],
    name: row["name"],
    description: row["description"],
  })
  puts "#{row[0]}, #{row[1]}, #{row[2]}"
  puts "Categories created"
end

filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/stocks.csv'

CSV.foreach(Rails.root.join(filepath), headers: true) do |row|
  Stock.create!( {
    id: row["id"],
    name: row["name"],
    category_id: row["category_id"]
  })
  puts "#{row[0]}, #{row[1]}, #{row[2]}"
  puts "Stocks created"
end

gold_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/gold.csv'

CSV.foreach(Rails.root.join(gold_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
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
    stock_id: x["stock_id"],
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
    stock_id: x["stock_id"],
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
    stock_id: x["stock_id"],
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
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Shanghai Composite histories created"

nikkei_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/nikkei.csv'

CSV.foreach(Rails.root.join(nikkei_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Japanese stock market histories created"

ftse_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/ftse.csv'

CSV.foreach(Rails.root.join(ftse_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "FTSE100 histories created"

nasdaq_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/nasdaq.csv'

CSV.foreach(Rails.root.join(nasdaq_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "NASDAQ histories created"

bitcoin_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/bitcoin.csv'

CSV.foreach(Rails.root.join(bitcoin_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Bitcoin histories created"

xrp_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/xrp.csv'

CSV.foreach(Rails.root.join(xrp_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "XRP histories created"

apple_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/apple.csv'

CSV.foreach(Rails.root.join(apple_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Apple histories created"

netflix_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/netflix.csv'

CSV.foreach(Rails.root.join(netflix_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Netflix histories created"

amazon_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/amazon.csv'

CSV.foreach(Rails.root.join(amazon_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Amazon histories created"

naturalgas_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/naturalgas.csv'

CSV.foreach(Rails.root.join(naturalgas_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Natural Gas histories created"

oil_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/crudeoil.csv'

CSV.foreach(Rails.root.join(oil_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Crude Oil histories created"

jpyvusd_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/jpyvusd.csv'

CSV.foreach(Rails.root.join(jpyvusd_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "JPY v USD histories created"

eth_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/eth.csv'

CSV.foreach(Rails.root.join(eth_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "ETH histories created"

wheat_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/wheat.csv'

CSV.foreach(Rails.root.join(wheat_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "Wheat histories created"

sandp_filepath = '/Users/stanleyperrin/code/sperrin98/perrinvest/sandp.csv'

CSV.foreach(Rails.root.join(sandp_filepath), headers: true) do |x|
  History.create!( {
    id: x["id"],
    stock_id: x["stock_id"],
    date: x["date"],
    price: x["price"]
  })

  puts "#{x[0]}, #{x[1]}, #{x[2]}, #{x[3]}"
end
puts "S&P histories created"

# create a variable with key

# url = 'https://www.alphavantage.co'
# ENV["API_KEY"]
