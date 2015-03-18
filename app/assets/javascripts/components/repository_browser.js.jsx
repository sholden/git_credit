var React = require('react');
var RepositoryActions = require('../actions/repository_actions');

var RepositoryBrowser = React.createClass({
  propTypes: {
    root: React.PropTypes.object
  },

  onNavigationSelect: function(treeNode) {
    console.log("Selected ", treeNode);
    RepositoryActions.nodeSelected(treeNode.target);
  },

  render: function() {
    return (
      <div className="repository-browser">
        <TreeView node={this.props.root} onSelect={this.onNavigationSelect} />
      </div>
    )
  }
});

module.exports = RepositoryBrowser;