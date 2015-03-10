define([
  'jquery',
  'underscore',
  'backbone',
], function($, _, Backbone) {
  var LoadPageView = Backbone.View.extend({
    el: $('body'),

    src: 'homepage',

    initialize: function( options ) {

      // Add config options
      this.options = options || {};

      // Update target src
      var src = this.options.uri ? this.options.uri : 'homepage';
      this.src = src.replace(/\/.*/, '');

      // Get onComplete callback
      var complete = this.options.complete || false;

      // Adjust context
      _.bindAll(this, 'render');

      // Render page
      this.render( complete );
    },

    render: function( complete ) {
      var
        _this         = this,
        loader        = $('#loader-overlay'),
        duration      = 300,

        toggleLoader  = function( callback ) {
          var state = loader.hasClass('active') ? 1 : 0;

          if (!state) {
            loader.addClass('active');
          }

          // Animate loader
          loader
            .animate(
            {
              opacity: !state ? 1 : 0
            },
            {
              duration: duration + 100,
              complete: function() {
                if (callback) callback();
                if (state) loader.removeClass('active');
              }
            }
          );
        },

        getContent  = function() {

          // Animate in loader
          toggleLoader(function() {

            // Load/animate content
            $.get("templates/" + _this.src + ".html", function(src) {
              $(_this.el).append('<div id="site-content"></div>');
              $('#site-content')
                .html(src)
                .stop()
                .animate(
                { opacity: 1 },
                {
                  duration: duration,
                  complete: function() {

                    // Toggle loading overlay
                    toggleLoader();

                    // Trigger callback
                    if (complete) complete();
                  }
                }
              );
            });
          });
        };

      // Animate in page load
      getContent();
    }
  });

  return LoadPageView;
});
