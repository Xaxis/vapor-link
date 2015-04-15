define([
  'backbone'
], function( Backbone ) {
  var HandleFilesModel = Backbone.Model.extend({
    defaults: function() {
      return {
        id: 0,
        elm: null,
        file:  null,
        name: 'File Name',
        size: 'File Size',
        date: 'File Date',
        selected: false,
        uri: null,
        peers: {}
      };
    }
  });

  return HandleFilesModel;
});
