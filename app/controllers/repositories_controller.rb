class RepositoriesController < ApplicationController
  def index
    render json: Repository.all
  end

  def show
    render json: Repository.find(params[:id])
  end
end