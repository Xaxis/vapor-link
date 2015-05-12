define([
  'jquery'
], function( $ ) {
  var UI = {};

  /**
   * Positions a message box relative to the left, right, top, or bottom of a target element.
   * @param box
   * @param target
   * @param position
   * @param x_margin
   * @param y_margin
   */
  UI.positionMessageBox = function( box, target, position, x_margin, y_margin ) {

    // Append message box to body
    $('body').append(box);

    // Calculate dimensions after element is appended
    var
      x_margin                = x_margin || 0,
      y_margin                = y_margin || 0,
      viewport_width          = $(window).outerWidth(),
      offset                  = target.offset(),
      width                   = target.outerWidth(),
      height                  = target.outerHeight(),
      box_width               = box.outerWidth(),
      box_height              = box.outerHeight(),
      arrow                   = box.find('.arrow'),
      arrow_width             = arrow.outerWidth(),
      arrow_height            = arrow.outerHeight(),
      pos_left                = 0,
      pos_top                 = 0;

    // Position based on command
    switch (position) {
      case 'left' :
        pos_left = offset.left - (box_width + arrow_width) + x_margin;
        pos_top = offset.top - (box_height / 2) + (height / 2) + y_margin;
        break;
      case 'right' :
        pos_left = offset.left + width + arrow_width + x_margin;
        pos_top = offset.top - (box_height / 2) + (height / 2) + y_margin;
        break;
      case 'top' :
        pos_left = offset.left + (width / 2) - (box_width / 2) + x_margin;
        pos_top = offset.top - (box_height + arrow_height) + y_margin;
        break;
      case 'bottom' :
        pos_left = offset.left + (width / 2) - (box_width / 2) + x_margin;
        pos_top = offset.top + height + arrow_height + y_margin;
        break;
      case 'inside-left' :
        pos_left = offset.left + arrow_width + x_margin;
        pos_top = offset.top - (box_height / 2) + (height / 2) + y_margin;
        break;
      case 'inside-right' :
        pos_left = offset.left + width - (box_width + arrow_width) + x_margin;
        pos_top = offset.top - (box_height / 2) + (height / 2) + y_margin;
        break;
      case 'inside-top' :
        pos_left = offset.left + (width / 2) - (box_width / 2) + x_margin;
        pos_top = offset.top + arrow_height + y_margin;
        break;
      case 'inside-bottom' :
        pos_left = offset.left + (width / 2) - (box_width / 2) + x_margin;
        pos_top = offset.top + height - (box_height + arrow_height) + y_margin;
        break;
    }

    // Viewport cutting off message box on the right
    if ((pos_left + box_width) > viewport_width) {
      arrow.addClass('cutoff-right');
      if (position == 'top' || position == 'bottom') {
        pos_left = offset.left - box_width + width;
      }
      else if (position == 'right' || position == 'left') {
        arrow.removeClass('left right bottom cutoff-right').addClass('top');
        box.remove();
        UI.positionMessageBox(box, target, 'bottom', 0, 0);
        return;
      }
    }

    // Viewport cutting off message on the left
    else if (pos_left < 0) {
      arrow.addClass('cutoff-left');
      if (position == 'top' || position == 'bottom') {
        pos_left = offset.left;
      }
      else if (position == 'right' || position == 'left') {
        arrow.removeClass('left right bottom cutoff-left').addClass('top');
        box.remove();
        UI.positionMessageBox(box, target, 'bottom', 0, 0);
        return;
      }
    }

    // Position the message box
    box.css({
      left: pos_left,
      top: pos_top
    });

    // Show message box w/ transition effect
    box.addClass('transition');
  };

  /**
   * Opens a popup message box at the position of target_selector and loads a message.
   * @param target_selector
   * @param msg_box_tpl
   * @param message
   */
  UI.openPopupMessageBox = function( target_selector, msg_box_tpl, message ) {
    var
      target          = $(target_selector),
      message_string  = target.attr('data-message') + message,
      position        = target.attr('data-position'),
      direction       = target.attr('data-arrow'),
      size            = target.attr('data-size'),
      x_margin        = parseInt(target.attr('data-margin-x')) || 0,
      y_margin        = parseInt(target.attr('data-margin-y')) || 0,
      message_box     = msg_box_tpl({
        id: 'popup-box-temp',
        message: message_string,
        classes: size + ' popup',
        arrow_direction: direction || 'top'
      });

    // Initially position box
    UI.positionMessageBox($(message_box), target, position || 'bottom', x_margin, y_margin);

    // Reposition on resize
    $(window).on('resize', function() {
      $('.popup').remove();
      UI.positionMessageBox($(message_box), target, position || 'bottom', x_margin, y_margin);
    });

    // Reposition on page scroll
    $('body').on('scroll', function() {
      $('.popup').remove();
      UI.positionMessageBox($(message_box), target, position || 'bottom', x_margin, y_margin);
    });
  };

  return UI;
});
