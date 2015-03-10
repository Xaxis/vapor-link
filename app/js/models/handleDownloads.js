define([
  'backbone'
], function( Backbone ) {
  return Backbone.Model.extend({
    defaults: {
      peer_id: 0,
      uri: '',
      cid: '',
      name: '',
      type: '',
      size: 0,
      chunks: [],
      chunk_count: 0,
      chunks_recv: 0,
      elm: null,
      keep_alive: null
    }
  });
});
