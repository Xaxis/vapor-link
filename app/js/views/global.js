define([
  'jquery',
  'jquery.eye',
  'underscore',
  'backbone',
  'text!../../templates/handleFiles.html',
  'text!../../templates/messageBox.html',
  'ui'
], function(
  $,
  Eye,
  _,
  Backbone,
  HandleFilesTpl,
  MessageBoxTpl,
  UI
) {
  var GlobalView = Backbone.View.extend({
    el: $('body'),

    message_box: _.template(MessageBoxTpl),

    events: {
      'mouseenter .info': 'infoLinkMessage',
      'mouseleave .info': 'infoLinkMessage',
      'mouseenter .info-button': 'infoLinkMessage',
      'mouseleave .info-button': 'infoLinkMessage',
      'click .message-section .controls .close': 'closeSectionMessage',
      'click .message-box.popup .close': 'closePopupBox'
    },

    initialize: function() {
      var
        _this = this;

      // Bind handlers
      _.bindAll(this,
        'infoLinkMessage'
      );

      // Adjust window padding when footer changes size
      $('footer').eye({
        load: true,
        'height()': function () {
          var footer = $('footer').outerHeight();
          $('html').css('padding-bottom', footer);
        }
      }, 100);
    },

    /*
     * HANDLE - Hide/show info link messages
     */
    infoLinkMessage: function(e) {
      if (e.type == 'mouseenter') {
        var
          target        = $(e.target).attr('data-message') ? $(e.target) : $(e.target).closest("[data-message]"),
          message       = target.attr('data-message'),
          position      = target.attr('data-position'),
          direction     = target.attr('data-arrow'),
          size          = target.attr('data-size'),
          message_box   = this.message_box({
            id: 'info-link-temp',
            message: message,
            classes: size || 'medium',
            arrow_direction: direction || 'top'
          });
        UI.positionMessageBox($(message_box), target, position || 'bottom', 0, 0);
      } else if (e.type == 'mouseleave') {
        $('#info-link-temp').remove();
      }
    },

    /*
     * HANDLE - Closing a message section based on control click
     */
    closeSectionMessage: function(e) {
      var
        target        = $(e.target),
        section       = target.closest('section');
      section.addClass('close-active');
      section.animate({height: 0}, {duration: 300, complete: function() {
        section.hide();
      }});
    },

    /*
     * HANDLE - Close/remove popup message box
     */
    closePopupBox: function(e) {
      var
        target        = $(e.target),
        box           = target.closest('.message-box');
      box.remove();
    }
  });

  return GlobalView;
});
