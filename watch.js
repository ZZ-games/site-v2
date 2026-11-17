// Watch page — CineSrc player with overlay, resume, failover
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var mediaType = params.get("type");
  var tmdbId = params.get("id");

  // Validate. id=popular opens the browse grid; anything else non-numeric bounces home.
  if (!mediaType || !tmdbId || !/^(movie|tv)$/.test(mediaType)) {
    location.href = "index.html";
    return;
  }
  var isBrowse = tmdbId === "popular";
  if (!isBrowse && !/^\d+$/.test(tmdbId)) {
    location.href = "index.html";
    return;
  }

  var $ = function (s) { return document.getElementById(s); };
  var loadingEl = $("watchLoading");
  var errorEl = $("watchError");
  var contentEl = $("watchContent");
  var overlay = $("watchOverlay");
  var frame = $("watchFrame");
  var overlayLoading = overlay.querySelector(".overlay-loading");
  var overlayError = $("overlayError");

  // State
  var meta = null;
  var currentSeason = 1;
  var currentEpisode = 1;
  var currentSourceIndex = 0;
  var currentSourceOrigin = "";
  var failoverCount = 0;
  var MAX_FAILOVER = 3;
  var lastSaveTime = 0;
  var SAVE_THROTTLE = 5000;
  var overlayOpen = false;
  var triggerEl = null;

  // ---- TMDB Fetch ----
  if (isBrowse) {
    renderBrowse();
  } else {
    var appendExtra = mediaType === "movie"
      ? "?append_to_response=credits,recommendations"
      : "?append_to_response=credits,recommendations";

    tmdbFetch("/" + mediaType + "/" + tmdbId + appendExtra)
      .then(function (data) {
        meta = data;
        renderPage();
        loadingEl.hidden = true;
        contentEl.hidden = false;
      })
      .catch(function () {
        loadingEl.hidden = true;
        errorEl.hidden = false;
      });
  }

  // ---- Popular browse grid (watch.html?type=movie|tv&id=popular) ----
  function renderBrowse() {
    document.title = "ZZ Classroom";
    var label = mediaType === "movie" ? "Popular movies" : "Popular TV shows";
    var md = document.querySelector('meta[name="description"]');
    if (md) md.content = label + " — stream free on ZZ Games.";

    // Channel banner: MOVIES image for the movies tab, gradient TV wordmark for TV
    if (mediaType === "movie") {
      var banner = $("channelBanner");
      banner.src = "banner-movies.png?v=202611164";
      banner.alt = "Movies";
      banner.hidden = false;
    } else {
      var wm = $("channelWordmark");
      wm.textContent = "TV";
      wm.hidden = false;
    }
    $("browseTitle").textContent = "Popular now";
    var tagEl = $("channelTag");
    if (tagEl) tagEl.textContent = mediaType === "movie" ? "Movie night without leaving the tab." : "Shows to binge between rounds.";
    $("browseQ").placeholder = mediaType === "movie" ? "Search movies" : "Search TV shows";
    $("watchHero").hidden = true;

    var popularItems = null;
    var searchTok = 0;
    var debounceT = null;
    var searchInput = $("browseQ");

    loadPopular();

    // ---- Movie / TV search ----
    searchInput.addEventListener("input", function () {
      clearTimeout(debounceT);
      var q = searchInput.value.trim();
      if (!q) { runSearch(""); return; } // cleared: straight back to popular
      debounceT = setTimeout(function () { runSearch(q); }, 350);
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { searchInput.value = ""; runSearch(""); searchInput.blur(); }
      if (e.key === "Enter") e.preventDefault();
    });
    // "/" focuses the search, like the games page
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || overlayOpen) return;
      var t = document.activeElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if ($("browseWrap").hidden) return;
      e.preventDefault();
      searchInput.focus();
    });

    function paint(items, q) {
      var grid = $("browseGrid");
      if (!items.length) {
        grid.innerHTML = "";
        var be = $("browseEmpty");
        be.textContent = q ? 'No results for "' + q + '".' : "Nothing here right now.";
        be.hidden = false;
        return;
      }
      $("browseEmpty").hidden = true;
      grid.innerHTML = items.map(function (r) {
        var poster = r.poster_path ? tmdbPoster(r.poster_path, "w342") : "";
        var rTitle = r.title || r.name || "";
        return '<a class="related-card" href="watch.html?type=' + mediaType + '&id=' + r.id + '">' +
          (poster ? '<img class="related-poster" src="' + poster + '" alt="" loading="lazy">' : '<div class="related-poster"></div>') +
          '<div class="related-name">' + esc(rTitle) + '</div></a>';
      }).join("");
    }

    function runSearch(q) {
      var tok = ++searchTok;
      if (!q) {
        $("browseTitle").textContent = "Popular now";
        if (popularItems) paint(popularItems, "");
        else loadPopular();
        return;
      }
      $("browseTitle").textContent = "Results";
      $("browseEmpty").hidden = true;
      $("browseGrid").innerHTML = '<div class="browse-loading"><div class="spinner"></div></div>';
      tmdbFetch("/search/" + mediaType + "?query=" + encodeURIComponent(q) + "&include_adult=false")
        .then(function (data) {
          if (tok !== searchTok) return;
          paint((data.results || []).filter(function (r) { return r.title || r.name; }), q);
        })
        .catch(function () {
          if (tok !== searchTok) return;
          paint([], q);
        });
    }

    function loadPopular() {
      $("browseEmpty").hidden = true;
      $("browseGrid").innerHTML = '<div class="browse-loading"><div class="spinner"></div></div>';
      // Two pages of results for a fuller grid
      Promise.all([1, 2].map(function (page) {
        return tmdbFetch("/" + mediaType + "/popular?page=" + page);
      }))
        .then(function (pages) {
          var items = [];
          pages.forEach(function (pg) { items = items.concat(pg.results || []); });
          items = items.filter(function (r) { return r.poster_path && (r.title || r.name); });
          popularItems = items;
          paint(items, "");
          loadingEl.hidden = true;
          contentEl.hidden = false;
          $("browseWrap").hidden = false;
        })
        .catch(function () {
          loadingEl.hidden = true;
          errorEl.hidden = false;
        });
    }
  }

  // ---- Render page ----
  function renderPage() {
    // Title + SEO
    var title = meta.title || meta.name || "Watch";
    var year = (meta.release_date || meta.first_air_date || "").slice(0, 4);
    document.title = "ZZ Classroom";
    var md = document.querySelector('meta[name="description"]');
    if (md) md.content = title + " (" + year + ") — stream free on ZZ Games.";

    $("watchTitle").textContent = title;
    if (meta.poster_path) {
      $("watchPoster").src = tmdbPoster(meta.poster_path);
      $("watchPoster").alt = title + " poster";
    }

    // Meta line
    var metaParts = [];
    if (year) metaParts.push('<span>' + year + '</span>');
    if (mediaType === "movie" && meta.runtime) metaParts.push('<span>' + meta.runtime + ' min</span>');
    if (mediaType === "tv" && meta.number_of_seasons) metaParts.push('<span>' + meta.number_of_seasons + ' season' + (meta.number_of_seasons > 1 ? 's' : '') + '</span>');
    if (meta.vote_average) metaParts.push('<span class="rating">★ ' + meta.vote_average.toFixed(1) + '</span>');
    $("watchMeta").innerHTML = metaParts.join("");

    // Genres
    if (meta.genres && meta.genres.length) {
      $("watchGenres").innerHTML = meta.genres.map(function (g) { return '<span>' + g.name + '</span>'; }).join("");
    }

    // Overview
    $("watchOverview").textContent = meta.overview || "";

    // Play button
    $("watchPlay").addEventListener("click", function () {
      triggerEl = this;
      openOverlay(mediaType, tmdbId, { season: currentSeason, episode: currentEpisode });
    });

    // Cast (top 12)
    if (meta.credits && meta.credits.cast && meta.credits.cast.length) {
      var cast = meta.credits.cast.slice(0, 12);
      $("castGrid").innerHTML = cast.map(function (c) {
        var photo = c.profile_path ? tmdbPoster(c.profile_path, "w185") : "";
        return '<div class="cast-card">' +
          '<div class="cast-photo" style="' + (photo ? "background-image:url('" + photo + "')" : "") + '"></div>' +
          '<div class="cast-name">' + esc(c.name) + '</div>' +
          '<div class="cast-role">' + esc(c.character || "") + '</div>' +
          '</div>';
      }).join("");
      $("castWrap").hidden = false;
    }

    // Related (up to 12)
    var recs = (meta.recommendations && meta.recommendations.results) || [];
    if (recs.length) {
      var relType = mediaType;
      $("relatedGrid").innerHTML = recs.slice(0, 12).map(function (r) {
        var poster = r.poster_path ? tmdbPoster(r.poster_path, "w342") : "";
        var rTitle = r.title || r.name || "";
        return '<a class="related-card" href="watch.html?type=' + relType + '&id=' + r.id + '">' +
          (poster ? '<img class="related-poster" src="' + poster + '" alt="" loading="lazy">' : '<div class="related-poster"></div>') +
          '<div class="related-name">' + esc(rTitle) + '</div></a>';
      }).join("");
      $("relatedWrap").hidden = false;
    }

    // TV pickers
    if (mediaType === "tv" && meta.seasons) {
      $("tvPickers").hidden = false;
      var seasonSelect = $("seasonPick");
      var episodeSelect = $("episodePick");
      var realSeasons = meta.seasons.filter(function (s) { return s.season_number > 0; });
      seasonSelect.innerHTML = realSeasons.map(function (s) {
        return '<option value="' + s.season_number + '">Season ' + s.season_number + '</option>';
      }).join("");
      currentSeason = realSeasons.length ? realSeasons[0].season_number : 1;

      seasonSelect.addEventListener("change", function () {
        currentSeason = +this.value;
        loadEpisodes(currentSeason);
      });
      episodeSelect.addEventListener("change", function () {
        currentEpisode = +this.value;
      });

      loadEpisodes(currentSeason);
    }
  }

  function loadEpisodes(season) {
    var episodeSelect = $("episodePick");
    episodeSelect.innerHTML = '<option>Loading…</option>';
    tmdbFetch("/tv/" + tmdbId + "/season/" + season)
      .then(function (data) {
        if (!data.episodes || !data.episodes.length) {
          episodeSelect.innerHTML = '<option value="1">Episode 1</option>';
          currentEpisode = 1;
          return;
        }
        episodeSelect.innerHTML = data.episodes.map(function (ep) {
          var label = "E" + ep.episode_number;
          if (ep.name) label += " — " + ep.name;
          return '<option value="' + ep.episode_number + '">' + label + '</option>';
        }).join("");
        currentEpisode = data.episodes[0].episode_number;
      })
      .catch(function () {
        episodeSelect.innerHTML = '<option value="1">Episode 1</option>';
        currentEpisode = 1;
      });
  }

  // ---- Overlay ----
  function openOverlay(kind, id, opts) {
    var sources = getSources(kind);
    if (!sources.length) return;

    overlayOpen = true;
    failoverCount = 0;
    currentSourceIndex = 0;

    var src = sources[currentSourceIndex];
    currentSourceOrigin = new URL(src.base_url).origin;

    var url = buildEmbedUrl(src.base_url, kind, id, opts);
    frame.src = url;
    overlayLoading.classList.remove("done");
    overlayError.hidden = true;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    $("overlayClose").focus();
  }

  function buildEmbedUrl(baseUrl, kind, id, opts) {
    var url;
    if (kind === "movie") {
      url = baseUrl + "/embed/movie/" + id;
    } else {
      url = baseUrl + "/embed/tv/" + id + "?s=" + (opts.season || 1) + "&e=" + (opts.episode || 1);
    }

    var sep = url.indexOf("?") > -1 ? "&" : "?";
    url += sep + "back=close";

    // Resume
    var progress = getProgress(mediaType, tmdbId, opts.season, opts.episode);
    if (progress && progress.position_seconds > 10) {
      url += "&t=" + progress.position_seconds;
    }

    return url;
  }

  function closeOverlay() {
    if (!overlayOpen) return;
    overlayOpen = false;
    frame.src = "";
    overlay.hidden = true;
    document.body.style.overflow = "";
    if (triggerEl) { triggerEl.focus(); triggerEl = null; }
  }

  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlayOpen) closeOverlay();
  });

  // Close on backdrop click
  overlay.querySelector(".overlay-backdrop").addEventListener("click", closeOverlay);
  $("overlayClose").addEventListener("click", closeOverlay);

  // ---- Failover ----
  function failover() {
    failoverCount++;
    if (failoverCount > MAX_FAILOVER) {
      overlayLoading.classList.add("done");
      overlayError.hidden = false;
      return;
    }
    var sources = getSources(mediaType);
    currentSourceIndex = (currentSourceIndex + 1) % sources.length;
    if (currentSourceIndex === 0 && failoverCount > 1) {
      overlayLoading.classList.add("done");
      overlayError.hidden = false;
      return;
    }
    var src = sources[currentSourceIndex];
    currentSourceOrigin = new URL(src.base_url).origin;
    console.warn("[ZZ Watch] Failover to:", src.provider_name);
    frame.src = buildEmbedUrl(src.base_url, mediaType, tmdbId, { season: currentSeason, episode: currentEpisode });
    overlayLoading.classList.remove("done");
    overlayError.hidden = true;
  }

  // Retry button
  $("overlayRetry").addEventListener("click", function () {
    failoverCount = 0;
    currentSourceIndex = 0;
    var sources = getSources(mediaType);
    if (!sources.length) return;
    var src = sources[0];
    currentSourceOrigin = new URL(src.base_url).origin;
    frame.src = buildEmbedUrl(src.base_url, mediaType, tmdbId, { season: currentSeason, episode: currentEpisode });
    overlayLoading.classList.remove("done");
    overlayError.hidden = true;
  });

  // ---- postMessage handler ----
  window.addEventListener("message", function (e) {
    if (!overlayOpen) return;
    if (e.origin !== currentSourceOrigin) return;
    var d = e.data;
    if (!d || typeof d.type !== "string" || d.type.indexOf("cinesrc:") !== 0) return;

    var evt = d.type.replace("cinesrc:", "");

    switch (evt) {
      case "ready":
      case "loadedmetadata":
        overlayLoading.classList.add("done");
        break;

      case "play":
        overlayLoading.classList.add("done");
        break;

      case "pause":
        doSave(d.currentTime, d.duration, true);
        break;

      case "timeupdate":
        doSave(d.currentTime, d.duration, false);
        break;

      case "seeked":
        doSave(d.currentTime, d.duration, true);
        break;

      case "ended":
        // Mark as finished (delete progress past 95%)
        if (d.duration > 0) {
          saveProgress(mediaType, tmdbId, currentSeason, currentEpisode, d.duration, d.duration, extraData());
        }
        break;

      case "close":
        closeOverlay();
        break;

      case "nextepisode":
        if (d.internalNavigation) {
          // Update local state only, never reload iframe
          if (d.season) currentSeason = d.season;
          if (d.episode) currentEpisode = d.episode;
          // Update pickers if visible
          var sp = $("seasonPick");
          var ep = $("episodePick");
          if (sp) sp.value = currentSeason;
          if (ep) ep.value = currentEpisode;
        } else {
          currentSeason = d.season || currentSeason;
          currentEpisode = d.episode || currentEpisode;
          openOverlay(mediaType, tmdbId, { season: currentSeason, episode: currentEpisode });
        }
        break;

      case "error":
        console.warn("[ZZ Watch] Player error:", d.error);
        failover();
        break;
    }
  });

  // ---- Save progress (throttled) ----
  function extraData() {
    return {
      title: meta ? (meta.title || meta.name || "") : "",
      poster_path: meta ? (meta.poster_path || "") : "",
    };
  }

  function doSave(position, duration, force) {
    if (!position && position !== 0) return;
    if (!duration) return;
    var now = Date.now();
    if (!force && now - lastSaveTime < SAVE_THROTTLE) return;
    lastSaveTime = now;
    saveProgress(mediaType, tmdbId, currentSeason, currentEpisode, position, duration, extraData());
  }

  // ---- Utility ----
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
})();
