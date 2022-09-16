class Blog < ApplicationRecord

  validates :title, :subtitle, :content, :publisher, presence: true
end
