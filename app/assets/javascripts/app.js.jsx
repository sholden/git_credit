var React = require('react');
var Reflux = require('reflux');
var _ = require('lodash');
var classNames = require('classnames');
var AceEditor = require('react-ace');
var Bootstrap = require('react-bootstrap');
var Nav = Bootstrap.Nav;
var NavItem = Bootstrap.NavItem;
var Input = Bootstrap.Input;
var path = require('path');

var RepositoryActions = Reflux.createActions([
  'repositoryChanged',
  'nodeSelected',
  'treeToggled',
  'blobContentRequested'
]);

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

var RepositoriesStore = Reflux.createStore({
  load: function() {
    var self = this;

    $.getJSON('/repositories').then(function(data) {
      self.trigger(data);
    });
  }
});

var IndexObjectsStore = Reflux.createStore({
  listenables: RepositoryActions,

  onRepositoryChanged: function(repository) {
    if (repository) {
      var self = this;

      $.getJSON('/repositories/' + repository.id + '/objects').then(function(objects) {
        self.trigger(objects);
      });
    }
  }
});

var nodeSorter = function(a, b) {
  var aIsLeaf = _.isEmpty(a.children),
      bIsLeaf = _.isEmpty(b.children);
  if (aIsLeaf != bIsLeaf) {
    return aIsLeaf ? 1 : -1;
  } else {
    return a.name.localeCompare(b.name);
  }
}

var NavigationNodesStore = Reflux.createStore({
  listenables: {indexObjectChange: IndexObjectsStore},

  indexObjectChange: function(indexObjects) {
    var gitObjects = {};

    _.each(indexObjects, function(object) {
      gitObjects[object.path] = _.assign(object, {type: 'blob', name: path.basename(object.path)});

      var dirname = path.dirname(object.path);
      if (!_.has(gitObjects, dirname)) {
        gitObjects[dirname] = {type: 'tree', path: dirname, name: path.basename(dirname)};
      }
    });

    var buildNode = function(node) {
      return {
        id: node.path,
        name: node.name,
        target: node,
        children: _.map(getChildNodes(gitObjects, node), buildNode).sort(nodeSorter)
      }
    };

    var rootNode = buildNode(gitObjects['.']);
    this.trigger(rootNode);
  }
});

var getRootNode = function(navigationNodes) {
  return navigationNodes[''];
};

var getChildNodes = function(navigationNodes, parent) {
  return _.filter(_.values(navigationNodes), function(node) {
    return node != parent && parent.path === path.dirname(node.path);
  });
};

var AnalysisStore = Reflux.createStore({
  listenables: RepositoryActions,

  onRepositoryChanged: function(repository) {
    var self = this;

    if (repository) {
      $.getJSON('/analyses/' + repository.id).then(function(data) {
        self.currentAnalysis = new Analysis(data);
        self.trigger(self.currentAnalysis);
      });
    } else {
      this.trigger(null);
    }

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

var BlobContentStore = Reflux.createStore({
  listenables: RepositoryActions,

  onBlobContentRequested: function(repository, blob) {
    if (!isBlob(blob)) return;

    var self = this;
    $.get('/repositories/' + repository.id + '/blobs/' + blob.oid).then(function(resp) {
      self.trigger(resp);
    });
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

var TreeNode2 = React.createClass({
  propTypes: {
    node: React.PropTypes.object,
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
        <TreeNode2
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

var TreeView = React.createClass({
  propTypes: {
    nodeType: React.PropTypes.object,
    node: React.PropTypes.object,
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
        <TreeNode2
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

var RepositoryBrowser2 = React.createClass({
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

var ContentEditor = React.createClass({
  mixins: [
    Reflux.listenTo(BlobContentStore, 'onBlobContentLoaded')
  ],

  propTypes: {
    repository: React.PropTypes.object,
    object: React.PropTypes.object
  },

  getInitialState: function() {
    return {content: null};
  },

  componentDidMount: function() {
    RepositoryActions.blobContentRequested(this.props.repository, this.props.object);
  },

  onBlobContentLoaded: function(content) {
    this.setState({content: content});
  },

  render: function() {
    if (!this.state.content) { return <p>No content</p> }

    return <AceEditor
      mode="java"
      theme="github"
      name={'ACE_' + this.props.object.oid}
      value={this.state.content}
    />
  }
});

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

var App = React.createClass({
  mixins: [
    Reflux.listenTo(AnalysisStore, 'onAnalysisChanged'),
    Reflux.listenTo(NavigationNodesStore, 'onNavigationChanged'),
    Reflux.listenTo(RepositoriesStore, 'onRepositoriesLoaded')
  ],

  getInitialState: function() {
    return {repositories: [], selectedRepository: null, selectedContent: 'contributions', analysis: null};
  },

  onAnalysisChanged: function(analysis) {
    //console.log('app got analysis');
    this.setState({analysis: analysis});
  },

  onNavigationChanged: function(navigationRoot) {
    this.setState({navigationRoot: navigationRoot});
  },

  onContentSelected: function(selectedContent) {
    console.log("Content selected: " + selectedContent);
    this.setState({selectedContent: selectedContent});
  },

  onRepositoriesLoaded: function(repositories) {
    console.log("Repositories loaded:", repositories);
    var selectedRepository = null;
    if (this.state.selectedRepository && _.some(repositories, {id: this.state.selectedRepository.id})) {
      selectedRepository = this.state.selectedRepository;
    } else {
      selectedRepository = _.first(repositories);
    }

    console.log("Repo after load: ", selectedRepository);
    this.setState({repositories: repositories});

    if (this.state.selectedRepository != selectedRepository) {
      this.onRepositorySelected(selectedRepository);
    }
  },

  onRepositorySelected: function(selectedRepository) {
    console.log("RepositorySelected: " + selectedRepository);
    this.setState({selectedRepository: selectedRepository});
    RepositoryActions.repositoryChanged(selectedRepository);
  },

  componentDidMount: function() {
    RepositoriesStore.load();
  },

  renderContributorStats: function() {
    var statsComponent;
    if (this.state.analysis && this.state.analysis.selectedNode) {
      var contribution_stats = this.state.analysis.getContributionStats(this.state.analysis.selectedNode);

      statsComponent = (
        <ContributionStats
          analysis={this.state.analysis}
          object={this.state.analysis.selectedNode}
          contribution_stats={contribution_stats}
        />
      )
    }

    return statsComponent;
  },

  renderObjectContent: function() {
    return <ContentEditor repository={this.state.selectedRepository} object={this.state.analysis.selectedNode} />
  },

  render: function() {
    var browser = null;
    if (this.state.analysis) {
      browser = <RepositoryBrowser2 root={this.state.navigationRoot} />
    }

    var selectedContent = this.state.selectedContent;
    var contentPane;
    if (selectedContent === 'contributions') {
      contentPane = this.renderContributorStats();
    } else if (selectedContent === 'content') {
      contentPane = this.renderObjectContent();
    }

    return (
      <div className="app">
        <h1>Git Credit!</h1>
        <div className="row">
          <div className="col-md-4">
            <RepositorySelect repositories={this.state.repositories} onChange={this.onRepositorySelected} />
          </div>
          <div className="col-md-8">
            <ContentNav selectedContent={this.state.selectedContent} onSelect={this.onContentSelected} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            {browser}
          </div>
          <div className="col-md-8">
            {contentPane}
          </div>
        </div>
      </div>
    )
  }
});

App.run = function() {
  React.render(<App />, document.getElementById('application'))
};



module.exports = App;