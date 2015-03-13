var React = require('react');
var Reflux = require('reflux');
var _ = require('lodash');
var classNames = require('classnames');

var RepositoryActions = Reflux.createActions([
  'repositoryChanged',
  'nodeSelected',
  'treeToggled'
]);

var expandByDefault = false,
    isTree = function(object) { return object.type === 'tree' },
    isBlob = function(object) { return object.type === 'blob' },
    hasContributions = function(object) { return !_.isEmpty(object.contributions) }

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
  getRoot: function() {
    return this.analyzed_objects[this.root_oid];
  },

  nodeSorter: function(a, b) {
    if (a.type != b.type) {
      return isTree(a) ? -1 : 1;
    } else {
      return a.path.localeCompare(b.path);
    }
  },

  getChildren: function(tree) {
    var parentOid = tree.oid;
    return _.values(this.analyzed_objects)
            .filter(function(object) { return object.parent_oid === parentOid })
            .sort(this.nodeSorter);
  },

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

var AnalysisStore = Reflux.createStore({
  listenables: RepositoryActions,

  onRepositoryChanged: function(repositoryId) {
    var self = this;
    $.getJSON('/analyses/' + repositoryId).then(function(data) {
      window.data = data;
      window.Analysis = Analysis;

      self.currentAnalysis = new Analysis(data);
      self.trigger(self.currentAnalysis);
    });
  },

  onNodeSelected: function(node) {
    console.log("Node selected: " + JSON.stringify(node));

    //if (isTree(node)) {
    //  node.expanded = this.currentAnalysis.selectedNode == node ? !node.expanded : true;
    //}

    this.currentAnalysis.selectedNode = node;
    console.log("current set: " + JSON.stringify(this.currentAnalysis.selectedNode));
    this.trigger(this.currentAnalysis);
  },

  onTreeToggled: function(tree) {
    console.log("Tree toggled: " + tree.path);
    tree.expanded = !tree.expanded;
    this.trigger(this.currentAnalysis);
  }
});

var BlobNode = React.createClass({
  propTypes: {
    analysis: React.PropTypes.object,
    blob: React.PropTypes.object
  },

  selectHandler: function(e) {
    e.preventDefault();
    RepositoryActions.nodeSelected(this.props.blob);
  },

  selected: function() {
    return this.props.analysis.selectedNode == this.props.blob
  },

  render: function() {
    return (
      <li className={classNames('node', 'tree', {selected: this.selected()})}>
        <a className="node-name" href="#" onClick={this.selectHandler}>
          <span className="glyphicon glyphicon-file"></span> {this.props.blob.name}
        </a>
      </li>
    )
  }
});

var TreeChildren = React.createClass({
  propTypes: {
    analysis: React.PropTypes.object,
    children: React.PropTypes.array
  },

  render: function() {
    var childNodes = _.map(this.props.children, function(child) {
      //console.log("building node for " + JSON.stringify(child));
      if (isTree(child)) {
        return <TreeNode key={child.oid} analysis={this.props.analysis} tree={child} />
      } else {
        return <BlobNode key={child.oid} analysis={this.props.analysis} blob={child} />
      }
    }, this);

    return <ul className="tree-children">{childNodes}</ul>
  }
});

var TreeNode = React.createClass({
  propTypes: {
    analysis: React.PropTypes.object,
    tree: React.PropTypes.object
  },

  getInitialState: function() {
    return { children: this.props.analysis.getChildren(this.props.tree) }
  },

  selectHandler: function(e) {
    e.preventDefault();
    RepositoryActions.nodeSelected(this.props.tree);
  },

  toggleHandler: function(e) {
    e.preventDefault();
    RepositoryActions.treeToggled(this.props.tree);
  },

  expandable: function() {
    return this.state.children.length > 0
  },

  expanded: function() {
    return this.props.tree.expanded;
  },

  selected: function() {
    return this.props.analysis.selectedNode == this.props.tree
  },

  render: function() {
    var toggleIcon, treeChildren;

    if (this.expandable()) {
      var toggleIconName = this.expanded() ? 'folder-open' : 'folder-close';
      toggleIcon = <a href="#" onClick={this.toggleHandler}><span className={'glyphicon glyphicon-' + toggleIconName}></span></a>

      if (this.expanded()) {
        treeChildren = <TreeChildren analysis={this.props.analysis} children={this.state.children} />
      }
    }

    return (
      <li className={classNames('node', 'tree', {selected: this.selected()})}>
        {toggleIcon} <a href={'#' + this.props.tree.path} className="node-name" onClick={this.selectHandler}>{this.props.tree.name}</a>
        {treeChildren}
      </li>
    )
  }
});

var RepositoryBrowser = React.createClass({
  propTypes: {
    analysis: React.PropTypes.object
  },

  render: function() {
    var root = this.props.analysis.getRoot();
    var rootChildren = this.props.analysis.getChildren(root);
    //console.log("Rendering rootChildren: " + JSON.stringify(rootChildren));
    return (
      <div className="repository-browser">
        <TreeChildren analysis={this.props.analysis} children={rootChildren} />
      </div>
    )
  }
});

var ContributionStat = React.createClass({
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
    analysis: React.PropTypes.object,
    object: React.PropTypes.object,
    contribution_stats: React.PropTypes.array
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
        <h2>Contributions</h2>
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

var App = React.createClass({
  mixins: [Reflux.listenTo(AnalysisStore, 'onAnalysisChanged')],

  getInitialState: function() {
    return { repositoryId: '1', analysis: null };
  },

  onAnalysisChanged: function(analysis) {
    //console.log('app got analysis');
    this.setState({analysis: analysis});
  },

  componentDidMount: function() {
    RepositoryActions.repositoryChanged(this.state.repositoryId);
  },

  render: function() {
    var browser = null;
    if (this.state.analysis) {
      browser = (
        <div className="col-md-4">
          <RepositoryBrowser analysis={this.state.analysis} />
        </div>
      )
    }

    var nodePane;
    if (this.state.analysis && this.state.analysis.selectedNode) {
      var contribution_stats = this.state.analysis.getContributionStats(this.state.analysis.selectedNode);
      nodePane = (
        <div className="col-md-8">
          <ContributionStats analysis={this.state.analysis} object={this.state.analysis.selectedNode} contribution_stats={contribution_stats} />
        </div>
      )
    }

    return (
      <div className="app">
        <h1>Git Credit!</h1>
        <div className="row">
          {browser}
          {nodePane}
        </div>

      </div>
    )
  }
});

App.run = function() {
  React.render(<App />, document.getElementById('application'))
};



module.exports = App;