require 'csv'
class History < ApplicationRecord
  belongs_to :stock

  def self.import(file)
    CSV.foreach(file.path, headers: true) do |row|
      History.create! row.to_hash
    end
  end
end
