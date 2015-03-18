var $ = require('jquery');
var Reflux = require('reflux');
var RepositoryActions = require('../actions/repository_actions');


var IndexObjectsStore = Reflux.createStore({
  listenables: RepositoryActions,

  onRepositoryChanged: function(repository) {
    if (repository) {
      var self = this;

      $.getJSON('/repositories/' + repository.id + '/objects').then(function(objects) {
        self.trigger(objects);
      });
    }
  }
});

module.exports = IndexObjectsStore;