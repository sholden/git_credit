var _ = require('lodash');
var Reflux = require('reflux');
var IndexObjectsStore = require('./index_objects_store');
var path = require('path');

var nodeSorter = function(a, b) {
  var aIsLeaf = _.isEmpty(a.children),
    bIsLeaf = _.isEmpty(b.children);
  if (aIsLeaf != bIsLeaf) {
    return aIsLeaf ? 1 : -1;
  } else {
    return a.name.localeCompare(b.name);
  }
};

var getChildNodes = function(navigationNodes, parent) {
  return _.filter(_.values(navigationNodes), function(node) {
    return node != parent && parent.path === path.dirname(node.path);
  });
};

var NavigationNodesStore = Reflux.createStore({
  listenables: {indexObjectChange: IndexObjectsStore},

  indexObjectChange: function(indexObjects) {
    var gitObjects = {};

    _.each(indexObjects, function(object) {
      gitObjects[object.path] = _.assign(object, {type: 'blob', name: path.basename(object.path)});

      var dirname = path.dirname(object.path);
      if (!_.has(gitObjects, dirname)) {
        gitObjects[dirname] = {type: 'tree', path: dirname, name: path.basename(dirname)};
      }
    });

    var buildNode = function(node) {
      return {
        id: node.path,
        name: node.name,
        target: node,
        children: _.map(getChildNodes(gitObjects, node), buildNode).sort(nodeSorter)
      }
    };

    var rootNode = buildNode(gitObjects['.']);
    this.trigger(rootNode);
  }
});

module.exports = NavigationNodesStore;