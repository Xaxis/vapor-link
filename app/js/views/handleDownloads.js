define([
  'jquery',
  'underscore',
  'backbone',
  '../collections/handleDownloads',
  'text!../../templates/handleDownloads.html',
  'text!../../templates/messageBox.html',
  'file',
  'p2ps',
  'p2pc',
  'ui'
], function(
  $,
  _,
  Backbone,
  HandleDownloadsCollection,
  HandleDownloadsTpl,
  MessageBoxTpl,
  File,
  P2PS,
  P2PC,
  UI
) {
  var HandleDownloadsView = Backbone.View.extend({
    el: $('body'),

    template: _.template(HandleDownloadsTpl),

    message_box_tpl: _.template(MessageBoxTpl),

    events: {
      'keyup #download-link-input': 'handleDownloadLinkInput',
      'paste #download-link-input': 'handleDownloadLinkInput',
      'click #download-link-button': 'handleDownloadButton',
      'click #downloads-zone .check-link': 'toggleCheckedDownload',
      'click li .cancel': 'cancelDownload',
      'click li .refresh': 'refreshDownload',
      'click #downloads-zone .stats-container:not(.active)': 'toggleStatsMenu',
      'click #downloads-zone .option.toggle': 'toggleStatsMenuButton',
      'click #downloads-zone #remove-files': 'removeSelectedFiles'
    },

    initialize: function () {

      // Bind handlers
      _.bindAll(this,
        'addDownload',
        'renderDownloads',
        'handleDownloadLinkInput',
        'handleDownloadButton',
        'toggleCheckedDownload',
        'cancelDownload',
        'refreshDownload',
        'toggleStatsMenu',
        'toggleStatsMenuButton',
        'removeSelectedFiles'
      );

      // Initialize new downloads collection
      this.collection = new HandleDownloadsCollection();
    },

    /*
     * Select/deselect files
     */
    toggleCheckedDownload: function(e) {
      e.stopPropagation();
      var
        elm     = $(e.target),
        parent  = elm.closest('[data-cid]'),
        id      = parent.attr('data-cid'),
        model   = this.collection.where({dl_id: id})[0],
        state   = model.get('selected') ? false : true;

      // Set model 'selected' state
      model.set({selected: state});

      // Update view
      elm.toggleClass('selected');
      parent.toggleClass('selected');

      // Enable/disable 'Remove Files' control
      var selected_files = this.collection.where({selected: true});
      if (selected_files.length) {
        $('#remove-files').removeClass('frozen');
      } else {
        $('#remove-files').addClass('frozen');
      }
    },

    /*
     * HANDLE - Cancel a download
     */
    cancelDownload: function(e) {
      var
        target    = $(e.target),
        dl_id     = target.closest('li').attr('data-cid'),
        model     = this.collection.where({dl_id: dl_id})[0],
        elm       = model.attributes.elm,
        meta      = elm.data('meta');

      // Close the data channel
      meta.channel.close();

      // Update status data
      model.set('status', 'canceled');
      elm.find('.stats-container .status .data').html(model.get('status'));

      // Toggle cancel/download controls
      elm.find('.cancel').removeClass('active');
      elm.find('.refresh').addClass('active');
    },

    /*
     * HANDLE - Re-requesting of download
     */
    refreshDownload: function(e) {
      var
        _this     = this,
        target    = $(e.target),
        dl_id     = target.closest('li').attr('data-cid'),
        model     = this.collection.where({dl_id: dl_id})[0],
        elm       = model.attributes.elm,
        meta      = elm.data('meta');

      // Remove element and model from collection
      $('.message-box').remove();
      elm.animate({opacity: 0}, {duration: 300, complete: function() {

        // Remove element and model
        elm.remove();
        _this.collection.remove(model);

        // Load page with resource url fragment
        Backbone.history.loadUrl(meta.frag);
      }});
    },

    /*
     * HANDLE - Hide/show download stats menu
     */
    toggleStatsMenu: function(e) {
      var
        target      = $(e.target).hasClass('stats-container') ? $(e.target) : $(e.target).closest('.stats-container');

      // Toggle menu open/closed
      target.toggleClass('active');
    },

    /*
     * HANDLE - Hide/show download stats menu (button control)
     */
    toggleStatsMenuButton: function(e) {
      var
        target      = $(e.target),
        stats       = target.closest('.download-wrapper').next('.stats-container');

      // Adjust button toggle state
      target.toggleClass('open');
      target.toggleClass('close');

      // Toggle menu open/closed
      stats.toggleClass('active');
    },

    /*
     * HANDLE - Remove downloads control
     */
    removeSelectedFiles: function(e) {
      var
        _this       = this,
        target      = $(e.target);
      if (!target.hasClass('frozen')) {
        var
          selected_files    = this.collection.where({selected: true});

        // Iterate over file models
        _.each(selected_files, function(model) {
          var
            elm     = $(model.get('elm')),
            meta    = elm.data('meta');

          // Close download channel
          meta.channel.close();

          // Remove file element
          $(model.attributes.elm).remove();

          // Remove model from collection
          _this.collection.remove(model);
        });

        // Re-freeze button styling
        target.addClass('frozen');
      }
    },

    /*
     * HANDLE - Keystrokes/paste in the #download-link-input
     */
    handleDownloadLinkInput: function(e) {
      if ($(e.target).val() || e.type == 'paste') {
        $('#download-link-button').removeClass('frozen');
      } else {
        $('#download-link-button').addClass('frozen');
      }
    },

    /*
     * HANDLE - Click on #download-link-button
     */
    handleDownloadButton: function() {
      if (!$('#download-link-button').hasClass('frozen')) {
        window.location = $('#download-link-input').val();
      }
    },

    /*
     * Initializes a new download from a peer
     */
    addDownload: function( options ) {
      var
        _this       = this;


      // Iterate over possible downloads
      _.each(options.cid, function( id ) {
        var
          cid             = 'c' + id,
          model           = _this.collection.findWhere({dl_id: cid}),
          file_name       = !options.name ? '{UNKNOWN_FILE}' : decodeURIComponent(options.name);

        console.log('requesting download', cid);

        // Create new download model if it doesn't already exist
        if (!model) {

          // Search for an existing connection with same peer
          var connection_model = _this.collection.findWhere({peer_id: options.id});

          // Add download model to collection
          _this.collection.add({

            // The cid of the model at the remote host
            cid: cid,

            // For reference clarity, a download id (which is the cid of the model at the remote host)
            dl_id: cid,

            // Requested route participle
            uri: options.uri,

            // File's decoded name
            name: file_name,

            // File size placeholder
            size: '--',

            // Socket id of the remote host
            peer_id: options.id,

            // Local socket id
            client_id: window.vdrive.client_id,

            // The uri fragment of the resource (uri after the hash)
            frag: options.uri + '/' + options.id + '/' + cid + '/' + file_name,

            // A flag indicating if the element has been selected through the UI
            selected: false,

            // The Peer2Peer connection object
            connection: connection_model ? connection_model.get('connection') : new P2PC(options.id, {
              signal: new P2PS({socket: window.vdrive.socket}),
              debug: false
            }),

            // A status string
            status: 'downloading',

            // The source id of the peer
            source: options.id,

            // The vlink for the download
            vlink: window.location.origin + '/' + 'app/' + options.uri + '/' + options.id + '/' + cid + '/' + file_name
          });

          // Reference the newly created model
          model = _this.collection.findWhere({dl_id: cid});

          // Update model with element html
          model.set({ elm: _this.template(model.attributes) });

          // Create responding listening channel
          model.get('connection').newListeningChannel({
            channel_id: 'peerDownloadConnection',
            onDataChannelReady: function(c) {}
          });

          // Request download from peer
          model.get('connection').openListeningChannel({
            client_id: model.get('client_id'),
            channel_id: 'peerDownloadConnection',
            connection_id: model.get('peer_id'),
            onDataChannelOpen: function(c) {

              // Request file from peer
              c.channel.send(JSON.stringify({
                cid: model.get('dl_id')
              }));
            },
            onDataChannelMessage: function(c) {
              var
                data          = c.data;

              // Handle peer messaging
              if (typeof data == 'string') {
                var message = JSON.parse(c.data);

                // Update model and element with meta data
                if (message.message == 'meta') {

                  // Model
                  model.set({
                    type: message.type,
                    size: message.size,
                    name: message.name,
                    vlink: window.location.origin + '/' + 'app/' + options.uri + '/' + options.id + '/' + cid + '/' + message.name,
                    chunk_count: message.chunk_count
                  });

                  // Element
                  $(model.get('elm')).data('meta', {
                    type: message.type,
                    size: message.size,
                    chunk_count: message.chunk_count,
                    channel: c.channel,
                    name: model.get('name'),
                    frag: model.get('frag'),
                    vlink: model.get('vlink')
                  });
                }

                // Mark file as no longer available
                else if (message.message == 'no-file') {
                  $(model.get('elm')).addClass('unavailable');
                }
              }

              // Handle file chunks
              else {
                var
                  cid           = model.get('dl_id'),
                  elm           = $('[data-cid="' + cid + '"]'),
                  size          = model.get('size'),
                  chunk         = c.data,
                  chunks        = model.get('chunks'),
                  chunk_count   = model.get('chunk_count');

                // Save received chunks
                chunks.push(chunk);
                model.set({
                  elm: elm,
                  chunks: chunks,
                  chunks_recv: chunks.length
                });

                // Update progress bar
                _this.updateDownloadProgress({
                  elm: elm,
                  chunk_count: chunk_count,
                  chunks_recv: chunks.length,
                  size: size
                });

                // Handle chanel keep alive messaging
                if (!model.get('keep_alive')) {
                  var kaInterval = setInterval(function() {

                    // Send keep alive message
                    c.channel.send(JSON.stringify({
                      'keep-alive': true
                    }));
                  }, 4000);

                  // Set the model's keep alive interval
                  model.set('keep_alive', kaInterval);
                }

                // Handle download completion
                if (chunk_count >= 1 && chunks.length >= chunk_count) {
                  _this.handleDownloadCompletion({
                    model: model
                  });
                }
              }
            },
            onDataChannelClose: function(c) {
              console.log('dc close');
            },
            onDataChannelError: function(c) {
              console.log('dc error');
            }
          });
        }
      });




      // Create new download model when doesn't already exist
      //if (!model) {
      //
      //  // Search for an existing connection with same peer
      //  var connection_model = this.collection.findWhere({peer_id: options.id});
      //
      //  // Add download model to collection
      //  this.collection.add({
      //
      //    // The cid of the model at the remote host
      //    cid: options.cid,
      //
      //    // For reference clarity, a download id (which is the cid of the model at the remote host)
      //    dl_id: options.cid,
      //
      //    // Requested route participle
      //    uri: options.uri,
      //
      //    // File's decoded name
      //    name: file_name,
      //
      //    // File size placeholder
      //    size: '--',
      //
      //    // Socket id of the remote host
      //    peer_id: options.id,
      //
      //    // Local socket id
      //    client_id: window.vdrive.client_id,
      //
      //    // The uri fragment of the resource (uri after the hash)
      //    frag: options.uri + '/' + options.id + '/' + options.cid + '/' + file_name,
      //
      //    // A flag indicating if the element has been selected through the UI
      //    selected: false,
      //
      //    // The Peer2Peer connection object
      //    connection: connection_model ? connection_model.get('connection') : new P2PC(options.id, {
      //      signal: new P2PS({socket: window.vdrive.socket}),
      //      debug: false
      //    }),
      //
      //    // A status string
      //    status: 'downloading',
      //
      //    // The source id of the peer
      //    source: options.id,
      //
      //    // The vlink for the download
      //    vlink: window.location.origin + '/' + 'app/' + options.uri + '/' + options.id + '/' + options.cid + '/' + file_name
      //  });
      //
      //  // Reference the newly created model
      //  model = this.collection.findWhere({dl_id: options.cid});
      //
      //  // Update model with element html
      //  model.set({ elm: this.template(model.attributes) });
      //
      //  // Create responding listening channel
      //  model.get('connection').newListeningChannel({
      //    channel_id: 'peerDownloadConnection',
      //    onDataChannelReady: function(c) {}
      //  });
      //
      //  // Request download from peer
      //  model.get('connection').openListeningChannel({
      //    client_id: model.get('client_id'),
      //    channel_id: 'peerDownloadConnection',
      //    connection_id: model.get('peer_id'),
      //    onDataChannelOpen: function(c) {
      //
      //      // Request file from peer
      //      c.channel.send(JSON.stringify({
      //        cid: model.get('dl_id')
      //      }));
      //    },
      //    onDataChannelMessage: function(c) {
      //      var
      //        data          = c.data;
      //
      //      // Handle peer messaging
      //      if (typeof data == 'string') {
      //        var message = JSON.parse(c.data);
      //
      //        // Update model and element with meta data
      //        if (message.message == 'meta') {
      //
      //          // Model
      //          model.set({
      //            type: message.type,
      //            size: message.size,
      //            name: message.name,
      //            vlink: window.location.origin + '/' + 'app/' + options.uri + '/' + options.id + '/' + options.cid + '/' + message.name,
      //            chunk_count: message.chunk_count
      //          });
      //
      //          // Element
      //          $(model.get('elm')).data('meta', {
      //            type: message.type,
      //            size: message.size,
      //            chunk_count: message.chunk_count,
      //            channel: c.channel,
      //            name: model.get('name'),
      //            frag: model.get('frag'),
      //            vlink: model.get('vlink')
      //          });
      //        }
      //
      //        // Mark file as no longer available
      //        else if (message.message == 'no-file') {
      //          $(model.get('elm')).addClass('unavailable');
      //        }
      //      }
      //
      //      // Handle file chunks
      //      else {
      //        var
      //          cid           = model.get('dl_id'),
      //          elm           = $('[data-cid="' + cid + '"]'),
      //          size          = model.get('size'),
      //          chunk         = c.data,
      //          chunks        = model.get('chunks'),
      //          chunk_count   = model.get('chunk_count');
      //
      //        // Save received chunks
      //        chunks.push(chunk);
      //        model.set({
      //          elm: elm,
      //          chunks: chunks,
      //          chunks_recv: chunks.length
      //        });
      //
      //        // Update progress bar
      //        _this.updateDownloadProgress({
      //          elm: elm,
      //          chunk_count: chunk_count,
      //          chunks_recv: chunks.length,
      //          size: size
      //        });
      //
      //        // Handle chanel keep alive messaging
      //        if (!model.get('keep_alive')) {
      //          var kaInterval = setInterval(function() {
      //
      //            // Send keep alive message
      //            c.channel.send(JSON.stringify({
      //              'keep-alive': true
      //            }));
      //          }, 4000);
      //
      //          // Set the model's keep alive interval
      //          model.set('keep_alive', kaInterval);
      //        }
      //
      //        // Handle download completion
      //        if (chunk_count >= 1 && chunks.length >= chunk_count) {
      //          _this.handleDownloadCompletion({
      //            model: model
      //          });
      //        }
      //      }
      //    },
      //    onDataChannelClose: function(c) {
      //      console.log('dc close');
      //    },
      //    onDataChannelError: function(c) {
      //      console.log('dc error');
      //    }
      //  });
      //}

      // Render downloading & downloaded files
      this.renderDownloads();
    },

    /*
     * Renders download elements in the downloads box
     */
    renderDownloads: function() {
      var
        complete_downloads      = this.collection.where({complete: true}),
        incomplete_downloads    = this.collection.where({complete: false}),
        downloads_container     = $('#downloads');

      // Render incomplete models
      _.each(incomplete_downloads, function(model) {
        var elm = $(model.get('elm'));
        downloads_container.append(model.get('elm'));

        // Update model reference to elm
        model.set({elm: $('[data-cid="' + model.get('cid') + '"]')});
      });

      // Render complete models
      _.each(complete_downloads, function(model) {
        var elm = $(model.get('elm'));

        // Toggle cancel/download controls
        elm.find('.cancel').removeClass('active');
        elm.find('.download').addClass('active');

        // Build download link attributes
        elm.find('.download a').attr({
          href: model.get('file_url'),
          target: '_blank',
          download: model.get('name')
        });

        // Detail element container
        elm.find('.progress-bar').css({width: '100%'});
        elm.find('.size').html(File.printFileSize(model.get('size')));

        // Render element
        downloads_container.append(elm);

        // Update model reference to elm
        model.set({elm: $('[data-cid="' + model.get('cid') + '"]')});
      });
    },

    /*
     * Updates download progress info
     */
    updateDownloadProgress: function( options ) {
      var percentage = Math.ceil((options.chunks_recv / options.chunk_count) * 100);
      if (options.elm) {

        // Make sure model/element receives a name
        if (options.elm.find('.name').html() == '{UNKNOWN_FILE}') {
          options.elm.find('.name').html(options.elm.data('meta').name);
          options.elm.find('.stats-container .vlink .data').html(options.elm.data('meta').vlink);
        }

        // Update progress info
        var chunk_size = options.size / options.chunk_count;
        var bytes_recv = File.printFileSize(options.chunks_recv * chunk_size);
        var progress_string = bytes_recv + ' / ' + File.printFileSize(options.size) + ' (' + percentage + '%)';
        options.elm.find('.stats-container .progress .data').html(progress_string);

        // Update progress bar
        options.elm.find('.progress-bar').css({width: percentage + '%'});
        options.elm.find('.size').html(bytes_recv + ' / ' + File.printFileSize(options.size));
      }
    },

    /*
     * Handles download completion
     */
    handleDownloadCompletion: function( options ) {
      var
        model       = options.model,
        chunks      = model.get('chunks'),
        file_type   = model.get('type'),
        file_blob   = new Blob(chunks, {type: file_type}),
        file_url    = URL.createObjectURL(file_blob),
        file_name   = model.get('name'),
        elm         = $('[data-cid="' + model.get('dl_id') + '"]');

      // Clear keep alive message
      clearInterval(model.get('keep_alive'));
      model.set('keep_alive', null);

      // Store object url in download's model
      model.set('file_url', file_url);

      // Set download completion flag
      model.set({
        complete: true,
        status: 'complete'
      });

      // Set download final size
      elm.find('.size').html(File.printFileSize(model.get('size')));

      // Build download link attributes
      elm.find('.download a').attr({
        href: file_url,
        target: '_blank',
        download: file_name
      });

      // Update status data
      elm.find('.stats-container .status .data').html(model.get('status'));

      // Toggle cancel/download controls
      elm.find('.cancel').removeClass('active');
      elm.find('.refresh').removeClass('active');
      elm.find('.download').addClass('active');

      // Add glimmer to completed downloads
      elm.addClass('shimmer');
      setTimeout(function() {
        elm.addClass('trigger');
        setTimeout(function() {
          elm.removeClass('shimmer trigger');
        }, 1300);
      }, 50);
    }

  });

  return new HandleDownloadsView();
});
