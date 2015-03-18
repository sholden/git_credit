var _ = require('lodash');
var React = require('react');

var RepositorySelect = React.createClass({
  propTypes: {
    repositories: React.PropTypes.array,
    selectedRepository: React.PropTypes.object,
    onChange: React.PropTypes.func
  },

  render: function() {
    if (_.isEmpty(this.props.repositories)) {
      return <p>Loading repositories...</p>
    } else {
      var options = _.map(this.props.repositories, function(repo) {
        return <option key={repo.id} value={repo.id}>{repo.name}</option>
      });

      return (
        <Input type="select" value={this.props.selectedRepository}>
          {options}
        </Input>
      )
    }
  }
});

module.exports = RepositorySelect;