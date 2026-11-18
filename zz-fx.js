/* ZZ Games — motion layer. Pairs with zz-fx.css. Loaded last on every page.
   1. Floating dock (tightens on scroll) + the gliding tab pill
   2. Pointer light + card tilt
   3. Press ripple on buttons
   4. Scroll reveals: things cascade in as they enter the screen
   5. Live backdrop: drifting light, a grid with depth, twinkles, click ripples
   Nothing here changes how the site works. Respects "Reduce animations"
   (site setting) and the device's reduced-motion setting. */
(function () {
  "use strict";
  var root = document.documentElement, body = document.body;
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("zz-settings")) || {}; } catch (e) {}
  if (saved.reduceMotion) root.classList.add("reduce-motion");
  var mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var calm = function () { return mq.matches || root.classList.contains("reduce-motion"); };
  var isPlay = body.classList.contains("play-page");
  root.classList.add("fx");

  /* ---------- 1. Dock + pill ---------- */
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

  // Movies / TV share one page: light up the right tab
  if (body.classList.contains("watch-page")) {
    var kind = new URLSearchParams(location.search).get("type") === "tv" ? "tv" : "movies";
    var tab = document.querySelector('.zz-links a[data-ch="' + kind + '"]');
    if (tab) { tab.classList.add("on"); tab.setAttribute("aria-current", "page"); }
  }

  var links = document.querySelector(".zz-links, .m-links");
  if (bar && links) {
    var tabs = [].slice.call(links.querySelectorAll("a"));
    var pill = bar.querySelector(".fx-pill");
    if (!pill) {
      pill = document.createElement("span");
      pill.className = "fx-pill"; pill.setAttribute("aria-hidden", "true");
      bar.insertBefore(pill, links);
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
        // reach across to cover both tabs, then let go of the old one
        var l = Math.min(x, pos.x), rt = Math.max(x + r.width, pos.x + pos.w);
        pill.classList.add("fx-reach"); set(l, rt - l); pill.style.opacity = 1;
        stretchT = setTimeout(function () { pill.classList.remove("fx-reach"); set(x, r.width); }, 160);
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

  /* ---------- 2. Pointer light + card tilt ---------- */
  var mouse = { x: innerWidth / 2, y: innerHeight * .3, on: false };
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
    if (!calm() && t.classList.contains("card") && !body.classList.contains("music")) {
      var k = 8;
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

  /* ---------- 3. Press ripple ---------- */
  document.addEventListener("pointerdown", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".btn") : null;
    if (!b || b.disabled || calm()) return;
    var r = b.getBoundingClientRect();
    b.style.setProperty("--px", (e.clientX - r.left) + "px");
    b.style.setProperty("--py", (e.clientY - r.top) + "px");
    b.classList.remove("fx-press"); void b.offsetWidth; b.classList.add("fx-press");
    setTimeout(function () { b.classList.remove("fx-press"); }, 650);
  }, { passive: true });

  /* ---------- 4. Scroll reveals ----------
     Items already on screen cascade in. Items below wait (hidden) and rise
     in as they scroll into view, a few at a time. Classes are removed once
     the motion ends so hover effects stay snappy. */
  var ITEMS = ".grid > *, .related-grid > *, .cast-grid > *, .gamble-grid > *";
  var BLOCKS = ".row-wrap, .watch-section:not(#browseWrap), .mine";
  var STEP = 32, MAX_DELAY = 520;
  var tidy = function (el, ms) {
    setTimeout(function () { el.classList.remove("fx-cascade", "fx-show", "fx-wait"); el.style.removeProperty("--d"); }, ms);
  };
  var inView = function (el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight * .96 && r.width > 0;
  };
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; io.unobserve(el);
      var d = Math.min(n++ * STEP, MAX_DELAY);
      el.style.setProperty("--d", d);
      el.classList.add("fx-show"); el.classList.remove("fx-wait");
      tidy(el, d + 800);
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: .06 }) : null;

  function reveal(list) {
    if (calm() || isPlay || !list.length) return;
    var n = 0;
    list.forEach(function (el) {
      if (el.nodeType !== 1 || el.__fx) return;
      el.__fx = 1;
      if (inView(el) || !io) {
        var d = Math.min(n++ * STEP, MAX_DELAY);
        el.style.setProperty("--d", d);
        el.classList.add("fx-cascade");
        tidy(el, d + 700);
      } else {
        el.classList.add("fx-wait");
        io.observe(el);
      }
    });
  }
  reveal([].slice.call(document.querySelectorAll(ITEMS + "," + BLOCKS)));
  if (!body.classList.contains("music")) {
    new MutationObserver(function (muts) {
      var added = [];
      muts.forEach(function (m) {
        [].forEach.call(m.addedNodes, function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches(ITEMS) || node.matches(BLOCKS)) added.push(node);
        });
      });
      if (added.length) reveal(added);
    }).observe(body, { childList: true, subtree: true });
  }
  // safety: never leave anything hidden (e.g. a box scrolled sideways)
  addEventListener("load", function () {
    setTimeout(function () {
      document.querySelectorAll(".fx-wait").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) { el.classList.add("fx-show"); el.classList.remove("fx-wait"); tidy(el, 800); }
      });
    }, 1500);
  });

  /* ---------- 5. Live backdrop ----------
     A blue grid that drifts with the page (slower than the content, so it
     has depth), soft light that slowly wanders behind it, lines that light
     up around the pointer, a few twinkling crossings, and a ring of light
     that runs across the grid when you click. Never on the play page. */
  if (isPlay || mq.matches) return;
  var cv = document.createElement("canvas");
  cv.className = "fx-bg"; cv.setAttribute("aria-hidden", "true");
  body.insertBefore(cv, body.firstChild);
  var ctx = cv.getContext("2d");
  if (!ctx) return;
  var CELL = 56, PARALLAX = .45;
  var W = 0, H = 0, dpr = 1, gx = mouse.x, gy = mouse.y, t0 = performance.now(), running = false, lastDraw = 0;
  var stars = [], rings = [];
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var blobs = [
    { c: "36,102,255", a: .16, r: .55, sx: .00011, sy: .00007, px: .5, py: .05, ax: .28, ay: .08 },
    { c: "90,70,255",  a: .10, r: .45, sx: .00008, sy: .00012, px: .2, py: .25, ax: .18, ay: .12 },
    { c: "56,214,255", a: .07, r: .40, sx: .00013, sy: .00009, px: .82, py: .3, ax: .14, ay: .14 }
  ];
  function newStar() { return { c: (Math.random() * 40) | 0, r: (Math.random() * 16) | 0, t: 0, d: rnd(90, 200), wait: (Math.random() * 240) | 0 }; }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var ns = W < 700 ? 6 : 14;
    while (stars.length < ns) stars.push(newStar()); stars.length = ns;
  }
  function gridPath(ox, oy) {
    ctx.beginPath();
    for (var x = ox; x <= W; x += CELL) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
    for (var y = oy; y <= H; y += CELL) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
  }
  // grid brightness by depth down the page: strongest behind the top, never fully gone
  var lineAlpha = function (docY) { return .06 + .17 * Math.max(0, 1 - docY / 1100); };

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (now - lastDraw < 31) return;          // ~30fps is plenty for a backdrop
    if (body.classList.contains("games-overlay")) return;   // Music page hidden behind another page
    lastDraw = now;
    var t = now - t0;
    var sy = (window.scrollY || 0) * PARALLAX;
    var ox = ((W / 2) % CELL + CELL) % CELL, oy = ((-sy) % CELL + CELL) % CELL;
    var fadeTop = Math.max(0, 1 - (window.scrollY || 0) / 1400);
    ctx.clearRect(0, 0, W, H);

    // drifting light
    ctx.globalCompositeOperation = "lighter";
    for (var b = 0; b < blobs.length; b++) {
      var B = blobs[b];
      var bx = W * (B.px + Math.sin(t * B.sx + b) * B.ax), by = H * (B.py + Math.cos(t * B.sy + b * 2) * B.ay) - (window.scrollY || 0) * .15;
      var br = Math.max(W, 700) * B.r;
      var bg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      bg.addColorStop(0, "rgba(" + B.c + "," + (B.a * (.45 + .55 * fadeTop)).toFixed(3) + ")");
      bg.addColorStop(1, "rgba(" + B.c + ",0)");
      ctx.fillStyle = bg; ctx.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    // soft light that trails the pointer
    gx += (mouse.x - gx) * .08; gy += (mouse.y - gy) * .08;
    var pg0 = ctx.createRadialGradient(gx, gy, 0, gx, gy, 360);
    pg0.addColorStop(0, "rgba(47,110,255," + (mouse.on ? .09 : .04) + ")");
    pg0.addColorStop(1, "rgba(47,110,255,0)");
    ctx.fillStyle = pg0; ctx.fillRect(gx - 360, gy - 360, 720, 720);
    ctx.globalCompositeOperation = "source-over";

    // the grid
    ctx.lineWidth = 1;
    var lg = ctx.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, "rgba(70,125,255," + lineAlpha(sy).toFixed(3) + ")");
    lg.addColorStop(1, "rgba(70,125,255," + lineAlpha(sy + H).toFixed(3) + ")");
    gridPath(ox, oy); ctx.strokeStyle = lg; ctx.stroke();

    // lines light up around the pointer
    if (mouse.on) {
      var pg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 240);
      pg.addColorStop(0, "rgba(140,190,255,.55)"); pg.addColorStop(1, "rgba(140,190,255,0)");
      ctx.strokeStyle = pg; ctx.stroke();
    }

    // rings of light from clicks
    for (var i = rings.length - 1; i >= 0; i--) {
      var R = rings[i]; R.r += 9 + R.r * .02; R.a *= .965;
      if (R.a < .02 || R.r > Math.max(W, H) * 1.2) { rings.splice(i, 1); continue; }
      var inner = Math.max(0, R.r - 70);
      var rg = ctx.createRadialGradient(R.x, R.y, inner, R.x, R.y, R.r);
      rg.addColorStop(0, "rgba(120,190,255,0)");
      rg.addColorStop(.75, "rgba(140,205,255," + R.a.toFixed(3) + ")");
      rg.addColorStop(1, "rgba(140,205,255,0)");
      ctx.strokeStyle = rg; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
    }

    // twinkling crossings near the top of the page
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      if (st.wait > 0) { st.wait--; continue; }
      if (++st.t > st.d) { stars[s] = newStar(); continue; }
      var sxp = ox + st.c * CELL + .5, syp = oy + st.r * CELL + .5;   // locked to a crossing on screen
      if (sxp > W || syp > H) continue;
      var env = Math.sin(Math.PI * st.t / st.d);
      var depth = Math.max(.2, 1 - (syp + sy) / 900);
      var al = env * depth;
      if (al < .02) continue;
      var sg = ctx.createRadialGradient(sxp, syp, 0, sxp, syp, 16);
      sg.addColorStop(0, "rgba(170,215,255," + (.55 * al).toFixed(3) + ")");
      sg.addColorStop(1, "rgba(170,215,255,0)");
      ctx.fillStyle = sg; ctx.fillRect(sxp - 16, syp - 16, 32, 32);
      ctx.fillStyle = "rgba(225,240,255," + (.9 * al).toFixed(3) + ")";
      ctx.fillRect(sxp - 1, syp - 1, 2, 2);
    }
  }
  function sync() {
    var want = !document.hidden && !calm();
    if (want && !running) { running = true; lastDraw = 0; requestAnimationFrame(frame); }
    else if (!want && running) { running = false; ctx.clearRect(0, 0, W, H); }
    root.classList.toggle("fx-live", !calm());
  }
  size(); sync();
  addEventListener("resize", size);
  document.addEventListener("visibilitychange", sync);
  if (mq.addEventListener) mq.addEventListener("change", sync);
  document.addEventListener("pointerdown", function (e) {
    if (!running) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    rings.push({ x: e.clientX, y: e.clientY, r: 4, a: .7 });
    if (rings.length > 4) rings.shift();
  }, { passive: true });
  new MutationObserver(function () {
    var was = root.classList.contains("fx-live"), now = !calm();
    if (was !== now || (now && !running && !document.hidden)) sync();
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
})();
