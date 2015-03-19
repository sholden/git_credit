var React = require('react');
var Reflux = require('reflux');
var AceEditor = require('./better_ace_editor');
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

  onBlobContentLoaded: function(content) {
    this.setState({content: content, contentFor: this.props.object});
  },

  isContentLoaded: function() {
    return this.state.content && this.state.contentFor == this.props.object;
  },

  render: function() {
    if (!this.isContentLoaded()) {
      RepositoryActions.blobContentRequested(this.props.repository, this.props.object);
      return <p>No content</p>
    }

    var language = this.state.contentFor.language;

    return <AceEditor
      mode={language && language.ace_mode || 'plain_text'}
      theme="github"
      name={"ace_" + this.state.contentFor}
      value={this.state.content}
      readOnly={true}
      width="100%"
    />
  }
});

module.exports = ContentEditor;