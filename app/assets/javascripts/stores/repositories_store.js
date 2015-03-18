var $ = require('jquery');
var Reflux = require('reflux');

var RepositoriesStore = Reflux.createStore({
  load: function() {
    var self = this;

    $.getJSON('/repositories').then(function(data) {
      self.trigger(data);
    });
  }
});

module.exports = RepositoriesStore;