var $ = require('jquery');
var Reflux = require('reflux');

var RepositoryActions = require('../actions/repository_actions');

var isBlob = function(object) {
  return object.type == 'blob';
};

var BlobContentStore = Reflux.createStore({
  listenables: RepositoryActions,

  onBlobContentRequested: function(repository, blob) {
    if (!isBlob(blob)) return;

    var self = this;
    $.get('/repositories/' + repository.id + '/blobs/' + blob.oid).then(function(resp) {
      self.trigger(resp);
    });
  }
});

module.exports = BlobContentStore;