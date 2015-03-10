var
  _                   = require('lodash'),
  io                  = require('socket.io'),
  fs                  = require('fs'),
  express             = require('express'),
  path                = require('path'),
  port                = 9222,
  app                 = express(),
  hosts               = {},
  server              = null,
  vapor               = (function(v) {

    /**
     * Register a host/client
     */
    v.register = function(msg, socket) {

      // Register client as ready
      if (msg.ready && !(socket.id in hosts)) {
        hosts[socket.id] = {
          socket: socket,
          id: socket.id
        };

        // Build registration object
        hosts[socket.id].init = {
          id: socket.id
        };

        // Send registration to client
        socket.emit('ready', hosts[socket.id].init);
      }
    };

    /**
     * De-register a host/client
     */
    v.deregister = function(socket_id) {
      delete hosts[socket_id];
    };

    return v;
  }(vapor || {}));

/*
 * Server config
 */

// Trust X-Forwarded-* header fields
app.enable('trust proxy');

/*
 * Define socket listeners
 */

// Initialize server & socket.io
server = app.listen(port);
io = io.listen(server, {log: false});

// Connection handlers
io.sockets.on('connection', function(socket) {

  /**
   * Listen on request to register a client.
   */
  socket.on('register', function(msg) {
    vapor.register(msg, socket);
  });

  /**
   * Listen on request to deregister client.
   */
  socket.on('disconnect', function() {
    vapor.deregister(socket.id);
  });

  /**
   * Listen on request to send data message to target peer.
   *
   * @param messageObject {Parameters}
   * @param messageObject.peer_id Socket ID of target peer to send message to
   * @param messageObject.client_id Socket ID of peer sending the message
   * @param messageObject.handler_id Name of listening 'onmessage' callback
   */
  socket.on('P2PC_SendMessageToPeer', function( messageObject ) {
    var
      target_peer   = null,
      handler       = messageObject.handler_id;

    if (messageObject.peer_id in hosts) {
      target_peer = hosts[messageObject.peer_id].socket;
      target_peer.emit(handler, _.extend(messageObject, {
        client_id: messageObject.peer_id,
        peer_id: messageObject.client_id
      }));
    }
  });

});
