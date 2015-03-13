class AnalysesController < ApplicationController
  def show
    $analysis ||= Analyzer.new('../clone').tap(&:analyze!)
    render json: $analysis.as_json
  end
end