class Blog < ApplicationRecord
  has_one_attached :image_url

  validates :title, :subtitle, :content, :publisher, presence: true
  validates :subtitle, length: { in: 15..500 }
  validates :content, length: { in: 250..5000 }
end
