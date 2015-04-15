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
      'mouseenter #download-link-button': 'pasteDownloadMessage',
      'mouseleave #download-link-button': 'pasteDownloadMessage',
      'mouseenter li .cancel': 'cancelRemoveDownloadMessage',
      'mouseleave li .cancel': 'cancelRemoveDownloadMessage',
      'mouseenter li .download': 'saveDownloadMessage',
      'mouseleave li .download': 'saveDownloadMessage',

      // @TODO - Implement below
      'click li .cancel': 'cancelRemoveDownload'
    },

    initialize: function () {

      // Bind handlers
      _.bindAll(this,
        'addDownload',
        'renderDownloads',
        'handleDownloadLinkInput',
        'handleDownloadButton',
        'pasteDownloadMessage',
        'cancelRemoveDownloadMessage',
        'saveDownloadMessage',

        // @todo - implement
        'cancelRemoveDownload'
      );

      // Initialize new downloads collection
      this.collection = new HandleDownloadsCollection();
    },

    /*
     * HANDLE - Hide/show paste download link message
     */
    pasteDownloadMessage: function(e) {
      if ($(e.target).hasClass('frozen')) {
        if (e.type == 'mouseenter') {
          var message_box = this.message_box_tpl({
            id: 'paste-url-notice',
            message: 'Paste shared v-link and click to start download.',
            classes: 'small-box',
            arrow_direction: 'right'
          });
          UI.positionMessageBox($(message_box), $(e.target), 'left', 0, 0);
        } else if (e.type == 'mouseleave') {
          $('#paste-url-notice').remove();
        }
      }
    },

    /*
     * HANDLE - Hide/show cancel download message
     */
    cancelRemoveDownloadMessage: function(e) {
      if (e.type == 'mouseenter') {
        var message_box = this.message_box_tpl({
          id: 'cancel-download-message',
          message: 'Cancel and remove download',
          classes: 'inline-box',
          arrow_direction: 'left'
        });
        UI.positionMessageBox($(message_box), $(e.target), 'right', 4, 0);
      } else if (e.type == 'mouseleave') {
        $('#cancel-download-message').remove();
      }
    },

    /*
     * HANDLE - Hide/show save download message
     */
    saveDownloadMessage: function(e) {
      if (e.type == 'mouseenter') {
        var message_box = this.message_box_tpl({
          id: 'save-download-message',
          message: 'Save download',
          classes: 'inline-box',
          arrow_direction: 'left'
        });
        UI.positionMessageBox($(message_box), $(e.target), 'right', 4, 0);
      } else if (e.type == 'mouseleave') {
        $('#save-download-message').remove();
      }
    },

    // @todo - implement
    cancelRemoveDownload: function(e) {
      var
        _this     = this,
        target    = $(e.target),
        dl_id     = target.closest('li').attr('data-cid'),
        model     = this.collection.where({dl_id: dl_id})[0],
        elm       = model.attributes.elm;

      // Remove element and model from collection
      $('#cancel-download-message').remove();
      elm.animate({opacity: 0}, {duration: 300, complete: function() {
        elm.remove();
        _this.collection.remove(model);
      }});
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
        _this     = this,
        model     = this.collection.findWhere({dl_id: options.cid});

      // Create new download model when doesn't already exist
      if (!model) {

        // Search for an existing connection with same peer
        var connection_model = this.collection.findWhere({peer_id: options.id});

        // Add download model to collection
        this.collection.add({
          cid: options.cid,
          dl_id: options.cid,
          uri: options.uri,
          name: decodeURIComponent(options.name),
          size: '--',
          peer_id: options.id,
          client_id: window.vdrive.client_id,

          // Create p2p download object
          connection: connection_model ? connection_model.get('connection') : new P2PC(options.id, {
            signal: new P2PS({socket: window.vdrive.socket}),
            debug: false
          })
        });

        // Reference the newly created model
        model = this.collection.findWhere({dl_id: options.cid});

        // Update model with element html
        model.set({ elm: this.template(model.attributes) });

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

              // Update model with meta
              if (message.message == 'meta') {
                model.set({
                  type: message.type,
                  size: message.size,
                  chunk_count: message.chunk_count
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

      // Render downloading & downloaded files
      this.renderDownloads();
    },

    renderDownloads: function() {
      var
        complete_downloads      = this.collection.where({complete: true}),
        incomplete_downloads    = this.collection.where({complete: false}),
        downloads_container     = $('#downloads');

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

      // Render incomplete models
      _.each(incomplete_downloads, function(model) {
        var elm = $(model.get('elm'));
        downloads_container.append(model.get('elm'));

        // Update model reference to elm
        model.set({elm: $('[data-cid="' + model.get('cid') + '"]')});
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
      model.set('complete', true);

      // Build download link attributes
      elm.find('.download a').attr({
        href: file_url,
        target: '_blank',
        download: file_name
      });

      // Toggle cancel/download controls
      elm.find('.cancel').removeClass('active');
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
