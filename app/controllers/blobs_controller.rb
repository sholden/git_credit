class BlobsController < ApplicationController
  def show
    repository = Repository.find(params[:repository_id])
    rugged = Rugged::Repository.new(repository.path)
    blob = rugged.lookup(params[:id])
    render text: blob.content
  end
end