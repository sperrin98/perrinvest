class Blog < ApplicationRecord

  validates :title, :subtitle, :content, :publisher, presence: true
  validates :subtitle, length: { minimum: 50 }
  validates :content, length: { in: 250..5000 }
end
