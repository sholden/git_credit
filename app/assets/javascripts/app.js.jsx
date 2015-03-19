var React = require('react');
var Reflux = require('reflux');
var _ = require('lodash');

var RepositoryActions = require('./actions/repository_actions');

var AnalysisStore = require('./stores/analysis_store');
var NavigationNodesStore = require('./stores/navigation_nodes_store');
var RepositoriesStore = require('./stores/repositories_store');

var ContributionStats = require('./components/contribution_stats');
var RepositorySelect = require('./components/repository_select');
var ContentEditor = require('./components/content_editor');
var RepositoryBrowser = require('./components/repository_browser');
var ContentNav = require('./components/content_nav');

var App = React.createClass({
  mixins: [
    Reflux.listenTo(AnalysisStore, 'onAnalysisChanged'),
    Reflux.listenTo(NavigationNodesStore, 'onNavigationLoaded'),
    Reflux.listenTo(RepositoriesStore, 'onRepositoriesLoaded')
  ],

  getInitialState: function() {
    return {repositories: [], selectedRepository: null, selectedContent: 'contributions', analysis: null};
  },

  onAnalysisChanged: function(analysis) {
    //console.log('app got analysis');
    this.setState({analysis: analysis});
  },

  onNavigationLoaded: function(navigationRoot) {
    this.setState({selectedObject: null, navigationRoot: navigationRoot});
  },

  onObjectSelected: function(object) {
    console.log('object selected', object);
    this.setState({selectedObject: object});
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
    if (this.state.analysis && this.state.selectedObject) {
      var contribution_stats = this.state.analysis.getContributionStats(this.state.selectedObject);

      statsComponent = (
        <ContributionStats
          contribution_stats={contribution_stats}
        />
      )
    }

    return statsComponent;
  },

  renderObjectContent: function() {
    return <ContentEditor repository={this.state.selectedRepository} object={this.state.selectedObject} />
  },

  renderContent: function() {
    var selectedContent = this.state.selectedContent;

    var contentPane;
    if (selectedContent === 'contributions') {
      contentPane = this.renderContributorStats();
    } else if (selectedContent === 'content') {
      contentPane = this.renderObjectContent();
    }

    return contentPane;
  },

  renderRepositoryBrowser: function() {
    var browser = null;
    if (this.state.navigationRoot) {
      browser = <RepositoryBrowser root={this.state.navigationRoot} onSelect={this.onObjectSelected} />
    }

    return browser;
  },

  render: function() {
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
            {this.renderRepositoryBrowser()}
          </div>
          <div className="col-md-8">
            {this.renderContent()}
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