/**
 * Primary app module
 */
define([
  'backbone',
  'router',
  'socketio'
], function( Backbone, Router, io ) {
  var App = function() {
    return {

      /**
       * Default initialization method
       */
      initialize: function() {
        var _this = this;

        // Start router
        Router.initialize({pushState: true});

        // Build socket
        this.socket = io.connect('//localhost:9222');

        // Register
        this.socket.emit('register', {ready: true});

        // Receive registration
        this.socket.on('ready', function( info ) {
          _this.client_id = info.id;
          console.log('my client_id: ', _this.client_id);
        });
      }
    };
  };

  return App;
});
