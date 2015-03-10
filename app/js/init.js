(function(window, require) {

  /**
   * Configure require.js
   */
  require.config({
    baseUrl: 'js',
    paths: {
      
      // Vendor dependencies
      jquery: 'libs/vendor/jquery/dist/jquery.min',
      'jquery.eye': 'libs/vendor/jquery.eye/dist/jquery.eye.min',
      text: 'libs/vendor/requirejs-text/text',
      underscore: 'libs/vendor/underscore/underscore',
      backbone: 'libs/vendor/backbone/backbone',
      socketio: '//localhost:9222/socket.io/socket.io',
      zeroclipboard: 'libs/vendor/zeroclipboard/dist/ZeroClipboard',

      // Native dependencies
      file: 'libs/file',
      p2pc: 'libs/p2pc',
      p2ps: 'libs/p2ps'
    }
  });

  /**
   * Initialize app.
   */
  require(['app'], function(App) {
    window.vdrive = new App();
    window.vdrive.initialize();
  });

})(window, require);
