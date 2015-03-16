class ObjectsController < ApplicationController
  def index
    @repository = Repository.find(params[:repository_id])
    @reader = IndexReader.new(@repository)
    @objects = @reader.to_a

    render json: @objects
  end
end