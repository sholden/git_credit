var React = require('react');
var Reflux = require('reflux');
var _ = require('lodash');

var RepositoryActions = Reflux.createActions([
  'repositoryChanged',
  'nodeSelected',
  'treeToggled'
]);

var expandByDefault = false;

var Analysis = function(data) {
  this.root_oid = data.root_oid;
  this.authors = data.authors;
  this.analyzed_objects = {};
  this.selectedNode = null;

  data.analyzed_objects.forEach(function(object) {
    if (object.type == 'tree') {
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
      return a.type === 'tree' ? -1 : 1;
    } else {
      return a.path.localeCompare(b.path);
    }
  },

  getChildren: function(tree) {
    var parentOid = tree.oid;
    return _.values(this.analyzed_objects)
            .filter(function(object) { return object.parent_oid === parentOid })
            .sort(this.nodeSorter);
  }
});

var AnalysisStore = Reflux.createStore({
  listenables: RepositoryActions,

  onRepositoryChanged: function(repositoryName) {
    var self = this;
    $.getJSON('/analyses/' + repositoryName).then(function(data) {
      window.data = data;
      window.Analysis = Analysis;

      self.currentAnalysis = new Analysis(data);
      self.trigger(self.currentAnalysis);
    });
  },

  onNodeSelected: function(node) {
    console.log("Node selected: " + JSON.stringify(node));

    if (node.type === 'tree') {
      node.expanded = this.currentAnalysis.selectedNode == node ? !node.expanded : true;
    }

    this.currentAnalysis.selectedNode = node;
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

  render: function() {
    return (
      <li className="blob">
        <a href="#" onClick={this.selectHandler}>
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
      console.log("building node for " + JSON.stringify(child));
      if (child.type === 'tree') {
        return <TreeNode key={child.oid} analysis={this.props.analysis} tree={child} />
      } else {
        return <BlobNode key={child.oid} analysis={this.props.analysis} blob={child} />
      }
    }, this);

    return <ul>{childNodes}</ul>
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
      <li className="tree">
        {toggleIcon} <a href={'#' + this.props.tree.path} onClick={this.selectHandler}>{this.props.tree.name}</a>
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
    console.log("Rendering rootChildren: " + JSON.stringify(rootChildren));
    return <TreeChildren analysis={this.props.analysis} children={rootChildren} />
  }
});

var App = React.createClass({
  mixins: [Reflux.listenTo(AnalysisStore, 'onAnalysisChanged')],

  getInitialState: function() {
    return { repositoryName: 'asdf', analysis: null };
  },

  onAnalysisChanged: function(analysis) {
    console.log('app got analysis');
    this.setState({analysis: analysis});
  },

  componentDidMount: function() {
    RepositoryActions.repositoryChanged(this.state.repositoryName);
  },

  render: function() {
    var browser = null;
    if (this.state.analysis) {
      browser = <RepositoryBrowser analysis={this.state.analysis} />
    }

    return (
      <div>
        <h1>Analysis!</h1>
        {browser}
      </div>
    )
  }
});

App.run = function() {
  React.render(<App />, document.getElementById('application'))
};



module.exports = App;