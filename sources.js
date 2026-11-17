// CineSrc sources + watch progress (localStorage)

const SOURCES = [
  { id: 1, provider_name: "CineSrc", base_url: "https://cinesrc.st", kind: "both", priority: 1, enabled: true },
];

function getSources(kind) {
  return SOURCES
    .filter(function (s) { return s.enabled && (s.kind === "both" || s.kind === kind); })
    .sort(function (a, b) { return a.priority - b.priority; });
}

// Session ID (browser-unique, persisted)
var SESSION_KEY = "zz-watch-session";
function getSessionId() {
  var id = null;
  try { id = localStorage.getItem(SESSION_KEY); } catch (e) {}
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    try { localStorage.setItem(SESSION_KEY, id); } catch (e) {}
  }
  return id;
}

// Progress CRUD — keyed by "movie-{id}" or "tv-{id}-{season}-{episode}"
var PROGRESS_KEY = "zz-watch-progress";

function _loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch (e) { return {}; }
}
function _saveProgressStore(store) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(store)); } catch (e) {}
}

function progressKey(mediaType, tmdbId, season, episode) {
  if (mediaType === "tv") return "tv-" + tmdbId + "-" + (season || 1) + "-" + (episode || 1);
  return "movie-" + tmdbId;
}

function getAllProgress() { return _loadProgress(); }

function getProgress(mediaType, tmdbId, season, episode) {
  var store = _loadProgress();
  return store[progressKey(mediaType, tmdbId, season, episode)] || null;
}

function saveProgress(mediaType, tmdbId, season, episode, position, duration, extra) {
  var store = _loadProgress();
  var key = progressKey(mediaType, tmdbId, season, episode);
  var pct = duration > 0 ? position / duration : 0;
  // Delete past 95%
  if (pct > 0.95) { delete store[key]; _saveProgressStore(store); return; }
  store[key] = {
    session_id: getSessionId(),
    media_type: mediaType,
    tmdb_id: tmdbId,
    season: season || null,
    episode: episode || null,
    position_seconds: Math.floor(position),
    duration_seconds: Math.floor(duration),
    updated_at: Date.now(),
    title: (extra && extra.title) || "",
    poster_path: (extra && extra.poster_path) || "",
  };
  _saveProgressStore(store);
}

function deleteProgress(mediaType, tmdbId, season, episode) {
  var store = _loadProgress();
  delete store[progressKey(mediaType, tmdbId, season, episode)];
  _saveProgressStore(store);
}

function getRecentProgress(limit) {
  var store = _loadProgress();
  return Object.values(store)
    .sort(function (a, b) { return b.updated_at - a.updated_at; })
    .slice(0, limit || 6);
}

// TMDB helpers
function tmdbFetch(path) {
  var token = typeof SITE !== "undefined" && SITE.tmdbToken;
  if (!token) return Promise.reject(new Error("No TMDB token"));
  return fetch("https://api.themoviedb.org/3" + path, {
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
  }).then(function (r) { if (!r.ok) throw new Error("TMDB " + r.status); return r.json(); });
}

function tmdbPoster(path, size) {
  if (!path) return "";
  return "https://image.tmdb.org/t/p/" + (size || "w500") + path;
}
