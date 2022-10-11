class Blog < ApplicationRecord
  belongs_to :user
  has_one_attached :image_url
  has_many :comments, dependent: :destroy

  validates :title, :subtitle, :content, presence: true
  validates :subtitle, length: { in: 15..500 }
  validates :content, length: { in: 250..5000 }
end
