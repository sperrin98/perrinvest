class Comment < ApplicationRecord
  belongs_to :blog
  belongs_to :user

  validates :comments, presence: true
  validates :body, length: { in: 10..250 }
end
