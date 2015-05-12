define([
  'jquery',
  'underscore',
  'backbone',
  'views/global',
  'views/loadPage',
  'views/handleFiles',
  'views/handleDownloads'
], function(
  $,
  _,
  Backbone,
  Global,
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
      'download/:socket/:id': 'loadPage',
      'download/:socket/q/:cids': 'loadPage',
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
        complete  = null,
        socket_id = null,
        cid       = null,
        name      = null;

      // Download w/ name
      if (args.length == 4 && args[1] != 'q') {
        var cids = args[1].split(/c/);
        cids.shift();
        socket_id = args[0];
        cid = cids;
        name = args[2];
      }

      // Download w/o name
      else if (args.length == 3 && args[1] != 'q') {
        var cids = args[1].split(/c/);
        cids.shift();
        socket_id = args[0];
        cid = cids;
        name = args[2];
      }

      // Multi download link
      else if (args.length == 4 && args[1] == 'q') {
        var cids = args[2].split(/c/);
        cids.shift();
        socket_id = args[0];
        cid = cids;
      }

      // Attach global view
      new Global();

      // Build onComplete callback
      switch(true) {

        // Handle download requests
        case route == 'download' :
          complete = function() {

            // Add download file to view
            HandleDownloadsView.addDownload({
              uri: route,
              id: socket_id,
              cid: cid,
              name: name
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
