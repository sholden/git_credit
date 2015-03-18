var Reflux = require('reflux');

var RepositoryActions = Reflux.createActions([
  'repositoryChanged',
  'nodeSelected',
  'treeToggled',
  'blobContentRequested'
]);

module.exports = RepositoryActions;