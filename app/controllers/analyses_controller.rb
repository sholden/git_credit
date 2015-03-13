class AnalysesController < ApplicationController
  $analyses ||= {}

  def show
    repository = Repository.find(params[:id])
    $analyses[repository.id] ||= Analyzer.new(repository.path).tap(&:analyze!)

    render json: $analyses[repository.id].as_json
  end
end