define([
  'backbone',
  '../models/handleFiles'
], function( Backbone, HandleFilesModel ) {
  var HandleFilesCollection = Backbone.Collection.extend({
    model: HandleFilesModel
  });

  return HandleFilesCollection;
});
