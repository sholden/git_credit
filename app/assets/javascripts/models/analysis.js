var _ = require('lodash');

var expandByDefault = false,
  isTree = function(object) { return object && object.type === 'tree' },
  isBlob = function(object) { return object && object.type === 'blob' },
  hasContributions = function(object) { return object && !_.isEmpty(object.contributions) }

var Analysis = function(data) {
  this.root_oid = data.root_oid;
  this.authors = data.authors;
  this.analyzed_objects = {};
  this.selectedNode = null;

  data.analyzed_objects.forEach(function(object) {
    if (isTree(object)) {
      object.expanded = expandByDefault;
    }

    this.analyzed_objects[object.oid] = object;
  }, this);
};

Object.assign(Analysis.prototype, {
  getDescendants: function(object, descendants) {
    if (!descendants) {
      descendants = []
    }

    _.forEach(this.getChildren(object), function(child) {
      descendants.push(child);

      if (isTree(child)) {
        this.getDescendants(child, descendants);
      }
    }, this);

    return descendants;
  },

  getContributionStats: function(object) {
    var blobObjects = isBlob(object) ? [object] : this.getDescendants(object).filter(hasContributions);

    authorIdStats = {};
    _.forEach(blobObjects, function(blob) {
      _.forOwn(blob.contributions, function(value, key) {
        if (!_.has(authorIdStats, key)) {
          authorIdStats[key] = 0;
        }
        authorIdStats[key] += value;
      });
    });

    contributionStats = [];
    _.forOwn(authorIdStats, function(value, key) {
      var stat = {lines: value, id: key};
      _.assign(stat, this.authors[key]);
      contributionStats.push(stat);
    }, this);

    var linesDescending = function(a, b) { return b.lines - a.lines };
    contributionStats = contributionStats.sort(linesDescending);
    console.log(contributionStats);
    return contributionStats;
  }
});

module.exports = Analysis;
