var React = require('react');
var RepositoryActions = require('../actions/repository_actions');

var TreeView = require('./tree_view');

var RepositoryBrowser = React.createClass({
  propTypes: {
    root: React.PropTypes.object,
    onSelect: React.PropTypes.func
  },

  onNavigationSelect: function(treeNode) {
    console.log("Selected ", treeNode);
    this.props.onSelect && this.props.onSelect(treeNode.target);
  },

  render: function() {
    var treeView = this.props.root && <TreeView node={this.props.root} onSelect={this.onNavigationSelect} />;

    return (
      <div className="repository-browser">
      {treeView}
      </div>
    )
  }
});

module.exports = RepositoryBrowser;