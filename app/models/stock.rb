class Stock < ApplicationRecord
  belongs_to :category
  has_many :histories
end
