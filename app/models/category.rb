class Category < ApplicationRecord
  has_many :stocks
  # has_many :histories, through: :categories
end
