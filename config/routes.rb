Rails.application.routes.draw do
  devise_for :authors
  get 'home/index'
  devise_for :users do
  get '/users/sign_out' => 'devise/sessions#destroy'
end
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root to: "home#index"
  get "/about", to: "pages#home"

  resources :categories, only: [ :index, :show ] do
    resources :stocks, only: [ :index, :show ]
  end

  resources :stocks, only: [ :index, :show ] do
    resources :histories, only: [ :index ]
  end

  resources :blogs, only: [ :index, :show, :edit, :update, :destroy, :new, :create ]
end
