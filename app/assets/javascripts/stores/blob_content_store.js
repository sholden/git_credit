var $ = require('jquery');
var Reflux = require('reflux');

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