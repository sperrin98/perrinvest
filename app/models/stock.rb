class Stock < ApplicationRecord
  belongs_to :category, optional: true
end
