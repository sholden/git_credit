var _ = require('lodash');
var React = require('react');

var ContributionStat = React.createClass({
  propTypes: {
    contribution: React.PropTypes.object.isRequired
  },

  render: function() {
    var percent = this.props.contribution.lines / this.props.total_lines;

    return (
      <tr>
        <td>{this.props.contribution.name}</td>
        <td>{this.props.contribution.email}</td>
        <td>{this.props.contribution.lines}</td>
        <td>{percent}</td>
      </tr>
    )
  }
});

var ContributionStats = React.createClass({
  propTypes: {
    analysis: React.PropTypes.object.isRequired,
    object: React.PropTypes.object.isRequired,
    contribution_stats: React.PropTypes.array.isRequired
  },

  render: function() {
    var totalLines = _.reduce(this.props.contribution_stats,
      function(sum, n) { return sum + n.lines },
      0);

    var stats = _.map(this.props.contribution_stats, function(cs) {
      return <ContributionStat contribution={cs} total_lines={totalLines} />
    }, this);

    return (
      <div className="contribution-stats">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>LoC</th>
              <th>% Code</th>
            </tr>
          </thead>
          <tbody>
            {stats}
          </tbody>
        </table>
      </div>
    )
  }
});