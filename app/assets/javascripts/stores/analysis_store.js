var Reflux = require('reflux');
var $ = require('jquery');

var Analysis = require('../models/analysis');

var AnalysisStore = Reflux.createStore({
  listenables: RepositoryActions,

  onRepositoryChanged: function(repository) {
    var self = this;

    if (repository) {
      $.getJSON('/analyses/' + repository.id).then(function(data) {
        self.currentAnalysis = new Analysis(data);
        self.trigger(self.currentAnalysis);
      });
    } else {
      this.trigger(null);
    }

  }
});

module.exports = AnalysisStore;