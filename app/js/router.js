define([
  'jquery',
  'underscore',
  'backbone',
  'views/loadPage'
], function($, _, Backbone, LoadPageView) {
  var AppRouter = Backbone.Router.extend({
    routes: {
      '': 'loadPage',
      'homepage': 'loadPage',
      'about': 'loadPage',
      'faq': 'loadPage',
      'docs': 'loadPage',
      'connect': 'loadPage',
      '*actions': 'defaultAction'
    }
  });

  var initialize = function() {
    var app_router = new AppRouter;

    /*
     * Handle loading the main page view
     */
    app_router.on('route:loadPage', function() {
      var loadPageView = new LoadPageView();
      loadPageView.render();
    });

    /*
     * Handle all default actions
     */
    app_router.on('route:defaultAction', function(actions) {

      // No matching route
      console.log('No route: ', actions);
    });

    // Start history stack
    Backbone.history.start();

    return app_router;
  };

  return {
    initialize: initialize
  }
});
