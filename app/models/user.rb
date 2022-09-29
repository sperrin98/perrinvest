class User < ApplicationRecord
  has_many :blogs
  has_many :comments
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
  devise :database_authenticatable, :authentication_keys => [:username]

  validates :email, uniqueness: true
  validates :username, uniqueness: true
end
