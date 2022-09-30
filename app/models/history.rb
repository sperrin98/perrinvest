class History < ApplicationRecord
  belongs_to :stock, optional: true
end
