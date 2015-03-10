define([
  'backbone',
  '../models/handleDownloads'
], function( Backbone, HandleDownloadsModel ) {
  return Backbone.Collection.extend({
    model: HandleDownloadsModel
  });
});
