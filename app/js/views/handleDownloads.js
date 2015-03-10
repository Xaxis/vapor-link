define([
  'jquery',
  'underscore',
  'backbone',
  '../collections/handleDownloads',
  'text!../../templates/handleDownloads.html',
  'file',
  'p2ps',
  'p2pc'
], function(
  $,
  _,
  Backbone,
  HandleDownloadsCollection,
  HandleDownloadsTpl,
  File,
  P2PS,
  P2PC
) {
  var HandleDownloadsView = Backbone.View.extend({
    el: $('body'),

    template: _.template(HandleDownloadsTpl),

    events: {
      'click .download-col .download': 'handleDownloadClick',
      'click .download-col .cancel': 'handleDownloadCancel'
    },

    connections: {},

    initialize: function () {

      // Bind handlers
      _.bindAll(this,
        'addDownload',
        'handleDownloadClick',
        'handleDownloadCancel'
      );

      // Initialize new downloads collection
      this.collection = new HandleDownloadsCollection();
    },

    addDownload: function( options ) {
      var _this = this;

      // Add download to collection
      this.collection.add({
        peer_id: options.id,
        cid: options.cid,
        uri: options.uri,
        name: decodeURIComponent(options.name),
        size: '--'
      });

      // Update model with element reference
      var last_model = this.collection.models[this.collection.models.length-1];
      last_model.set({ elm: this.template(last_model.attributes) });

      // Render downloading files
      _.each(this.collection.models, function(model) {
        $('#downloads').append(model.get('elm'));
      });

      // Create a new download request
      var peer_id = last_model.get('peer_id');
      var client_id = window.vdrive.client_id;
      var peerDownloadConnection =
        this.connections[peer_id] =
          this.connections[peer_id] ||
          new P2PC(peer_id, {
            signal: new P2PS({socket: window.vdrive.socket}),
            debug: false
          });

      // Create responding listening channel
      peerDownloadConnection.newListeningChannel({
        channel_id: 'peerDownloadConnection',
        onDataChannelReady: function(c) {
          console.log('dc ready');
        }
      });

      // Request download from peer
      peerDownloadConnection.openListeningChannel({
        client_id: client_id,
        channel_id: 'peerDownloadConnection',
        connection_id: peer_id,
        onDataChannelOpen: function(c) {

          // Request file from peer
          c.channel.send(JSON.stringify({
            cid: last_model.get('cid')
          }));
        },
        onDataChannelMessage: function(c) {
          var data = c.data;

          // Handle file meta message
          if (typeof data == 'string') {
            var meta = JSON.parse(c.data);

            // Update model with meta
            last_model.set({
              type: meta.type,
              size: meta.size,
              chunk_count: meta.chunk_count
            });
          }

          // Handle file chunks
          else {
            var
              cid           = last_model.get('cid'),
              elm           = $('[data-cid="' + cid + '"]'),
              size          = last_model.get('size'),
              chunk         = c.data,
              chunks        = last_model.get('chunks'),
              chunk_count   = last_model.get('chunk_count'),
              chunks_recv   = last_model.get('chunks_recv') + 1;

            // Save received chunks
            chunks.push(chunk);
            last_model.set({
              chunks: chunks,
              chunks_recv: chunks.length
            });
          }

          // Update progress bar
          _this.updateDownloadProgress({
            elm: elm,
            chunk_count: chunk_count,
            chunks_recv: chunks_recv,
            size: size
          });

          // Handle chanel keep alive messaging
          if (!last_model.get('keep_alive')) {
            var kaInterval = setInterval(function() {

              console.log('keep alive message sending...');

              // Send keep alive message
              c.channel.send(JSON.stringify({
                'keep-alive': true
              }));
            }, 5000);

            // Set the model's keep alive interval
            last_model.set('keep_alive', kaInterval);
          }

          // Handle download completion
          if (chunk_count == chunks_recv) {
            _this.handleDownloadCompletion({
              elm: elm,
              model: last_model
            });
          }
        },
        onDataChannelClose: function(c) {
          console.log('dc close');
        },
        onDataChannelError: function(c) {
          console.log('dc error');
        }
      });

    },

    updateDownloadProgress: function( options ) {
      var percentage = Math.ceil((options.chunks_recv / options.chunk_count) * 100);
      if (options.elm) {
        options.elm.find('.progress-bar').css({width: percentage + '%'});
        options.elm.find('.size').html(File.printFileSize(options.size));
      }
    },

    handleDownloadCompletion: function( options ) {
      var
        chunks      = options.model.get('chunks'),
        file_type   = options.model.get('type'),
        file_blob   = new Blob(chunks, {type: file_type}),
        file_url    = URL.createObjectURL(file_blob),
        file_name   = options.model.get('name');

      // Build object url
      options.elm.find('.download a').attr({
        href: file_url,
        target: '_blank',
        download: file_name
      });

      // Toggle cancel/download controls
      options.elm.find('.cancel').removeClass('active');
      options.elm.find('.download').addClass('active');

      // Clear keep alive message
      clearInterval(options.model.get('keep_alive'));
    },

    handleDownloadClick: function(e) {
      console.log('happening');
    },

    handleDownloadCancel: function(e) {
      console.log('happening');
    }
  });

  return new HandleDownloadsView();
});
