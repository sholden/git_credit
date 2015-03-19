var _ = require('lodash');
var React = require('react');
var classNames = require('classnames');

var expandByDefault = false;

var TreeNode = React.createClass({
  propTypes: {
    node: React.PropTypes.object.isRequired,
    onSelect: React.PropTypes.func,
    onExpandToggle: React.PropTypes.func
  },

  getInitialState: function() {
    return {expanded: !this.isLeaf() && expandByDefault, selected: false}
  },

  getChildren: function() {
    return this.props.node.children;
  },

  isLeaf: function() {
    return _.isEmpty(this.getChildren());
  },

  isExpanded: function() {
    return this.state.expanded;
  },

  getKey: function(node) {
    return node.path;
  },

  _onExpandToggleClick: function(e) {
    this.setState({expanded: !this.state.expanded});

    e.preventDefault();
    e.stopPropagation();
  },

  _onSelectClick: function(e) {
    if (this.props.onSelect) {
      this.props.onSelect(this);
    }

    e.preventDefault();
    e.stopPropagation();
  },

  renderToggle: function() {
    if (this.isLeaf()) return null;

    var toggleIconName = this.isExpanded() ? 'folder-open' : 'folder-close';
    return <a href="#" onClick={this._onExpandToggleClick}><span className={'glyphicon glyphicon-' + toggleIconName}></span></a>
  },

  renderLabel: function() {
    return  <a href={'#' + this.props.node.path} className="node-name" onClick={this._onSelectClick}>{this.props.node.name}</a>
  },

  renderChildren: function() {
    var childNodes = _.map(this.getChildren(), function(child) {
      return (
        <TreeNode
          key={this.getKey(child)}
          node={child}
          onExpandToggle={this.props.onExpandToggle}
          onSelect={this.props.onSelect} />
      )
    }, this);

    return <ul className={classNames("tree-children", {hidden: !this.isExpanded()})}>{childNodes}</ul>;
  },

  render: function() {
    return (
      <li className={classNames('node', 'tree', {selected: this.state.selected})}>
        {this.renderToggle()} {this.renderLabel()}
        {this.renderChildren()}
      </li>
    )
  }
});

module.exports = TreeNode;
