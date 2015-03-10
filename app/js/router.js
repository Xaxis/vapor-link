define([
  'jquery',
  'underscore',
  'backbone',
  'views/loadPage',
  'views/handleFiles',
  'views/handleDownloads'
], function(
  $,
  _,
  Backbone,
  LoadPageView,
  HandleFilesView,
  HandleDownloadsView
) {
  var AppRouter = Backbone.Router.extend({
    routes: {
      '': 'loadPage',
      'homepage': 'loadPage',
      'homepage/*path': 'loadPage',
      'download': 'loadPage',
      'download/:socket/:id/:name': 'loadPage',
      '*actions': 'defaultAction'
    }
  });

  var initialize = function() {
    var app_router = new AppRouter;

    /*
     * Handle loading a page
     */
    app_router.on('route:loadPage', function() {
      var
        args      = _.toArray(arguments),
        route     = window.location.hash.replace('#', '').replace(/\/.*/, ''),
        complete  = null;

      // Build onComplete callback
      switch(true) {

        case route == 'download' && args.length >= 3 :
          complete = function() {
            HandleDownloadsView.addDownload({
              uri: route,
              id: args[0],
              cid: args[1],
              name: args[2]
            });
          };
          break;

        default :
          new HandleFilesView();
          break;
      }

      // Load corresponding route and trigger views
      new LoadPageView({
        uri: route,
        complete: complete
      });
    });

    /*
     * Handle all default actions
     */
    app_router.on('route:defaultAction', function(actions) {
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
