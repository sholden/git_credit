var Reflux = require('reflux');

var RepositoryActions = Reflux.createActions([
  'repositoryChanged',
  'objectSelected',
  'treeToggled',
  'blobContentRequested'
]);

module.exports = RepositoryActions;