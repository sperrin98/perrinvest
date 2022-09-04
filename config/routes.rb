Rails.application.routes.draw do
  devise_for :authors
  get 'home/index'
  devise_for :users do
  get '/users/sign_out' => 'devise/sessions#destroy'
end
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root to: "home#index"
  get "/about", to: "pages#home"

  resources :stocks do
    resources :histories, only: [:index, :show ]
  end
  resources :blogs
end
