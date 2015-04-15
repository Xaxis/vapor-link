define([
  'backbone'
], function( Backbone ) {
  return Backbone.Model.extend({
    defaults: function() {
      return {
        peer_id: 0,
        client_id: 0,
        connection: null,
        uri: '',
        dl_id: '',
        name: '',
        type: '',
        size: 0,
        chunks: [],
        chunk_count: 0,
        chunks_recv: 0,
        elm: null,
        keep_alive: null,
        file_url: null,
        complete: false
      };
    }
  });
});
