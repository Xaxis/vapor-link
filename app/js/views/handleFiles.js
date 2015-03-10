define([
  'jquery',
  'underscore',
  'backbone',
  'zeroclipboard',
  '../collections/handleFiles',
  'text!../../templates/handleFiles.html',
  'text!../../templates/messageBox.html',
  'file',
  'p2ps',
  'p2pc'
], function(
  $,
  _,
  Backbone,
  ZeroClipboard,
  HandleFilesCollection,
  HandleFilesTpl,
  MessageBoxTpl,
  File,
  P2PS,
  P2PC
) {
  var HandleFilesView = Backbone.View.extend({
    el: $('body'),

    template: _.template(HandleFilesTpl),

    message_box: _.template(MessageBoxTpl),

    events: {
      'dragenter #drop-zone': 'fileDragHandler',
      'dragover #drop-zone': 'fileDragHandler',
      'drop #drop-zone': 'fileDragHandler',
      'dragenter #drop-zone-indicator': 'fileDragHandler',
      'dragover #drop-zone-indicator': 'fileDragHandler',
      'dragleave #drop-zone-indicator': 'fileDragHandler',
      'drop #drop-zone-indicator': 'fileDragHandler',
      'click #add-files': 'fileInputTrigger',
      'change #add-files-input': 'fileInputHandler',
      'click .check-link': 'toggleCheckedFile',
      'mouseenter .share-link': 'moveClipCopy',
      'mouseleave #global-zeroclipboard-html-bridge': 'removeClipCopy'
    },

    initialize: function() {
      var
        _this     = this;

      // Bind handlers
      _.bindAll(this,
        'fileInputHandler',
        'fileDragHandler',
        'fileDrop',
        'toggleCheckedFile',
        'copyToClipHandler'
      );

      // Initialize a new file object collection
      this.collection = new HandleFilesCollection();

      // Initialize copy to clipboard on added element
      this.copyToClipHandler();

      // Initializations to take place upon socket.io ready
      var initInterval = setInterval(function() {
        if ('vdrive' in window) {
          if ('client_id' in window.vdrive) {
            clearInterval(initInterval);

            // Create new peer connection object with signaling channel
            var peerDownloadConnection =
              _this.connections[window.vdrive.client_id] =
                _this.connections[window.vdrive.client_id] ||
                new P2PC(window.vdrive.client_id, {
                  signal: new P2PS({socket: window.vdrive.socket}),
                  debug: false
                });

            // Add peer listening channel
            peerDownloadConnection.newListeningChannel({
              channel_id: 'peerDownloadConnection',
              onDataChannelReady: function(c) {
                var
                  message       = JSON.parse(c.data);

                // Handle download requests (when not receiving a keep alive ping)
                if (!('keep-alive' in message)) {
                  var
                    file_model    = _this.collection.get(message.cid),
                    file_attrs    = file_model.attributes,
                    file_ref      = file_attrs.file,
                    chunk_size    = 1149,
                    peer_id       = c.peer_id,
                    peers         = file_model.get('peers');

                  // Register peer download object
                  if (!(peer_id in peers)) {
                    peers[peer_id] = {
                      status: {
                        chunk_count: File.getChunkCount(file_ref, chunk_size),
                        chunks_sent: 0
                      }
                    };
                    file_model.set('peers', peers);
                  }

                  // Send chunks to peer
                  File.forEachChunk( file_ref, chunk_size, function(index, chunk) {

                    // Send meta info before first chunk
                    if (!index) {
                      c.channel.send(JSON.stringify({
                        size: file_ref.size,
                        type: file_ref.type,
                        chunk_count: peers[peer_id].status.chunk_count
                      }));

                      // Send first chunk
                      c.channel.send(chunk);
                    }

                    // Send remaining chunks
                    else {
                      c.channel.send(chunk);
                    }

                    // Increment chunks sent counter
                    peers[peer_id].status.chunks_sent++;
                  });
                }
              }
            });

          }
        }
      }, 100);
    },

    connections: {},

    copy_target: null,

    fileInputTrigger: function() {
      $('#add-files-input').click();
    },

    fileInputHandler: function(e) {
      this.fileDrop(e);
    },

    fileDragHandler: function(e) {
      e.preventDefault();

      // Which element is event occurring on
      var elm_id = $(e.currentTarget).attr('id');

      // Proceed based on drag event type
      switch (e.type) {
        case 'dragenter' :
          if (elm_id == 'drop-zone') {
            $('#drop-zone-indicator').addClass('dragenter');
          }
          break;
        case 'dragleave' :
          $('#drop-zone-indicator').removeClass('dragenter');
          break;
        case 'drop' :
          if (elm_id == 'drop-zone-indicator') {
            $('#drop-zone-indicator').removeClass('dragenter');
            this.fileDrop(e);
          }
          break;
      }
    },

    fileDrop: function(e) {
      var
        _this     = this;

      // Access dropped files
      _.each(File.getFiles(e), function(file) {
        var file_obj = {
          file: file,
          name: file.name,
          size: File.printFileSize(file),
          date: File.printDate(file)
        };

        // Add file to collection
        _this.collection.add(file_obj);

        // Get the last added model
        var last_model = _this.collection.models[_this.collection.models.length-1];

        // Update model
        last_model.set({
          id: last_model.cid,
          uri:
            window.location.href +
            '#download/' +
            this.vdrive.client_id + '/' +
            last_model.cid + '/' +
            encodeURIComponent(last_model.get('name'))
        });

        // Populate/set element
        last_model.set({ elm: _this.template(last_model.attributes) });

        // Render dropped file views
        $('#drop-zone').append(last_model.get('elm'));
      });
    },

    toggleCheckedFile: function(e) {
      e.stopPropagation();
      var
        elm     = $(e.target),
        parent  = elm.closest('[data-id]'),
        id      = parent.attr('data-id'),
        model   = this.collection.get(id),
        state   = model.get('selected') ? false : true;

      // Set model 'selected' state
      model.set({selected: state});

      // Update view
      elm.toggleClass('selected');
      parent.toggleClass('selected');
    },

    copyToClipHandler: function() {
      var _this = this;

      // Configure SWF path
      ZeroClipboard.config ({
        swfPath: 'js/libs/vendor/zeroclipboard/dist/ZeroClipboard.swf'
      });

      // Initialize zero clipboard
      var clippy = new ZeroClipboard();

      // Handle clippy copy to clipboard
      clippy.on('ready', function() {
        clippy.on('copy', function(e) {
          e.clipboardData.setData('text/plain', _this.copy_target.attr('data-uri'));
        });
        clippy.on('aftercopy', function(e) {
          $('#copy-message .message').html('Copied!');
        });
      });
    },

    moveClipCopy: function(e) {
      var
        target      = $(e.target),
        target_o    = target.offset(),
        target_x    = target_o.left,
        target_y    = target_o.top,
        target_h    = target.height(),
        target_w    = target.width(),
        clipCopy    = $('#global-zeroclipboard-html-bridge');

      // Highlight share link icon
      target.addClass('selected');

      // Add message box tpl
      var message_box = this.message_box({
        id: 'copy-message',
        message: 'Copy link to clipboard'
      });
      target.after(message_box);

      // Set zeroclipboard over target
      clipCopy
        .css({left: target_x, top: target_y})
        .css({height: target_h, width: target_w});

      // Set current copy target
      this.copy_target = target;
    },

    removeClipCopy: function(e) {
      var
        target      = $('#global-zeroclipboard-html-bridge');

      // Remove message box tpl
      $('#copy-message').remove();

      // Un-highlight share link icon
      this.copy_target.removeClass('selected');

      // Set zeroclipboard over target
      target.css({left: 0, top: -999});
    }
  });

  return HandleFilesView;
});
