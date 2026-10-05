/*
 * PerspectiveTransform
 * Maps a rectangular DOM element onto an arbitrary quad using a CSS matrix3d.
 * API-compatible replacement for the old external helper used by the globe.
 *
 *   var pt = new PerspectiveTransform(element, width, height);
 *   pt.topLeft.x = ...; (same for topRight, bottomLeft, bottomRight)
 *   pt.hasError = pt.checkError();   // true when the quad faces away or is degenerate
 *   if (!pt.hasError) pt.calc();     // compute the matrix
 *   pt.update();                     // apply the matrix to the element
 */
(function (global) {
  var testStyle = document.createElement('div').style;
  var transformStyleName = 'transform' in testStyle ? 'transform' : 'webkitTransform';
  var transformOriginStyleName = transformStyleName + 'Origin';

  function PerspectiveTransform(element, width, height) {
    this.element = element;
    this.style = element.style;
    this.width = width;
    this.height = height;
    this.topLeft = { x: 0, y: 0 };
    this.topRight = { x: 0, y: 0 };
    this.bottomLeft = { x: 0, y: 0 };
    this.bottomRight = { x: 0, y: 0 };
    this.hasError = false;
    this.matrix = '';
  }

  PerspectiveTransform.transformStyleName = transformStyleName;
  PerspectiveTransform.transformOriginStyleName = transformOriginStyleName;

  // Returns true when the quad should NOT be drawn (back-facing or degenerate).
  PerspectiveTransform.prototype.checkError = function () {
    var tl = this.topLeft, tr = this.topRight, bl = this.bottomLeft;
    var cross = (tr.x - tl.x) * (bl.y - tl.y) - (tr.y - tl.y) * (bl.x - tl.x);
    return !(cross > 0);
  };

  // Computes the matrix3d mapping the (0,0)-(w,h) rectangle onto the quad.
  PerspectiveTransform.prototype.calc = function () {
    var x0 = this.topLeft.x,     y0 = this.topLeft.y;
    var x1 = this.topRight.x,    y1 = this.topRight.y;
    var x2 = this.bottomRight.x, y2 = this.bottomRight.y;
    var x3 = this.bottomLeft.x,  y3 = this.bottomLeft.y;

    var dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    var dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;

    var a, b, c, d, e, f, g, h;

    if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) {
      // Affine case
      a = x1 - x0; b = x3 - x0; c = x0;
      d = y1 - y0; e = y3 - y0; f = y0;
      g = 0; h = 0;
    } else {
      var den = dx1 * dy2 - dx2 * dy1;
      if (Math.abs(den) < 1e-12) {
        this.hasError = true;
        return;
      }
      g = (dx3 * dy2 - dx2 * dy3) / den;
      h = (dx1 * dy3 - dx3 * dy1) / den;
      a = x1 - x0 + g * x1;
      b = x3 - x0 + h * x3;
      c = x0;
      d = y1 - y0 + g * y1;
      e = y3 - y0 + h * y3;
      f = y0;
    }

    // Scale from the unit square to the element's pixel size
    var w = this.width, hh = this.height;
    this.matrix = 'matrix3d(' + [
      a / w, d / w, 0, g / w,
      b / hh, e / hh, 0, h / hh,
      0, 0, 1, 0,
      c, f, 0, 1
    ].join(',') + ')';
  };

  PerspectiveTransform.prototype.update = function () {
    this.style[transformStyleName] = this.matrix;
  };

  global.PerspectiveTransform = PerspectiveTransform;
})(window);
