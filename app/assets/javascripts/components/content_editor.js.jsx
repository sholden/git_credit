var React = require('react');
var Reflux = require('reflux');
var AceEditor = require('react-ace');
var RepositoryActions = require('../actions/repository_actions');
var BlobContentStore = require('../stores/blob_content_store');

var ContentEditor = React.createClass({
  mixins: [
    Reflux.listenTo(BlobContentStore, 'onBlobContentLoaded')
  ],

  propTypes: {
    repository: React.PropTypes.object.isRequired,
    object: React.PropTypes.object.isRequired
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

module.exports = ContentEditor;