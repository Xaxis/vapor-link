define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone) {
  var LoadPageView = Backbone.View.extend({
    el: $('body'),

    template: 'homepage',

    events: {
      'click nav li': 'loadNextPage'
    },

    initialize: function() {

      // Adjust context
      _.bindAll(this, 'render', 'loadNextPage');
    },

    render: function() {
      var
        _this         = this,
        loader        = $('#loader-overlay'),
        container     = $('#site-content'),
        duration      = 300,

        /*
         * Method for toggling the content loader overlay
         */
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

        /*
         * Method for loading the content of the next page
         */
        getContent  = function() {

          // Animate in loader
          toggleLoader(function() {

            // Load/animate content
            $.get("templates/" + _this.template + ".html", function(template) {
              $(_this.el).append('<div id="site-content"></div>');
              $('#site-content')
                .html(template)
                .stop()
                .animate(
                { opacity: 1 },
                {
                  duration: duration,
                  complete: function() {
                    toggleLoader();
                  }
                }
              );
            });
          });
        };

      // Animate previous site content out
      if (container.length) {
        $('#site-content')
          .animate(
          { opacity: 0 },
          {
            duration: duration,
            complete: function() {
              getContent();
            }
          }
        );
      }

      // Animate site content in
      else {
        getContent();
      }
    },

    loadNextPage: function(e) {
      var target = $(e.currentTarget);
      var target_uri = target.find('a').attr('href').replace('#', '');
      $('nav li').removeClass('active');
      target.addClass('active');
      this.template = target_uri;
      this.render();
    }
  });

  return LoadPageView;
});
