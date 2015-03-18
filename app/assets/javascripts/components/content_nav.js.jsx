var React = require('react');
var Bootstrap = require('react-bootstrap');
var Nav = Bootstrap.Nav;
var NavItem = Bootstrap.NavItem;

var ContentNav = React.createClass({
  propTypes: {
    selectedContent: React.PropTypes.string,
    onSelect: React.PropTypes.func
  },

  render: function() {
    return (
      <Nav bsStyle="tabs" justified activeKey={this.props.selectedContent} onSelect={this.props.onSelect}>
        <NavItem eventKey="contributions" title="Contributions">Contributions</NavItem>
        <NavItem eventKey="content" title="Content">Content</NavItem>
      </Nav>
    )
  }
});

module.exports = ContentNav;