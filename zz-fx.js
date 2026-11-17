/* ZZ Games polish layer: ambient background, pointer light, card tilt,
   cascading entrances and press ripples. Pairs with zz-fx.css.
   Nothing here changes how the site works; delete both files to switch it off. */
(function () {
  "use strict";
  var root = document.documentElement, body = document.body;
  var S = {};
  try { S = JSON.parse(localStorage.getItem("zz-settings")) || {}; } catch (e) {}
  if (S.reduceMotion) root.classList.add("reduce-motion");
  var sysReduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var calm = function () { return sysReduce || root.classList.contains("reduce-motion"); };
  root.classList.add("fx");
  var isPlay = body.classList.contains("play-page");

  /* ---- Top bar: a floating dock that tightens once the page scrolls ---- */
  var bar = document.querySelector(".topbar, .m-nav");
  if (bar) {
    var tight = false;
    var space = function () { if (!tight) root.style.setProperty("--fx-bar-space", (bar.offsetHeight + 24) + "px"); };
    var onScroll = function () {
      var y = window.scrollY, next = tight ? y > 6 : y > 28;   // two thresholds so it never flickers
      if (next !== tight) { tight = next; bar.classList.toggle("fx-scrolled", tight); }
    };
    space(); onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", space);
  }

  /* ---- Movies / TV: underline the tab you are on, the way Music and Games do ---- */
  if (body.classList.contains("watch-page")) {
    var kind = new URLSearchParams(location.search).get("type") === "tv" ? "tv" : "movies";
    var tab = document.querySelector('.zz-links a[data-ch="' + kind + '"]');
    if (tab) { tab.classList.add("on"); tab.setAttribute("aria-current", "page"); }
  }

  /* ---- The pill: glides to the tab under the pointer, returns to the current tab ---- */
  var links = document.querySelector(".zz-links, .m-links");
  if (bar && links) {
    var tabs = [].slice.call(links.querySelectorAll("a"));
    var pill = bar.querySelector(".fx-pill");   // already in the page so it is there for the very first frame
    if (!pill) {
      pill = document.createElement("span");
      pill.className = "fx-pill"; pill.setAttribute("aria-hidden", "true");
      bar.insertBefore(pill, links);          // sits under the labels, not inside them
    }
    var here = function () { return links.querySelector("a.on"); };
    var at = null, pos = null, stretchT = 0;
    var place = function (a, instant) {
      at = a || null;
      tabs.forEach(function (t) { t.classList.toggle("fx-lit", t === a); });
      if (!a) { pill.style.opacity = 0; return; }
      var r = a.getBoundingClientRect(), b = bar.getBoundingClientRect();
      var x = r.left - b.left - bar.clientLeft, y = r.top - b.top - bar.clientTop;
      var set = function (px, w) {
        pill.style.width = w + "px"; pill.style.height = r.height + "px";
        pill.style.transform = "translate(" + px + "px," + y + "px)";
      };
      clearTimeout(stretchT);
      pill.classList.toggle("fx-peek", a !== here());
      if (instant || calm() || pos === null || pill.style.opacity === "0" || Math.abs(x - pos.x) < 2) {
        if (instant) pill.style.transition = "none";
        set(x, r.width); pill.style.opacity = 1;
        if (instant) { void pill.offsetWidth; pill.style.transition = ""; }
      } else {
        // stretch: reach out to cover both tabs, then let go of the old one
        var l = Math.min(x, pos.x), rt = Math.max(x + r.width, pos.x + pos.w);
        pill.classList.add("fx-reach"); set(l, rt - l); pill.style.opacity = 1;
        stretchT = setTimeout(function () { pill.classList.remove("fx-reach"); set(x, r.width); }, 150);
      }
      pos = { x: x, w: r.width };
    };
    var home = function () { pill.classList.remove("fx-squish"); place(here()); };
    tabs.forEach(function (a) {
      a.addEventListener("pointerenter", function () { place(a); });
      a.addEventListener("focus", function () { place(a); });
      a.addEventListener("pointerdown", function () { place(a); pill.classList.add("fx-squish"); });
      a.addEventListener("pointerup", function () { pill.classList.remove("fx-squish"); });
    });
    links.addEventListener("pointerleave", home);
    links.addEventListener("focusout", function (e) { if (!links.contains(e.relatedTarget)) home(); });
    var settle = function () { place(at || here(), true); };
    settle();
    addEventListener("resize", settle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
    if ("ResizeObserver" in window) new ResizeObserver(settle).observe(bar);
    addEventListener("pageshow", function () { at = null; pill.classList.remove("fx-squish"); settle(); });
  }

  /* ---- Pointer light + card tilt (one listener for the whole page) ---- */
  var LIGHT = ".card, .zz-panel, .m-panel, .related-card, .cw-card, .spot-main, .watch-hero";
  var pend = null, raf = 0, last = null;
  function clearTilt(el) { if (el) { el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); } }
  function apply() {
    raf = 0;
    var e = pend, t = e.target && e.target.closest ? e.target.closest(LIGHT) : null;
    if (last && last !== t) clearTilt(last);
    last = t;
    if (!t) return;
    var r = t.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    t.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    t.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    if (!calm() && t.classList.contains("card")) {
      var k = t.classList.contains("big") ? 3 : 7;
      t.style.setProperty("--ry", ((x - .5) * k).toFixed(2) + "deg");
      t.style.setProperty("--rx", ((.5 - y) * k).toFixed(2) + "deg");
    }
  }
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    pend = e; mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: true });
  document.addEventListener("pointerleave", function () { clearTilt(last); last = null; mouse.on = false; });

  /* ---- Press ripple on buttons ---- */
  document.addEventListener("pointerdown", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".btn") : null;
    if (!b || b.disabled || calm()) return;
    var r = b.getBoundingClientRect();
    b.style.setProperty("--px", (e.clientX - r.left) + "px");
    b.style.setProperty("--py", (e.clientY - r.top) + "px");
    b.classList.remove("fx-press"); void b.offsetWidth; b.classList.add("fx-press");
    setTimeout(function () { b.classList.remove("fx-press"); }, 600);
  }, { passive: true });

  /* ---- Cascade: number the items in grids and rails so they arrive one after another ---- */
  var BOXES = ".grid, .rail, .related-grid, .cast-grid, .cw-grid";
  function number(box) {
    var kids = box.children;
    for (var i = 0; i < kids.length; i++) kids[i].style.setProperty("--i", Math.min(i, 14));
  }
  if (!body.classList.contains("music")) {
    document.querySelectorAll(BOXES).forEach(number);
    new MutationObserver(function (list) {
      var seen = [];
      for (var i = 0; i < list.length; i++) {
        var t = list[i].target;
        if (t.nodeType === 1 && seen.indexOf(t) < 0 && t.matches(BOXES)) { seen.push(t); number(t); }
      }
    }).observe(body, { childList: true, subtree: true });
  }

  /* ---- Sections rise as they scroll into view (they are never hidden while waiting) ---- */
  if ("IntersectionObserver" in window && !isPlay) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        if (en.boundingClientRect.top > innerHeight * .55) en.target.classList.add("fx-in");
      });
    }, { threshold: .08 });
    document.querySelectorAll(".row-wrap, .watch-section, .mine, .foot").forEach(function (el) { io.observe(el); });
  }

  /* ---- Live background: a blue grid that scrolls with the page. Lines brighten near the
          pointer, pulses of light run along them, and a few cells glow and fade.
          Never runs on the play page, so games keep every frame. ---- */
  var mouse = { x: innerWidth / 2, y: innerHeight * .3, on: false };
  if (isPlay || sysReduce) return;
  var cv = document.createElement("canvas");
  cv.className = "fx-bg"; cv.setAttribute("aria-hidden", "true");
  body.insertBefore(cv, body.firstChild);
  var ctx = cv.getContext("2d");
  if (!ctx) return;
  var CELL = 56, W = 0, H = 0, dpr = 1, gx = mouse.x, gy = mouse.y, tick = 0, running = false;
  var pulses = [], cells = [];
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  // Grid brightness by distance down the page: strongest behind the top, never fully gone
  var lineAlpha = function (docY) { return .075 + .2 * Math.max(0, 1 - docY / 1100); };
  function newPulse() {
    var horiz = Math.random() < .5, cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
    var fwd = Math.random() < .5;
    return {
      h: horiz, k: (Math.random() * (horiz ? rows : cols)) | 0,
      p: fwd ? -90 : (horiz ? W : H) + 90, v: rnd(3.5, 7) * (fwd ? 1 : -1), len: rnd(60, 120), wait: (Math.random() * 90) | 0
    };
  }
  function newCell() {
    return { c: (Math.random() * Math.ceil(W / CELL)) | 0, r: (Math.random() * Math.ceil(Math.min(H, 700) / CELL)) | 0, t: 0, d: rnd(50, 110), wait: (Math.random() * 120) | 0 };
  }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var np = W < 700 ? 3 : 6, nc = W < 700 ? 4 : 9;
    while (pulses.length < np) pulses.push(newPulse()); pulses.length = np;
    while (cells.length < nc) cells.push(newCell()); cells.length = nc;
  }
  function gridPath(ox, oy) {
    ctx.beginPath();
    for (var x = ox; x <= W; x += CELL) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
    for (var y = oy; y <= H; y += CELL) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
  }
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    if (++tick % 2) return;              // 30fps is plenty for a backdrop
    var sy = window.scrollY || 0;
    var ox = ((W / 2) % CELL + CELL) % CELL, oy = ((-sy) % CELL + CELL) % CELL;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;

    // soft light that trails the pointer
    gx += (mouse.x - gx) * .08; gy += (mouse.y - gy) * .08;
    var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 380);
    g.addColorStop(0, "rgba(47,110,255," + (mouse.on ? .1 : .05) + ")");
    g.addColorStop(1, "rgba(47,110,255,0)");
    ctx.fillStyle = g; ctx.fillRect(gx - 380, gy - 380, 760, 760);

    // glowing cells (top part of the page only)
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (c.wait > 0) { c.wait--; continue; }
      c.t++;
      if (c.t > c.d) { cells[i] = newCell(); continue; }
      var cyDoc = c.r * CELL, cy = cyDoc - sy + ((sy % CELL) + oy) % CELL;   // keep cells locked to the grid
      var cyv = oy + Math.round((cyDoc - sy - oy) / CELL) * CELL;
      if (cyv < -CELL || cyv > H) continue;
      var env = Math.sin(Math.PI * c.t / c.d);
      ctx.fillStyle = "rgba(70,130,255," + (.16 * env * Math.max(.25, 1 - (cyv + sy) / 800)).toFixed(3) + ")";
      ctx.fillRect(ox + (c.c - 1) * CELL + 1, cyv + 1, CELL - 1, CELL - 1);
    }

    // the grid itself, brighter toward the top of the page
    var lg = ctx.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, "rgba(70,125,255," + lineAlpha(sy).toFixed(3) + ")");
    lg.addColorStop(1, "rgba(70,125,255," + lineAlpha(sy + H).toFixed(3) + ")");
    gridPath(ox, oy); ctx.strokeStyle = lg; ctx.stroke();

    // lines light up around the pointer
    if (mouse.on) {
      var pg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 250);
      pg.addColorStop(0, "rgba(130,185,255,.6)"); pg.addColorStop(1, "rgba(130,185,255,0)");
      ctx.strokeStyle = pg; ctx.stroke();
    }

    // pulses running along the lines
    for (var n = 0; n < pulses.length; n++) {
      var p = pulses[n];
      if (p.wait > 0) { p.wait--; continue; }
      p.p += p.v;
      var span = p.h ? W : H;
      if (p.p < -140 || p.p > span + 140) { pulses[n] = newPulse(); continue; }
      var fix = (p.h ? oy : ox) + p.k * CELL + .5, tail = p.p - p.len * (p.v > 0 ? 1 : -1);
      var x1 = p.h ? tail : fix, y1 = p.h ? fix : tail, x2 = p.h ? p.p : fix, y2 = p.h ? fix : p.p;
      var fade = p.h ? Math.max(.3, 1 - (fix + sy) / 1200) : 1;
      var sg = ctx.createLinearGradient(x1, y1, x2, y2);
      sg.addColorStop(0, "rgba(120,180,255,0)"); sg.addColorStop(1, "rgba(165,210,255," + (.85 * fade).toFixed(3) + ")");
      ctx.strokeStyle = sg; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = "rgba(200,228,255," + (.9 * fade).toFixed(3) + ")";
      ctx.fillRect(x2 - 1.5, y2 - 1.5, 3, 3);
      ctx.lineWidth = 1;
    }
  }
  function sync() {
    var want = !document.hidden && !calm();
    if (want && !running) { running = true; requestAnimationFrame(frame); }
    else if (!want && running) { running = false; ctx.clearRect(0, 0, W, H); }
    root.classList.toggle("fx-live", !calm());   // the still CSS grid steps aside while this one runs
  }
  size(); sync();
  addEventListener("resize", size);
  document.addEventListener("visibilitychange", sync);
  new MutationObserver(function (list) {
    // only react to the reduce-motion switch, not to our own class changes
    var was = root.classList.contains("fx-live"), now = !calm();
    if (was !== now || (now && !running && !document.hidden)) sync();
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
})();
