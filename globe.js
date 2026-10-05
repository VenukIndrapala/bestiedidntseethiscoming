/*
 * Realistic CSS Globe
 * Original concept credit: Edan Kwan
 * Cleaned up: no dat.GUI, no Stats, no TweenMax, all assets local.
 */
(function () {
  'use strict';

  var URLS = {
    bg: 'assets/globe_bg.jpg',
    diffuse: 'assets/globe_diffuse.jpg',
    halo: 'assets/globe_halo.png'
  };

  var config = {
    lat: 0,
    lng: 0,
    segX: 14,
    segY: 12,
    isHaloVisible: true,
    isPoleVisible: true,
    autoSpin: true,
    zoom: 0
  };

  var globeDoms = [];
  var vertices = [];
  var world, worldBg, globe, globeContainer, globePole, globeHalo;

  var pixelExpandOffset = 1.5;
  var sinRX, sinRY, sinRZ, cosRX, cosRY, cosRZ;
  var rX = 0, rY = 0, rZ = 0;
  var dragX, dragY, dragLat, dragLng;
  var isMouseDown = false;
  var isTweening = false;
  var activeTween = null;
  var tick = 1;

  var transformStyleName = PerspectiveTransform.transformStyleName;

  /* ---------- helpers ---------- */

  function clamp(x, min, max) {
    return x < min ? min : x > max ? max : x;
  }

  function clampLng(lng) {
    return ((((lng + 180) % 360) + 360) % 360) - 180;
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(url); };
      img.onerror = function () { reject(url); };
      img.src = url;
    });
  }

  function showMessage(html) {
    var el = document.getElementById('message');
    el.innerHTML = html;
    el.hidden = false;
  }

  /* ---------- tween ---------- */

  function tween(durationSec, update, done) {
    var start = performance.now();
    var cancelled = false;
    function step(now) {
      if (cancelled) return;
      var t = durationSec <= 0 ? 1 : Math.min((now - start) / (durationSec * 1000), 1);
      update(easeInOutSine(t));
      if (t < 1) {
        requestAnimationFrame(step);
      } else if (done) {
        done();
      }
    }
    requestAnimationFrame(step);
    return { cancel: function () { cancelled = true; } };
  }

  function goTo(lat, lng) {
    if (activeTween) activeTween.cancel();

    var startLat = config.lat;
    var startLng = config.lng;
    var dLat = lat - startLat;
    var dLng = clampLng(lng - startLng); // shortest way round
    var roughDistance = Math.sqrt(dLat * dLat + dLng * dLng);
    var startZoom = config.zoom;

    isTweening = true;
    activeTween = tween(Math.max(roughDistance * 0.01, 0.2), function (e) {
      config.lat = startLat + dLat * e;
      config.lng = clampLng(startLng + dLng * e);
    }, function () {
      activeTween = tween(1, function (e) {
        config.zoom = startZoom + (1 - startZoom) * e;
      }, function () {
        isTweening = false;
        activeTween = null;
      });
    });
  }

  /* ---------- globe construction ---------- */

  function regenerateGlobe() {
    var dom, domStyle, x, y;
    globeDoms = [];
    while ((dom = globeContainer.firstChild)) {
      globeContainer.removeChild(dom);
    }

    var segX = config.segX;
    var segY = config.segY;
    var diffuseBg = 'url(' + URLS.diffuse + ')';
    var segWidth = (1600 / segX) | 0;
    var segHeight = (800 / segY) | 0;
    var radius = 536 / 2;

    var phiStart = 0;
    var phiLength = Math.PI * 2;
    var thetaStart = 0;
    var thetaLength = Math.PI;

    vertices = [];

    for (y = 0; y <= segY; y++) {
      var verticesRow = [];
      for (x = 0; x <= segX; x++) {
        var u = x / segX;
        var v = 0.05 + (y / segY) * (1 - 0.1);
        verticesRow.push({
          x: -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
          y: -radius * Math.cos(thetaStart + v * thetaLength),
          z: radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
          phi: phiStart + u * phiLength,
          theta: thetaStart + v * thetaLength
        });
      }
      vertices.push(verticesRow);
    }

    for (y = 0; y < segY; y++) {
      for (x = 0; x < segX; x++) {
        dom = document.createElement('div');
        domStyle = dom.style;
        domStyle.position = 'absolute';
        domStyle.width = segWidth + 'px';
        domStyle.height = segHeight + 'px';
        domStyle.overflow = 'hidden';
        domStyle[PerspectiveTransform.transformOriginStyleName] = '0 0';
        domStyle.backgroundImage = diffuseBg;
        domStyle.backgroundPosition = (-segWidth * x) + 'px ' + (-segHeight * y) + 'px';
        dom.perspectiveTransform = new PerspectiveTransform(dom, segWidth, segHeight);
        dom.topLeft = vertices[y][x];
        dom.topRight = vertices[y][x + 1];
        dom.bottomLeft = vertices[y + 1][x];
        dom.bottomRight = vertices[y + 1][x + 1];
        globeContainer.appendChild(dom);
        globeDoms.push(dom);
      }
    }
  }

  /* ---------- rendering ---------- */

  function rotate(vertex, x, y, z) {
    var x0 = x * cosRY - z * sinRY;
    var z0 = z * cosRY + x * sinRY;
    var y0 = y * cosRX - z0 * sinRX;
    z0 = z0 * cosRX + y * sinRX;

    var offset = 1 + z0 / 4000;
    var x1 = x0 * cosRZ - y0 * sinRZ;
    y0 = y0 * cosRZ + x0 * sinRZ;

    vertex.px = x1 * offset;
    vertex.py = y0 * offset;
  }

  // Pushes the edges of each tile outward a little so no seams show between tiles.
  function expand(v1, v2) {
    var x = v2.px - v1.px;
    var y = v2.py - v1.py;
    var det = x * x + y * y;

    if (det === 0) {
      v1.tx = v1.px; v1.ty = v1.py;
      v2.tx = v2.px; v2.ty = v2.py;
      return;
    }

    var idet = pixelExpandOffset / Math.sqrt(det);
    x *= idet;
    y *= idet;

    v2.tx = v2.px + x;
    v2.ty = v2.py + y;
    v1.tx = v1.px - x;
    v1.ty = v1.py - y;
  }

  function transformGlobe() {
    var x, y, i, len, dom, pt, v1, v2, v3, v4;

    tick ^= 1;
    if (tick) {
      sinRY = Math.sin(rY);
      sinRX = Math.sin(-rX);
      sinRZ = Math.sin(rZ);
      cosRY = Math.cos(rY);
      cosRX = Math.cos(-rX);
      cosRZ = Math.cos(rZ);

      var segX = config.segX;
      var segY = config.segY;

      for (y = 0; y <= segY; y++) {
        var row = vertices[y];
        for (x = 0; x <= segX; x++) {
          var vertex = row[x];
          rotate(vertex, vertex.x, vertex.y, vertex.z);
        }
      }

      for (y = 0; y < segY; y++) {
        for (x = 0; x < segX; x++) {
          dom = globeDoms[x + segX * y];

          v1 = dom.topLeft;
          v2 = dom.topRight;
          v3 = dom.bottomLeft;
          v4 = dom.bottomRight;

          expand(v1, v2);
          expand(v2, v3);
          expand(v3, v4);
          expand(v4, v1);

          pt = dom.perspectiveTransform;
          pt.topLeft.x = v1.tx;     pt.topLeft.y = v1.ty;
          pt.topRight.x = v2.tx;    pt.topRight.y = v2.ty;
          pt.bottomLeft.x = v3.tx;  pt.bottomLeft.y = v3.ty;
          pt.bottomRight.x = v4.tx; pt.bottomRight.y = v4.ty;

          pt.hasError = pt.checkError();
          if (!pt.hasError) {
            pt.calc();
          }
        }
      }
    } else {
      for (i = 0, len = globeDoms.length; i < len; i++) {
        pt = globeDoms[i].perspectiveTransform;
        if (!pt.hasError) {
          pt.update();
        } else {
          pt.style[transformStyleName] = 'translate3d(-8192px, 0, 0)';
        }
      }
    }
  }

  function render() {
    if (config.autoSpin && !isMouseDown && !isTweening) {
      config.lng = clampLng(config.lng - 0.2);
    }

    rX = (config.lat / 180) * Math.PI;
    rY = ((clampLng(config.lng) - 270) / 180) * Math.PI;

    globePole.style.display = config.isPoleVisible ? 'block' : 'none';
    globeHalo.style.display = config.isHaloVisible ? 'block' : 'none';

    var ratio = Math.pow(config.zoom, 1.5);
    pixelExpandOffset = 1.5 + ratio * -1.25;
    ratio = 1 + ratio * 3;
    globe.style[transformStyleName] = 'scale3d(' + ratio + ',' + ratio + ',1)';
    ratio = 1 + Math.pow(config.zoom, 3) * 0.3;
    worldBg.style[transformStyleName] = 'scale3d(' + ratio + ',' + ratio + ',1)';

    transformGlobe();
  }

  function loop() {
    requestAnimationFrame(loop);
    render();
  }

  /* ---------- interaction ---------- */

  function onPointerDown(evt) {
    if (activeTween) {
      activeTween.cancel();
      activeTween = null;
      isTweening = false;
    }
    isMouseDown = true;
    dragX = evt.clientX;
    dragY = evt.clientY;
    dragLat = config.lat;
    dragLng = config.lng;
    world.classList.add('dragging');
    if (world.setPointerCapture) {
      try { world.setPointerCapture(evt.pointerId); } catch (e) { /* ignore */ }
    }
  }

  function onPointerMove(evt) {
    if (!isMouseDown) return;
    var dX = evt.clientX - dragX;
    var dY = evt.clientY - dragY;
    config.lat = clamp(dragLat + dY * 0.5, -90, 90);
    config.lng = clampLng(dragLng - dX * 0.5);
  }

  function onPointerUp() {
    isMouseDown = false;
    world.classList.remove('dragging');
  }

  function onWheel(evt) {
    evt.preventDefault();
    config.zoom = clamp(config.zoom - evt.deltaY * 0.001, 0, 1);
  }

  /* ---------- init ---------- */

  function init() {
    world = document.querySelector('.world');
    worldBg = document.querySelector('.world-bg');
    globe = document.querySelector('.world-globe');
    globeContainer = document.querySelector('.world-globe-doms-container');
    globePole = document.querySelector('.world-globe-pole');
    globeHalo = document.querySelector('.world-globe-halo');

    worldBg.style.backgroundImage = 'url(' + URLS.bg + ')';
    globeHalo.style.backgroundImage = 'url(' + URLS.halo + ')';

    regenerateGlobe();

    world.addEventListener('dragstart', function (e) { e.preventDefault(); });
    world.addEventListener('pointerdown', onPointerDown);
    world.addEventListener('pointermove', onPointerMove);
    world.addEventListener('pointerup', onPointerUp);
    world.addEventListener('pointercancel', onPointerUp);
    world.addEventListener('wheel', onWheel, { passive: false });

    // Handy for future changes: GlobeApp.goTo(22.28552, 114.15769)
    window.GlobeApp = { config: config, goTo: goTo };

    loop();
  }

  // Make sure the textures exist before building the globe
  Promise.all([
    loadImage(URLS.diffuse),
    loadImage(URLS.bg).catch(function (u) { return { missing: u }; }),
    loadImage(URLS.halo).catch(function (u) { return { missing: u }; })
  ]).then(function (results) {
    var missing = results.filter(function (r) { return r && r.missing; }).map(function (r) { return r.missing; });
    init();
    if (missing.length) {
      showMessage('Some optional images are missing:<br><code>' + missing.join('<br>') + '</code>');
    }
  }).catch(function (url) {
    showMessage('Could not load <code>' + url + '</code>.<br>Add the globe images to the <code>assets/</code> folder (see README.md).');
  });
})();
