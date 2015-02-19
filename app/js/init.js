(function(window, require) {

  /**
   * Configure require.js
   */
  require.config({
    baseUrl: 'js',
    paths: {
      jquery: 'libs/jquery/dist/jquery.min',
      'jquery.eye': 'libs/jquery.eye/dist/jquery.eye.min',
      underscore: 'libs/underscore/underscore',
      backbone: 'libs/backbone/backbone'
    },
    shim: {}
  });

  /**
   * Initialize app.
   */
  require(['app'], function(App) {
    window.vcdnio = new App();
    window.vcdnio.initialize();
  });

})(window, require);
