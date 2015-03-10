/**
 * Primary app module
 */
define([
  'jquery',
  'jquery.eye',
  'underscore',
  'backbone',
  'router',
  'socketio',
  'p2ps'
], function( $, Eye, _, Backbone, Router, io, P2PS ) {
  var App = function() {

    /*
     * WATCH/HANDLE:
     * - Adjust window padding when footer changes size
     */
    $('footer').eye({
      load: true,
      'height()': function () {
        var footer = $('footer').outerHeight();
        $('html').css('padding-bottom', footer);
      }
    }, 100);

    // Expose module's methods
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
