var _ = require('lodash');
var React = require('react');
var TreeNode = require('./tree_node');

var TreeView = React.createClass({
  propTypes: {
    node: React.PropTypes.object.isRequired,
    showRoot: React.PropTypes.bool,
    onSelect: React.PropTypes.func
  },

  getInitialState: function() {
    return { selectedTreeNode: null };
  },

  _onTreeNodeSelect: function(treeNode) {
    if (this.state.selectedTreeNode) {
      this.state.selectedTreeNode.setState({selected: false});
    }

    treeNode.setState({selected: true});
    this.setState({selectedTreeNode: treeNode});

    if (this.props.onSelect) {
      this.props.onSelect(treeNode.props.node);
    }
  },

  _onTreeNodeExpandToggle: function(treeNode) {
    treeNode.setState({expanded: true});
  },

  render: function() {
    var rootNodes = this.props.showRoot ? [this.props.node] : this.props.node.children;
    var treeNodes = _.map(rootNodes, function(node) {
      return (
        <TreeNode
          node={node}
          onSelect={this._onTreeNodeSelect}
          onExpandToggle={this._onTreeNodeExpandToggle}
        />
      )
    }, this);

    return (
      <ul className="tree-children" >
      {treeNodes}
      </ul>
    )
  }
});

module.exports = TreeView;