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
      x_margin      = x_margin || 0,
      y_margin      = y_margin || 0,
      offset        = target.offset(),
      width         = target.outerWidth(),
      height        = target.outerHeight(),
      box_width     = box.outerWidth(),
      box_height    = box.outerHeight(),
      arrow         = box.find('.arrow'),
      arrow_width   = arrow.outerWidth(),
      arrow_height  = arrow.outerHeight();

    // Position based on command
    switch(position) {
      case 'left' :
        box.css({
          left: offset.left - (box_width + arrow_width) + x_margin,
          top: offset.top - (box_height / 2) + (height / 2) + y_margin
        });
        break;
      case 'right' :
        box.css({
          left: offset.left + width + arrow_width + x_margin,
          top: offset.top - (box_height / 2) + (height / 2) + y_margin
        });
        break;
      case 'top' :
        box.css({
          left: offset.left + (width / 2) - (box_width / 2) + x_margin,
          top: offset.top - (box_height + arrow_height) + y_margin
        });
        break;
      case 'bottom' :
        box.css({
          left: offset.left + (width / 2) - (box_width / 2) + x_margin,
          top: offset.top + height + arrow_height + y_margin
        });
        break;
      case 'inside-left' :
        box.css({
          left: offset.left + arrow_width + x_margin,
          top: offset.top - (box_height / 2) + (height / 2) + y_margin
        });
        break;
      case 'inside-right' :
        box.css({
          left: offset.left + width - (box_width + arrow_width) + x_margin,
          top: offset.top - (box_height / 2) + (height / 2) + y_margin
        });
        break;
      case 'inside-top' :
        box.css({
          left: offset.left + (width / 2) - (box_width / 2) + x_margin,
          top: offset.top + arrow_height + y_margin
        });
        break;
      case 'inside-bottom' :
        box.css({
          left: offset.left + (width / 2) - (box_width / 2) + x_margin,
          top: offset.top + height - (box_height + arrow_height) + y_margin
        });
        break;
    }

    // Show message box
    box.addClass('transition');
  };

  return UI;
});
