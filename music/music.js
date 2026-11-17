'use strict';
/* ZZ Games Music.
   Sources: Deezer catalog (via api/music, played through YouTube), Audius (free full streams),
   Radio Browser (live stations), YouTube live (lofi). Everything personal lives in localStorage.

   FULL SONGS ON GITHUB PAGES (optional): GitHub Pages can't run the api/music backend, so chart
   songs fall back to 30-second previews. To get full songs there, create a YouTube Data API v3 key
   in Google Cloud, restrict it to "Websites" -> https://zz-games.github.io/*, and paste it below.
   The free quota covers roughly 100 new song lookups a day (each found song is remembered). */
const YT_KEY = 'AIzaSyCZ2vIxFir0cgT1RdAMeow60_IsPGfIJX8';
(() => {
  /* ================= helpers ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
  const long = (s) => { const m = Math.round((s || 0) / 60); return m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`; };
  const fans = (n) => (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n || 0));
  const shuffled = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const hash = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const enc = encodeURIComponent;
  const BASE_TITLE = document.title;

  const ICONS = {
    play: ['M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z', 1],
    pause: ['M7 5h3.5v14H7zM13.5 5H17v14h-3.5z', 1],
    next: ['M5.5 6.2v11.6a.8.8 0 0 0 1.2.7l8.6-5.8a.8.8 0 0 0 0-1.4L6.7 5.5a.8.8 0 0 0-1.2.7zM16.5 5.5h2v13h-2z', 1],
    prev: ['M18.5 6.2v11.6a.8.8 0 0 1-1.2.7l-8.6-5.8a.8.8 0 0 1 0-1.4l8.6-5.8a.8.8 0 0 1 1.2.7zM5.5 5.5h2v13h-2z', 1],
    shuffle: ['M16 4h4v4M4 20 20 4M20 16v4h-4M15 15l5 5M4 4l5 5'],
    repeat: ['M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4'],
    repeat1: ['M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4M11.5 10.5l1-.5v4'],
    heart: ['M12 20s-7.5-4.6-9.2-9.3C1.7 7.6 3.7 4.5 7 4.5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.3 0 5.3 3.1 4.2 6.2C19.5 15.4 12 20 12 20z'],
    plus: ['M12 5v14M5 12h14'],
    more: ['M5 12h.01M12 12h.01M19 12h.01'],
    search: ['M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM21 21l-5.2-5.2'],
    compass: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z'],
    crate: ['M4 9h16v11H4zM4 9l2-5h12l2 5M9 13h6'],
    radio: ['M4 9h16v11H4zM7 9l10-5M8 14.5h.01M8 17h.01M13 15.5h4'],
    moon: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'],
    vol: ['M11 5 6.5 9H3v6h3.5L11 19zM15.5 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12'],
    mute: ['M11 5 6.5 9H3v6h3.5L11 19zM16 9.5l5 5M21 9.5l-5 5'],
    video: ['M3 6.5h12v11H3zM15 10.5l6-3.5v10l-6-3.5'],
    queue: ['M3 6h14M3 11h14M3 16h8M16 14v6l5-3z'],
    close: ['M6 6l12 12M18 6 6 18'],
    sun: ['M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z'],
    wave: ['M5 18.5a9.5 9.5 0 0 1 0-13M8 15.5a5.5 5.5 0 0 1 0-7M16 8.5a5.5 5.5 0 0 1 0 7M19 5.5a9.5 9.5 0 0 1 0 13M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
    dice: ['M4.5 4.5h15v15h-15zM9 9h.01M15 15h.01M15 9h.01M9 15h.01M12 12h.01'],
    clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2'],
    expand: ['M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7'],
    back: ['M15 18l-6-6 6-6'],
    trash: ['M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'],
    edit: ['M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4'],
    user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0'],
    disc: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
    next2: ['M5 12h14M13 6l6 6-6 6'],
    star: ['M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z'],
    verified: ['M12 2.5l2.4 1.8 3-.2.8 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.8 2.9-3-.2L12 21.5l-2.4-1.8-3 .2-.8-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.8-2.9 3 .2zM8.5 12l2.5 2.5 4.5-5'],
  };
  const ic = (n, cls = '') => { const [d, f] = ICONS[n] || ICONS.more; return `<svg class="i ${f ? 'fill ' : ''}${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`; };
  const phStyle = (seed) => { const h = hash(seed) % 360; return `background:linear-gradient(135deg,hsl(${h} 62% 58%),hsl(${(h + 48) % 360} 55% 28%))`; };
  const initial = (s) => esc((String(s || '?').replace(/[^\p{L}\p{N}]/gu, '')[0] || '?').toUpperCase());
  const ph = (seed, cls = '') => `<span class="ph ${cls}" style="${phStyle(seed)}">${initial(seed)}</span>`;
  const art = (src, seed, cls = '') => (src ? `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy" decoding="async" data-seed="${esc(seed)}">` : ph(seed, cls));
  // broken images become a generated placeholder
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t.tagName !== 'IMG' || !('seed' in t.dataset)) return;
    const s = document.createElement('span');
    s.className = 'ph ' + t.className; s.setAttribute('style', phStyle(t.dataset.seed)); s.textContent = (t.dataset.seed || '?')[0]?.toUpperCase() || '?';
    t.replaceWith(s);
  }, true);

  /* ================= storage ================= */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('zzs:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('zzs:' + k, JSON.stringify(v)); } catch { /* full or blocked */ } },
  };
  const S = {
    liked: store.get('liked', []), lists: store.get('lists', []), follows: store.get('follows', []),
    stations: store.get('stations', []), tuned: store.get('tuned', []), activity: store.get('activity', []),
    searches: store.get('searches', []), taste: store.get('taste', {}),
    cfg: Object.assign({ theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', autoplay: true, vol: 0.8, muted: false, panel: true }, store.get('cfg', {})),
  };
  const save = (...ks) => ks.forEach((k) => store.set(k, S[k]));
  const slim = (t) => ({ id: t.id, src: t.src, t: t.t, a: t.a, aid: t.aid || '', al: t.al || '', alid: t.alid || '', art: t.art || '', big: t.big || '', d: t.d || 0, ex: !!t.ex, ver: !!t.ver, g: t.g || '' });

  function remember(item) {
    S.activity = [item, ...S.activity.filter((a) => !(a.k === item.k && a.id === item.id))].slice(0, 30);
    save('activity');
  }
  function bumpTaste(t) {
    if (!t.aid) return;
    const x = S.taste[t.aid] || { n: 0 };
    x.n += 1; x.name = t.a; x.at = Date.now();
    S.taste[t.aid] = x;
    S.taste = Object.fromEntries(Object.entries(S.taste).sort((a, b) => b[1].n - a[1].n).slice(0, 80));
    save('taste');
  }
  function topArtists(n = 5) {
    const w = {};
    const add = (id, name, s) => { if (!id || !id.startsWith('dz')) return; (w[id] ??= { name, s: 0 }).s += s; };
    for (const [id, x] of Object.entries(S.taste)) add(id, x.name, x.n);
    S.liked.forEach((t) => add(t.aid, t.a, 2));
    S.follows.forEach((f) => add(f.id, f.name, 4));
    return Object.entries(w).sort((a, b) => b[1].s - a[1].s).slice(0, n).map(([id, x]) => ({ id, name: x.name }));
  }

  /* ================= data sources ================= */
  const memo = new Map();
  const cached = (k, fn, ttl = 10 * 60e3) => {
    const h = memo.get(k);
    if (h && Date.now() - h.at < ttl) return h.p;
    const p = fn().catch((e) => { memo.delete(k); throw e; });
    memo.set(k, { p, at: Date.now() });
    return p;
  };
  const getJSON = async (u, ms = 12000) => {
    const r = await fetch(u, { signal: AbortSignal.timeout(ms) });
    if (!r.ok) throw new Error(`Request failed (${r.status})`);
    return r.json();
  };
  // Opened straight from disk (file://) or on a host without the backend (e.g. GitHub Pages):
  // the catalog then comes from Deezer directly in the browser, and songs play as Deezer's 30-second previews.
  const FILE = location.protocol === 'file:';
  let NOAPI = FILE;
  function markNoapi() {
    NOAPI = true;
    if (!store.get('noteX', false) && !YT_KEY) $('#previewNote').hidden = false;
  }
  const M = (p, fresh) => cached('m:' + p + (fresh ? Math.random() : ''), async () => {
    if (!NOAPI) {
      try {
        const r = await fetch('api/music/' + p, { signal: AbortSignal.timeout(20000) });
        const isJson = (r.headers.get('content-type') || '').includes('json');
        if (r.ok && isJson) return await r.json();
        if (!isJson) markNoapi(); // got an HTML 404 page: no backend on this host
      } catch { /* network trouble: try the browser route */ }
    }
    return localApi(p);
  });

  /* --- Deezer straight from the browser (JSONP works even from file://) --- */
  let jpN = 0;
  function dzp(path) {
    return new Promise((res, rej) => {
      const cb = '__zzdz' + ++jpN, s = document.createElement('script');
      const done = () => { clearTimeout(timer); delete window[cb]; s.remove(); };
      const timer = setTimeout(() => { done(); rej(new Error('Deezer took too long')); }, 12000);
      window[cb] = (j) => { done(); if (!j || j.error) rej(new Error(j?.error?.message || 'Deezer error')); else res(j); };
      s.onerror = () => { done(); rej(new Error('Can’t reach Deezer')); };
      s.src = `https://api.deezer.com${path}${path.includes('?') ? '&' : '?'}output=jsonp&callback=${cb}`;
      document.head.append(s);
    });
  }
  const dzTrack = (x, alb) => {
    const al = alb || x.album || {};
    return { id: 'dz' + x.id, src: 'yt', t: x.title, a: x.artist?.name || '', aid: x.artist?.id ? 'dz' + x.artist.id : '', al: al.title || '', alid: al.id ? 'dz' + al.id : '', art: al.cover_medium || '', big: al.cover_xl || al.cover_big || '', d: x.duration || 0, ex: !!x.explicit_lyrics };
  };
  const dzArtist = (a) => ({ id: 'dz' + a.id, name: a.name, pic: a.picture_medium || '', big: a.picture_xl || a.picture_big || '', fans: a.nb_fan || 0 });
  const dzAlbum = (a, who) => ({ id: 'dz' + a.id, t: a.title, a: a.artist?.name || who || '', art: a.cover_medium || '', big: a.cover_xl || '', year: (a.release_date || '').slice(0, 4), type: a.record_type || 'album' });
  const okTrack = (x) => x.readable !== false;
  async function localApi(p) {
    const [route, qs] = p.split('?');
    const q = new URLSearchParams(qs || '');
    const num = (v) => (String(v || '').match(/\d+/) || [''])[0];
    const data = (j) => j.data || [];
    if (route === 'chart') {
      const [t, a] = await Promise.all([dzp('/chart/0/tracks?limit=50'), dzp('/chart/0/artists?limit=24')]);
      return { tracks: data(t).filter(okTrack).map((x) => dzTrack(x)), artists: data(a).map(dzArtist) };
    }
    if (route === 'search') {
      const e = enc(q.get('q') || '');
      const [t, a, al] = await Promise.all([dzp(`/search?q=${e}&limit=30`), dzp(`/search/artist?q=${e}&limit=12`), dzp(`/search/album?q=${e}&limit=12`).catch(() => ({}))]);
      return { tracks: data(t).filter(okTrack).map((x) => dzTrack(x)), artists: data(a).map(dzArtist), albums: data(al).map((x) => dzAlbum(x)) };
    }
    if (route === 'artist') {
      const id = num(q.get('id'));
      const [a, top, albums, rel] = await Promise.all([dzp(`/artist/${id}`), dzp(`/artist/${id}/top?limit=30`), dzp(`/artist/${id}/albums?limit=40`).catch(() => ({})), dzp(`/artist/${id}/related?limit=14`).catch(() => ({}))]);
      return { artist: dzArtist(a), tracks: data(top).filter(okTrack).map((x) => dzTrack(x)), albums: data(albums).map((x) => dzAlbum(x, a.name)), related: data(rel).map(dzArtist) };
    }
    if (route === 'album') {
      const a = await dzp(`/album/${num(q.get('id'))}`);
      return { album: { ...dzAlbum(a), label: a.label || '' }, tracks: data(a.tracks || {}).filter(okTrack).map((x) => dzTrack(x, a)) };
    }
    if (route === 'recs') {
      const seeds = (q.get('a') || '').split(',').map(num).filter(Boolean).slice(0, 6), n = +q.get('n') || 50;
      if (!seeds.length) return { tracks: shuffled((await localApi('chart')).tracks).slice(0, n) };
      const rel = await Promise.all(seeds.map((s) => dzp(`/artist/${s}/related?limit=8`).then(data).catch(() => [])));
      const ids = [...new Set([...seeds, ...rel.flatMap((l) => shuffled(l).slice(0, Math.max(2, Math.ceil(10 / seeds.length))).map((a) => String(a.id)))])].slice(0, 16);
      const tops = await Promise.all(ids.map((id) => dzp(`/artist/${id}/top?limit=8`).then((r) => shuffled(data(r).filter(okTrack)).slice(0, 4)).catch(() => [])));
      const seen = new Set();
      const out = tops.flat().filter((x) => { const k = (x.title + '|' + x.artist?.name).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).map((x) => dzTrack(x));
      return { tracks: shuffled(out).slice(0, n) };
    }
    throw new Error('Unknown request');
  }
  const AU = 'https://api.audius.co/v1', APP = 'app_name=ZZSound';
  const A = (p) => cached('a:' + p, async () => (await getJSON(`${AU}${p}${p.includes('?') ? '&' : '?'}${APP}`)).data);
  const auTrack = (x) => ({
    id: 'au' + x.id, src: 'au', t: x.title, a: x.user?.name || '', aid: x.user?.id ? 'au' + x.user.id : '', ver: !!x.user?.is_verified,
    d: x.duration || 0, art: x.artwork?.['480x480'] || x.artwork?.['150x150'] || '', big: x.artwork?.['1000x1000'] || x.artwork?.['480x480'] || '',
    g: x.genre || '', al: x.genre || '',
  });
  const RADIO_HOSTS = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info', 'https://fi1.api.radio-browser.info'];
  const slimSt = (s) => ({ id: s.id, name: s.name, url: s.url, art: s.art, cc: s.cc, br: s.br, tags: s.tags });
  const stations = (params) => cached('r:' + params, async () => {
    for (const h of shuffled(RADIO_HOSTS)) {
      try {
        const list = await getJSON(`${h}/json/stations/search?${params}&hidebroken=true&order=clickcount&reverse=true&limit=72`, 9000);
        const seen = new Set();
        return list.filter((s) => {
          const k = s.name.trim().toLowerCase();
          if (!s.url_resolved?.startsWith('https') || seen.has(k)) return false;
          seen.add(k); return true;
        }).map((s) => ({ id: s.stationuuid, name: s.name.trim(), url: s.url_resolved, art: s.favicon || '', cc: s.countrycode || '', br: s.bitrate || 0, tags: (s.tags || '').split(',').filter(Boolean).slice(0, 3) }));
      } catch { /* next mirror */ }
    }
    throw new Error('The radio directory is unreachable right now');
  });

  const AU_GENRES = ['All', 'Hip-Hop/Rap', 'Electronic', 'Pop', 'R&B/Soul', 'House', 'Lo-Fi', 'Alternative', 'Rock', 'Trap', 'Dubstep', 'Techno', 'Drum & Bass', 'Ambient', 'Latin', 'Jazz', 'Country', 'Funk'];
  const MOODS = [
    { id: 'sunday', name: 'Slow Sunday', d: 'Soft edges, no rush', g: ['Lo-Fi', 'Ambient'], c: ['#f2a65a', '#9c3d22'] },
    { id: 'lift', name: 'Heavy Lift', d: 'For the last rep', g: ['Trap', 'Dubstep', 'Drum & Bass'], c: ['#ff4d2e', '#33100a'] },
    { id: 'afterhours', name: 'After Hours', d: 'Lights low, bass up', g: ['House', 'Techno'], c: ['#5a3fc0', '#120d2a'] },
    { id: 'bars', name: 'Bars Only', d: 'Fresh rap, no skips', g: ['Hip-Hop/Rap'], c: ['#d6a227', '#3d2c05'] },
    { id: 'deepwork', name: 'Deep Work', d: 'Headphones on', g: ['Ambient', 'Lo-Fi', 'Jazz'], c: ['#6fa595', '#173630'] },
    { id: 'velvet', name: 'Velvet', d: 'R&B after midnight', g: ['R&B/Soul'], c: ['#b8496c', '#2c0c18'] },
    { id: 'riffs', name: 'Loud Guitars', d: 'Rock & alt picks', g: ['Rock', 'Alternative'], c: ['#8c96a1', '#1f2328'] },
    { id: 'calor', name: 'Calor', d: 'Latin heat', g: ['Latin'], c: ['#ffae3b', '#b8301d'] },
    { id: 'glitter', name: 'Glitter Pop', d: 'Bright & catchy', g: ['Pop'], c: ['#ff86c2', '#6b33e8'] },
    { id: 'drops', name: 'Big Drops', d: 'Synths for days', g: ['Electronic', 'Dubstep'], c: ['#3cc8f0', '#25267a'] },
  ];
  const RADIO_TAGS = [['Top', ''], ['Pop', 'pop'], ['Hip-hop', 'hip hop'], ['Dance', 'dance'], ['Rock', 'rock'], ['Chill', 'chillout'], ['R&B', 'rnb'], ['Jazz', 'jazz'], ['Classical', 'classical'], ['Country', 'country'], ['Latin', 'latin'], ['K-pop', 'kpop'], ['Indie', 'indie'], ['Metal', 'metal'], ['80s', '80s'], ['90s', '90s'], ['Soul', 'soul'], ['Talk', 'talk'], ['News', 'news']];
  const LOFI = [
    ['rFZHOHl-L8A', 'Study beats', 'Mellow hip hop to focus with'], ['JD-kMIpDfnY', 'Sleepy beats', 'Quiet loops for winding down'],
    ['4xDzrJKXOOY', 'Neon drive', 'Synthwave for night sessions'], ['3PFJ9SETS4M', 'Lounge house', 'Warm, low-key grooves'],
    ['E2vONfzoyRI', 'Jazz café', 'Brushed drums and soft keys'], ['CwPCy1GLS38', 'Rainy window', 'Melancholy beats for grey days'],
    ['1Tl2FtV06qo', 'Lantern beats', 'East Asian lofi textures'], ['GSfT7H87zq4', 'Deep space', 'Ambient synth drift'],
    ['N0snMcR6aaA', 'Piano room', 'Gentle piano to think to'], ['jXAEIWcGXwE', 'Reading nook', 'Calm classical'],
    ['VAlMDl00mYY', 'Dreamstate', 'Slow lofi for sleep'], ['qGohtGC5Rtk', 'Focus sprints', 'Work-along pomodoro sessions'],
  ];

  async function mixTracks(m) {
    const lists = await Promise.all(m.g.map((g) => A(`/tracks/trending?time=week&limit=40&genre=${enc(g)}`).catch(() => [])));
    const seen = new Set();
    return shuffled(lists.flat().map(auTrack).filter((t) => !seen.has(t.id) && seen.add(t.id))).slice(0, 50);
  }

  /* ================= theme / ui bits ================= */
  $$('[data-ic]').forEach((el) => { el.outerHTML = ic(el.dataset.ic); });
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    $('#toasts').append(t);
    setTimeout(() => t.remove(), 2400);
    while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  }
  const dlg = $('#dlg');
  function askText(title, value = '', cta = 'Save') {
    return new Promise((res) => {
      dlg.innerHTML = `<form method="dialog"><h3>${esc(title)}</h3><input name="v" value="${esc(value)}" maxlength="80" autocomplete="off"><div class="row-btns"><button class="btn ghost" value="cancel">Cancel</button><button class="btn hot" value="ok">${esc(cta)}</button></div></form>`;
      const inp = $('input', dlg);
      dlg.onclose = () => res(dlg.returnValue === 'ok' ? inp.value.trim() : null);
      dlg.returnValue = ''; dlg.showModal(); inp.select();
    });
  }
  function confirmAsk(title, cta = 'Delete') {
    return new Promise((res) => {
      dlg.innerHTML = `<form method="dialog"><h3>${esc(title)}</h3><div class="row-btns"><button class="btn ghost" value="cancel">Cancel</button><button class="btn hot" value="ok">${esc(cta)}</button></div></form>`;
      dlg.onclose = () => res(dlg.returnValue === 'ok');
      dlg.returnValue = ''; dlg.showModal();
    });
  }

  /* ================= list registry (rows reference arrays by key) ================= */
  const LISTS = new Map();
  let regN = 0;
  const reg = (list, pfx = 'L') => { const k = pfx + ++regN; LISTS.set(k, list); return k; };

  const isLiked = (t) => S.liked.some((x) => x.id === t.id);
  const isCur = (t) => P.mode === 'song' && P.cur?.id === t.id;

  function rows(list, o = {}) {
    const k = reg(list, o.pfx || 'L');
    return `<ol class="rows${o.compact ? ' compact' : ''}" data-key="${k}" ${o.ctx ? `data-ctx="${esc(o.ctx)}"` : ''}>${list.map((t, i) => row(t, i, k, o)).join('')}</ol>`;
  }
  function row(t, i, k, o) {
    const alb = t.alid?.startsWith('dz') ? `<a href="#/album/${esc(t.alid)}">${esc(t.al)}</a>` : esc(t.al || '');
    return `<li class="row${o.album === false ? ' noal' : ''}${isCur(t) ? ' on' : ''}" data-l="${k}" data-i="${i}" data-tid="${esc(t.id)}"${o.drag ? ' draggable="true"' : ''}>
      <span class="r-n"><b>${(o.start || 0) + i + 1}</b><i class="eq"><s></s><s></s><s></s></i>${ic('play', 'r-play')}</span>
      ${art(t.art, t.t, 'r-art')}
      <span class="r-main"><b>${esc(t.t)}${t.ex ? '<em class="ex" title="Explicit">E</em>' : ''}</b>${t.aid ? `<a class="r-a" href="#/artist/${esc(t.aid)}">${esc(t.a)}${t.ver ? ic('verified', 'ver') : ''}</a>` : `<span class="r-a">${esc(t.a)}</span>`}</span>
      <span class="r-al">${alb}</span>
      <button class="ib r-like${isLiked(t) ? ' on' : ''}" data-like aria-label="Like">${ic('heart')}</button>
      <span class="r-d">${t.d ? fmt(t.d) : ''}</span>
      <button class="ib r-more" data-more aria-label="More options">${ic('more')}</button></li>`;
  }
  const trackAt = (el) => { const r = el.closest('[data-l]'); return r ? LISTS.get(r.dataset.l)?.[+r.dataset.i] : null; };

  const secHead = (n, title, sub = '', acts = '') => `<div class="sec-h"><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : '<p></p>'}${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
  const skelRows = (n = 6) => Array.from({ length: n }, () => '<div class="sk sk-row"></div>').join('');
  const skelCards = (n = 6) => `<div class="hscroll">${Array.from({ length: n }, () => '<div><div class="sk sk-card"></div></div>').join('')}</div>`;
  const errBox = (e) => `<div class="empty"><b>That didn't load</b>${esc(e?.message || 'Something went wrong')}<div class="more-row"><button class="btn ghost" data-retry>Try again</button></div></div>`;
  const emptyBox = (title, text = '') => `<div class="empty"><b>${esc(title)}</b>${esc(text)}</div>`;

  const card = ({ href, img, seed, title, sub, play }) => `<a class="card" href="${href}"><div class="sleeve"><span class="disc"></span>${art(img, seed || title)}${play ? `<button class="card-play" data-cplay="${esc(play)}" aria-label="Play ${esc(title)}">${ic('play')}</button>` : ''}</div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</a>`;
  const mosaic = (tracks) => {
    const arts = [...new Set(tracks.map((t) => t.art).filter(Boolean))].slice(0, 4);
    if (arts.length < 4) return `<div class="mosaic one">${arts[0] ? art(arts[0], 'x') : ph(tracks[0]?.t || 'Playlist')}</div>`;
    return `<div class="mosaic">${arts.map((a) => art(a, 'x')).join('')}</div>`;
  };
  const listCard = (l) => `<a class="card" href="#/list/${esc(l.id)}"><div class="sleeve"><span class="disc"></span>${l.tracks.length ? mosaic(l.tracks) : ph(l.name)}${l.tracks.length ? `<button class="card-play" data-cplay="list:${esc(l.id)}" aria-label="Play">${ic('play')}</button>` : ''}</div><b>${esc(l.name)}</b><small>${l.tracks.length} song${l.tracks.length === 1 ? '' : 's'}</small></a>`;
  const artistCard = (a) => `<a class="artist" href="#/artist/${esc(a.id)}">${art(a.pic, a.name)}<b>${esc(a.name)}</b>${a.fans ? `<small>${fans(a.fans)} fans</small>` : ''}</a>`;
  const mixCard = (m) => `<a class="mix" href="#/mix/${m.id}" style="background:linear-gradient(160deg,${m.c[0]},${m.c[1]})"><span class="tag">${esc(m.g.join(' · '))}</span><span><b>${esc(m.name)}</b><br><small>${esc(m.d)}</small></span><button class="card-play" data-cplay="mix:${m.id}" aria-label="Play ${esc(m.name)}">${ic('play')}</button></a>`;

  /* ================= player engine ================= */
  const audio = new Audio();
  audio.preload = 'auto';
  const yt = { p: null, ready: null };
  const P = { q: [], i: -1, orig: null, shuffle: store.get('shuf', false), repeat: store.get('rep', 0), mode: null, cur: null, eng: null, tok: 0, ids: [], idi: 0, station: null, stream: null, label: '', playing: false };

  function loadYTApi() {
    if (window.YT?.Player) return Promise.resolve();
    return (loadYTApi.p ??= new Promise((res, rej) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); res(); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => { loadYTApi.p = null; rej(new Error('YouTube is blocked on this network')); };
      document.head.append(s);
      setTimeout(() => rej(new Error('YouTube took too long to load')), 15000);
    }));
  }
  function ytPlayer() {
    return (yt.ready ??= loadYTApi().then(() => new Promise((res) => {
      yt.p = new YT.Player('dockFrame', {
        host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%',
        playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, iv_load_policy: 3, disablekb: 0, fs: 1, origin: location.origin },
        events: { onReady: () => { applyVol(); res(yt.p); }, onStateChange: (e) => ytState(e.data), onError: (e) => ytError(e.data) },
      });
    })).catch((e) => { yt.ready = null; throw e; }));
  }
  function stopEngines() {
    audio.pause();
    if (audio.getAttribute('src')) { audio.removeAttribute('src'); audio.load(); }
    try { yt.p?.stopVideo?.(); } catch { /* not ready */ }
  }
  function ytState(s) {
    if (P.eng !== 'yt') return;
    if (s === 1) { setPlaying(true); setBuffering(false); }
    else if (s === 2) setPlaying(false);
    else if (s === 3) setBuffering(true);
    else if (s === 0) onEnded();
  }
  function ytError() {
    if (P.eng !== 'yt') return;
    if (P.mode === 'stream') { toast('That stream is offline right now'); setBuffering(false); return; }
    if (++P.idi < P.ids.length) { yt.p.loadVideoById(P.ids[P.idi]); return; }
    const tok = P.tok, t = P.cur;
    if (t?.id.startsWith('dz')) { playPreview(t, tok, 'nomatch').then((ok) => { if (!ok && tok === P.tok) failSkip('Not playable here — skipping', tok); }); return; }
    failSkip('Not playable here — skipping', tok);
  }
  audio.addEventListener('playing', () => { if (P.eng === 'audio') { setPlaying(true); setBuffering(false); } });
  audio.addEventListener('pause', () => { if (P.eng === 'audio') setPlaying(false); });
  audio.addEventListener('waiting', () => { if (P.eng === 'audio') setBuffering(true); });
  audio.addEventListener('ended', () => { if (P.eng === 'audio') onEnded(); });
  audio.addEventListener('error', () => {
    if (P.eng !== 'audio' || !audio.getAttribute('src')) return;
    setBuffering(false);
    if (P.mode === 'radio') { toast('That station went quiet — try another'); setPlaying(false); return; }
    failSkip('Track failed — skipping');
  });

  async function playTrack(t) {
    const tok = ++P.tok;
    P.cur = t; P.mode = 'song'; P.station = null; P.stream = null;
    stopEngines();
    setNow({ title: t.t, sub: t.a, subHref: t.aid ? `#/artist/${t.aid}` : '', art: t.big || t.art, small: t.art, seed: t.t });
    setBuffering(true); showPlayer(); markCurrent(); renderQueue();
    bumpTaste(t);
    remember({ k: 'song', id: t.id, t: t.t, s: t.a, img: t.art, ref: slim(t) });
    if (t.src === 'au') {
      P.eng = 'audio'; paintVideoBtn();
      audio.src = `${AU}/tracks/${t.id.slice(2)}/stream?${APP}`;
      audio.play().catch(() => setPlaying(false));
      return;
    }
    P.eng = 'yt'; setVideo(true); paintVideoBtn();
    if (FILE || (NOAPI && !YT_KEY)) { // no way to find the full song on YouTube: play Deezer's preview
      if (!(await playPreview(t, tok, FILE ? 'file' : 'noapi')) && tok === P.tok) failSkip(`Couldn't play “${t.t}” — skipping`, tok);
      return;
    }
    try {
      const ids = await resolveYT(t);
      if (tok !== P.tok) return;
      P.ids = ids; P.idi = 0;
      if (!P.ids.length) throw new Error('no match');
      const pl = await ytPlayer();
      if (tok !== P.tok) return;
      pl.loadVideoById(P.ids[0]);
    } catch (e) {
      if (tok !== P.tok) return;
      if (t.id.startsWith('dz') && (await playPreview(t, tok, 'nomatch'))) return;
      if (tok !== P.tok) return;
      setBuffering(false);
      failSkip(/blocked|long/.test(e.message) ? e.message : `Couldn't find “${t.t}” — skipping`, tok);
    }
  }

  /* --- finding the full song on YouTube --- */
  const ytCache = store.get('ytc', {});
  async function resolveYT(t) {
    if (ytCache[t.id]) return ytCache[t.id];
    let ids = [];
    if (!NOAPI) {
      try {
        const q = new URLSearchParams({ t: t.t, a: t.a, al: t.al || '', d: t.d || 0 });
        const r = await fetch('api/music/yt?' + q, { signal: AbortSignal.timeout(20000) });
        if ((r.headers.get('content-type') || '').includes('json')) { if (r.ok) ids = (await r.json()).ids || []; }
        else markNoapi();
      } catch { /* backend unreachable */ }
    }
    if (!ids.length && YT_KEY) { try { ids = await ytBrowser(t); } catch { /* quota or network */ } }
    if (ids.length) {
      ytCache[t.id] = ids;
      const keys = Object.keys(ytCache); if (keys.length > 600) keys.slice(0, 100).forEach((k) => delete ytCache[k]);
      store.set('ytc', ytCache);
    }
    return ids;
  }
  const normT = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\((?:feat|ft|with)[^)]*\)|\[(?:feat|ft|with)[^\]]*\]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const isoSecs = (s) => { const m = String(s).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; };
  const BADW = ['live', 'cover', 'remix', 'sped up', 'slowed', 'reverb', '8d', 'karaoke', 'instrumental', 'nightcore', 'reaction', '1 hour', 'loop', 'mashup', 'acoustic', 'tutorial', 'lesson', 'bass boosted', 'edit'];
  function matchScore(c, t) {
    const T = normT(t.t), A = normT(t.a.split(/,|&| x | feat\.? | ft\.? /i)[0]), title = normT(c.title), ch = normT(c.channel);
    let s = 0;
    if (/ - topic$/i.test(c.channel) && ch.includes(A)) s += 10;
    else if (ch.replace(/ /g, '').includes(A.replace(/ /g, ''))) s += 4;
    if (/vevo$/i.test(c.channel)) s += 3;
    if (title.includes(T)) s += 4;
    else { const w = T.split(' ').filter((x) => x.length > 1); s += w.length ? 3 * w.filter((x) => title.includes(x)).length / w.length : 0; }
    if (title.includes(A)) s += 1;
    if (/official audio/i.test(c.title)) s += 1.5;
    for (const b of BADW) if (title.includes(b) && !T.includes(b)) s -= 5;
    if (t.d && c.d) { const diff = Math.abs(c.d - t.d); s += diff <= 3 ? 4 : diff <= 10 ? 2 : diff <= 25 ? 0 : diff <= 90 ? -4 : -9; }
    if (!c.d) s -= 6;
    return s;
  }
  const decodeHtml = (s) => { const d = document.createElement('textarea'); d.innerHTML = s; return d.value; };
  async function ytBrowser(t) {
    const G = 'https://www.googleapis.com/youtube/v3/';
    const s = await getJSON(`${G}search?part=snippet&type=video&videoEmbeddable=true&maxResults=8&q=${enc(t.a + ' ' + t.t)}&key=${YT_KEY}`);
    const items = s.items || [];
    if (!items.length) return [];
    const v = await getJSON(`${G}videos?part=contentDetails&id=${items.map((i) => i.id.videoId).join(',')}&key=${YT_KEY}`);
    const dur = new Map((v.items || []).map((i) => [i.id, isoSecs(i.contentDetails?.duration)]));
    const ranked = items.map((i) => ({ id: i.id.videoId, title: decodeHtml(i.snippet.title), channel: i.snippet.channelTitle, d: dur.get(i.id.videoId) || 0 }))
      .map((c) => ({ ...c, s: matchScore(c, t) })).sort((a, b) => b.s - a.s);
    const good = ranked.filter((c) => c.s >= 4);
    return (good.length ? good : ranked).slice(0, 3).map((c) => c.id);
  }

  // Deezer's 30-second preview, fetched fresh each time (preview links expire)
  let previewNoted = false;
  async function playPreview(t, tok, why) {
    try {
      const x = await dzp('/track/' + t.id.slice(2));
      if (tok !== P.tok) return true;
      if (!x.preview) return false;
      P.eng = 'audio'; paintVideoBtn();
      $('#liveTag').textContent = 'Preview'; $('#liveTag').hidden = false;
      audio.src = x.preview;
      audio.play().catch(() => setPlaying(false));
      if (!previewNoted || why === 'nomatch') {
        previewNoted = true;
        toast(why === 'nomatch' ? 'Full song not found — playing a 30-second preview' : 'Playing a 30-second preview');
      }
      return true;
    } catch { return false; }
  }

  function playList(list, start = 0, { shuffle = false, label = '' } = {}) {
    list = list.filter(Boolean).map(slim);
    if (!list.length) return;
    if (shuffle) { setShuffle(true, false); start = (Math.random() * list.length) | 0; }
    P.orig = list.slice(); P.label = label;
    if (P.shuffle) { const first = list[start]; list = [first, ...shuffled(list.filter((_, k) => k !== start))]; start = 0; }
    P.q = list; P.i = start;
    playTrack(P.q[P.i]);
  }
  function setShuffle(on, reorder = true) {
    P.shuffle = on; store.set('shuf', on);
    if (reorder && P.mode === 'song' && P.q.length) {
      const cur = P.q[P.i];
      if (on) P.q = [...P.q.slice(0, P.i + 1), ...shuffled(P.q.slice(P.i + 1))];
      else if (P.orig) { const k = P.orig.findIndex((x) => x.id === cur?.id); if (k >= 0) { P.q = P.orig.slice(); P.i = k; } }
      renderQueue();
    }
    paintModes();
  }
  function cycleRepeat() { P.repeat = (P.repeat + 1) % 3; store.set('rep', P.repeat); paintModes(); toast(['Repeat off', 'Repeating the queue', 'Repeating this song'][P.repeat]); }

  async function similarTo(t, exclude = []) {
    const ex = new Set(exclude.map((x) => x.id));
    try {
      let list;
      if (t?.aid?.startsWith('dz')) list = (await M(`recs?a=${t.aid}&n=40`)).tracks;
      else if (t?.src === 'au') list = (await A(`/tracks/trending?time=week&limit=60${t.g ? '&genre=' + enc(t.g) : ''}`)).map(auTrack);
      else list = (await M('chart')).tracks;
      return shuffled(list.filter((x) => !ex.has(x.id))).slice(0, 15);
    } catch { return []; }
  }
  let sleepT = null, sleepEnd = false;
  async function next(auto = false) {
    if (P.mode !== 'song') return;
    if (auto && sleepEnd) { sleepEnd = false; paintSleep(false); setPlaying(false); toast('Sleep timer — stopped'); return; }
    if (auto && P.repeat === 2) { playTrack(P.cur); return; }
    if (P.i < P.q.length - 1) { P.i++; playTrack(P.q[P.i]); return; }
    if (P.repeat === 1 && P.q.length) { P.i = 0; playTrack(P.q[0]); return; }
    if (S.cfg.autoplay && P.cur) {
      const tok = P.tok;
      const more = await similarTo(P.cur, P.q);
      if (tok !== P.tok) return;
      if (more.length) { P.q.push(...more); P.orig?.push(...more); P.i++; toast('Keeping it going with similar songs'); playTrack(P.q[P.i]); return; }
    }
    setPlaying(false);
  }
  function prev() {
    if (P.mode !== 'song') return;
    if (position() > 3 || P.i <= 0) { seek(0); return; }
    P.i--; playTrack(P.q[P.i]);
  }
  function onEnded() { next(true); }
  // skip a song that won't play, but stop after a few in a row instead of racing through the queue
  function failSkip(msg, tok = P.tok) {
    setBuffering(false);
    P.fails = (P.fails || 0) + 1;
    if (P.fails >= 4) { P.fails = 0; setPlaying(false); toast('Songs aren’t loading right now. Try again in a bit.'); return; }
    toast(msg);
    setTimeout(() => { if (tok === P.tok) next(true); }, 700);
  }
  async function songRadio(t) {
    toast(`Starting radio from “${t.t}”`);
    const more = await similarTo(t, [t]);
    playList([t, ...more], 0, { label: `Radio · ${t.t}` });
  }
  function playNext(tracks) {
    tracks = tracks.map(slim);
    if (P.mode !== 'song') { playList(tracks); return; }
    P.q.splice(P.i + 1, 0, ...tracks); renderQueue(); toast(tracks.length > 1 ? `${tracks.length} songs play next` : 'Plays next');
  }
  function addToQueue(tracks) {
    tracks = tracks.map(slim);
    if (P.mode !== 'song') { playList(tracks); return; }
    P.q.push(...tracks); P.orig?.push(...tracks); renderQueue(); toast(tracks.length > 1 ? `Added ${tracks.length} songs to the queue` : 'Added to the queue');
  }

  function playStation(st) {
    ++P.tok; stopEngines();
    P.mode = 'radio'; P.station = st; P.cur = null; P.eng = 'audio'; P.q = []; P.i = -1;
    setNow({ title: st.name, sub: [st.cc, st.br ? `${st.br} kbps` : '', 'Live radio'].filter(Boolean).join(' · '), art: st.art, small: st.art, seed: st.name, live: true });
    setBuffering(true); showPlayer(); paintVideoBtn(); setVideo(false);
    audio.src = st.url;
    audio.play().catch(() => { setBuffering(false); toast('Press play to start the station'); });
    S.tuned = [slimSt(st), ...S.tuned.filter((x) => x.id !== st.id)].slice(0, 12); save('tuned');
    markCurrent(); renderQueue();
  }
  async function playStream(s) {
    if (FILE) { toast('Lofi streams need the site online — YouTube won’t play in a file you opened directly'); return; }
    const tok = ++P.tok; stopEngines();
    P.mode = 'stream'; P.stream = s; P.cur = null; P.eng = 'yt'; P.q = []; P.i = -1;
    setNow({ title: s[1], sub: s[2] + ' · Live', art: `https://i.ytimg.com/vi/${s[0]}/hqdefault.jpg`, seed: s[1], live: true });
    showPlayer(); setVideo(true); setBuffering(true); paintVideoBtn(); markCurrent(); renderQueue();
    try { const pl = await ytPlayer(); if (tok !== P.tok) return; pl.loadVideoById(s[0]); }
    catch (e) { setBuffering(false); toast(e.message); }
  }

  function toggle() {
    if (!P.mode) return;
    if (P.eng === 'audio') { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); }
    else if (yt.p?.getPlayerState) { const s = yt.p.getPlayerState(); if (s === 1 || s === 3) yt.p.pauseVideo(); else yt.p.playVideo(); }
  }
  function pause() { if (P.eng === 'audio') audio.pause(); else yt.p?.pauseVideo?.(); }
  const position = () => (P.eng === 'audio' ? audio.currentTime || 0 : yt.p?.getCurrentTime?.() || 0);
  const duration = () => { if (P.mode !== 'song') return 0; const d = P.eng === 'audio' ? audio.duration : yt.p?.getDuration?.(); return isFinite(d) && d > 0 ? d : P.cur?.d || 0; };
  function seek(s) { if (P.mode !== 'song') return; if (P.eng === 'audio') audio.currentTime = s; else yt.p?.seekTo?.(s, true); }
  function applyVol() {
    audio.volume = S.cfg.muted ? 0 : S.cfg.vol;
    if (yt.p?.setVolume) { yt.p.setVolume(Math.round(S.cfg.vol * 100)); S.cfg.muted ? yt.p.mute() : yt.p.unMute(); }
    $('#vol').value = Math.round(S.cfg.vol * 100);
    $('#muteBtn').innerHTML = ic(S.cfg.muted || S.cfg.vol === 0 ? 'mute' : 'vol');
  }
  function closePlayer() {
    ++P.tok; stopEngines();
    P.mode = null; P.cur = null; P.q = []; P.i = -1; P.station = null; P.stream = null;
    setVideo(false); setPlaying(false); setBuffering(false);
    $('#bar').hidden = true; document.body.classList.remove('playing-bar');
    drawer(false);
    markCurrent(); renderQueue();
  }

  /* ================= now-playing UI ================= */
  function setNow({ title, sub, subHref = '', art: big, small, seed, live = false }) {
    $('#barTitle').textContent = title; $('#barSub').textContent = sub;
    $('#npTitle').textContent = title;
    $('#npSub').innerHTML = subHref ? `<a href="${esc(subHref)}">${esc(sub)}</a>` : esc(sub);
    for (const [id, src] of [['#barArt', small || big], ['#npArt', big || small]]) {
      const img = $(id);
      if (src) { img.src = src; img.style.cssText = ''; } else { img.removeAttribute('src'); img.style.cssText = phStyle(seed); }
    }
    $('#bar').classList.toggle('live', live);
    $('#liveTag').textContent = 'On air';
    $('#liveTag').hidden = !live;
    $('#dockTitle').textContent = title;
    tint(small || big, seed);
    paintNowLike();
    $$('[data-act=shuffle],[data-act=repeat],[data-act=prev],[data-act=next]').forEach((b) => (b.disabled = live));
    ['#npLike', '#npAdd', '#npRadio', '#barLike'].forEach((s) => ($(s).disabled = P.mode !== 'song'));
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title, artist: sub, artwork: big || small ? [{ src: big || small, sizes: '512x512' }] : [] });
    }
  }
  function tint(src, seed) {
    const set = (c) => document.documentElement.style.setProperty('--tint', c);
    set(`hsl(${hash(seed || src) % 360} 55% 50%)`);
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 10;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0, 10, 10);
        const d = x.getImageData(0, 0, 10, 10).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { const l = d[i] + d[i + 1] + d[i + 2]; if (l < 60 || l > 700) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        if (n) set(`rgb(${(r / n) | 0},${(g / n) | 0},${(b / n) | 0})`);
      } catch { /* image not CORS-readable */ }
    };
    img.src = src;
  }
  function setPlaying(on) {
    P.playing = on;
    if (on) P.fails = 0;
    document.body.classList.toggle('paused', !on);
    $$('[data-act=toggle]').forEach((b) => (b.innerHTML = ic(on ? 'pause' : 'play')));
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = on ? 'playing' : 'paused';
  }
  const setBuffering = (on) => document.body.classList.toggle('buffering', on);
  function showPlayer() { $('#bar').hidden = false; document.body.classList.add('playing-bar'); paintPanel(); }
  function paintModes() {
    $$('[data-act=shuffle]').forEach((b) => b.classList.toggle('on', P.shuffle));
    $$('[data-act=repeat]').forEach((b) => { b.classList.toggle('on', P.repeat > 0); b.innerHTML = ic(P.repeat === 2 ? 'repeat1' : 'repeat'); });
  }
  function paintNowLike() {
    const on = !!(P.cur && isLiked(P.cur));
    ['#npLike', '#barLike'].forEach((s) => $(s).classList.toggle('on', on));
  }
  function paintVideoBtn() {
    const can = P.eng === 'yt';
    ['#videoBtn', '#npVideo'].forEach((s) => { $(s).disabled = !can; $(s).classList.toggle('on', can && !$('#dock').classList.contains('off')); });
  }
  function setVideo(on) { $('#dock').classList.toggle('off', !on); if (!on) $('#dock').classList.remove('big'); paintVideoBtn(); }
  function paintPanel() { $('#panelBtn').classList.toggle('on', $('#np').classList.contains('open')); }
  function drawer(on) {
    $('#np').classList.toggle('open', on);
    $('#npScrim').classList.toggle('on', on);
    paintPanel();
  }
  function paintSleep(on) { $('#sleepBtn').classList.toggle('on', on); }
  function markCurrent() {
    $$('.row.on').forEach((r) => r.classList.remove('on'));
    if (P.mode === 'song' && P.cur) $$(`.row[data-tid="${CSS.escape(P.cur.id)}"]`).forEach((r) => r.classList.add('on'));
    $$('.st.on,.stream.on').forEach((r) => r.classList.remove('on'));
    if (P.station) $$(`.st[data-sid="${CSS.escape(P.station.id)}"]`).forEach((r) => r.classList.add('on'));
    if (P.stream) $$(`.stream[data-v="${CSS.escape(P.stream[0])}"]`).forEach((r) => r.classList.add('on'));
  }
  function renderQueue() {
    for (const k of LISTS.keys()) if (k.startsWith('Q')) LISTS.delete(k);
    const box = $('#npQueue');
    $('#qClear').hidden = !(P.mode === 'song' && P.q.length > P.i + 1);
    if (P.mode === 'radio') { $('#qLabel').textContent = 'On air'; box.innerHTML = `<p class="note">Live stations don't have a queue. ${(P.station.tags || []).map(esc).join(' · ')}</p>`; return; }
    if (P.mode === 'stream') { $('#qLabel').textContent = 'Live stream'; box.innerHTML = '<p class="note">This plays in the video window. You can keep browsing while it plays.</p>'; return; }
    if (P.mode !== 'song') { $('#qLabel').textContent = 'Up next'; box.innerHTML = ''; return; }
    const up = P.q.slice(P.i + 1);
    $('#qLabel').textContent = P.label ? `Up next · ${P.label}` : 'Up next';
    box.innerHTML = up.length ? rows(up, { compact: true, pfx: 'Q', drag: true, ctx: 'queue' }) : `<p class="note">${S.cfg.autoplay ? 'Similar songs will keep playing after this one.' : 'Nothing queued.'}</p>`;
    const ol = $('ol', box);
    if (ol) sortable(ol, (from, to) => { const base = P.i + 1; const [x] = P.q.splice(base + from, 1); P.q.splice(base + to, 0, x); renderQueue(); });
  }

  // progress ticker
  let dragging = false;
  setInterval(() => {
    if (!P.mode || P.mode !== 'song') return;
    const d = duration(), c = position();
    const pct = d ? Math.min(1, c / d) : 0;
    if (!dragging) { $('#seek').value = $('#npSeek').value = pct * 1000; $('#seekFill').style.width = pct * 100 + '%'; }
    $('#tCur').textContent = $('#npCur').textContent = fmt(c);
    $('#tDur').textContent = $('#npDur').textContent = fmt(d);
  }, 250);
  for (const s of ['#seek', '#npSeek']) {
    $(s).addEventListener('input', (e) => { dragging = true; $('#seekFill').style.width = e.target.value / 10 + '%'; $('#tCur').textContent = $('#npCur').textContent = fmt((e.target.value / 1000) * duration()); });
    $(s).addEventListener('change', (e) => { seek((e.target.value / 1000) * duration()); dragging = false; });
  }

  /* ================= likes, playlists, follows ================= */
  function toggleLike(t) {
    if (!t) return;
    if (isLiked(t)) { S.liked = S.liked.filter((x) => x.id !== t.id); toast('Removed from Liked songs'); }
    else { S.liked.unshift(slim(t)); toast('Saved to Liked songs'); }
    save('liked');
    $$(`[data-tid="${CSS.escape(t.id)}"] [data-like]`).forEach((b) => b.classList.toggle('on', isLiked(t)));
    paintNowLike(); paintSide();
  }
  function newList(name, tracks = []) {
    const l = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name || `Playlist ${S.lists.length + 1}`, tracks: tracks.map(slim), at: Date.now() };
    S.lists.unshift(l); save('lists'); paintSide();
    return l;
  }
  function addToList(id, tracks) {
    const l = S.lists.find((x) => x.id === id);
    if (!l) return;
    let n = 0;
    for (const t of tracks) if (!l.tracks.some((x) => x.id === t.id)) { l.tracks.push(slim(t)); n++; }
    save('lists'); paintSide();
    toast(n ? `Added to ${l.name}` : `Already in ${l.name}`);
  }
  async function createListWith(tracks) {
    const name = await askText('New playlist', `Playlist ${S.lists.length + 1}`, 'Create');
    if (name === null) return null;
    const l = newList(name, tracks);
    toast(tracks.length ? `Created ${l.name}` : `${l.name} is ready`);
    return l;
  }
  const FMETA = new Map();
  const isFollowing = (id) => S.follows.some((f) => f.id === id);
  function followBtn(a) { FMETA.set(a.id, a); const on = isFollowing(a.id); return `<button class="btn ghost${on ? ' on' : ''}" data-follow="${esc(a.id)}">${on ? 'Following' : 'Follow'}</button>`; }
  function toggleFollow(id) {
    const a = FMETA.get(id) || S.follows.find((f) => f.id === id);
    if (!a) return;
    const on = isFollowing(id);
    S.follows = on ? S.follows.filter((f) => f.id !== id) : [{ id, name: a.name, pic: a.pic || '' }, ...S.follows];
    save('follows');
    $$(`[data-follow="${CSS.escape(id)}"]`).forEach((b) => { b.classList.toggle('on', !on); b.textContent = on ? 'Follow' : 'Following'; });
    toast(on ? `Unfollowed ${a.name}` : `Following ${a.name}`);
  }
  function paintSide() { /* playlists live in the Playlists tab */ }

  /* ================= menus ================= */
  const menu = $('#menu');
  let menuCtx = null, menuY = 0;
  function openMenu(anchor, html, ctx) {
    menuCtx = ctx; menu.innerHTML = html; menu.hidden = false; menuY = scrollY;
    const r = anchor.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
    let x = r.right - mw, y = r.bottom + 6;
    if (x < 8) x = 8;
    if (y + mh > innerHeight - 8) y = Math.max(8, r.top - mh - 6);
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
  }
  const closeMenu = () => { menu.hidden = true; menuCtx = null; };
  function trackMenu(anchor, t, opts = {}) {
    const inList = opts.listId && opts.listId !== 'liked';
    openMenu(anchor, `
      <button data-m="next">${ic('next2')}Play next</button>
      <button data-m="queue">${ic('queue')}Add to queue</button>
      <button data-m="radio">${ic('wave')}Start song radio</button>
      <button data-m="add">${ic('plus')}Add to playlist…</button>
      <button data-m="like">${ic('heart')}${isLiked(t) ? 'Remove from Liked' : 'Save to Liked'}</button>
      <hr>
      ${t.aid ? `<a href="#/artist/${esc(t.aid)}" data-m="go">${ic('user')}Go to artist</a>` : ''}
      ${t.alid?.startsWith('dz') ? `<a href="#/album/${esc(t.alid)}" data-m="go">${ic('disc')}Go to album</a>` : ''}
      ${inList ? `<hr><button data-m="rmlist" class="danger">${ic('trash')}Remove from this playlist</button>` : ''}
      ${opts.queueIdx != null ? `<hr><button data-m="rmq" class="danger">${ic('trash')}Remove from queue</button>` : ''}`, { kind: 'track', t, anchor, ...opts });
  }
  function addMenu(anchor, tracks) {
    openMenu(anchor, `<div class="mh">Add ${tracks.length > 1 ? tracks.length + ' songs' : 'to playlist'}</div>
      <button data-m="newlist">${ic('plus')}New playlist</button>${S.lists.length ? '<hr>' : ''}
      ${S.lists.map((l) => `<button data-m="tolist" data-id="${esc(l.id)}">${ic('queue')}${esc(l.name)}</button>`).join('')}`, { kind: 'add', tracks, anchor });
  }
  menu.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-m]');
    if (!b || !menuCtx) return;
    const c = menuCtx, m = b.dataset.m;
    if (m === 'go') { closeMenu(); return; }
    if (m === 'add') { addMenu(c.anchor, [c.t]); return; }
    closeMenu();
    if (m === 'next') playNext([c.t]);
    else if (m === 'queue') addToQueue([c.t]);
    else if (m === 'radio') songRadio(c.t);
    else if (m === 'like') toggleLike(c.t);
    else if (m === 'rmlist') { const l = S.lists.find((x) => x.id === c.listId); if (l) { l.tracks = l.tracks.filter((x) => x.id !== c.t.id); save('lists'); paintSide(); route(); } }
    else if (m === 'rmq') { P.q.splice(P.i + 1 + c.queueIdx, 1); renderQueue(); }
    else if (m === 'newlist') createListWith(c.tracks);
    else if (m === 'tolist') addToList(b.dataset.id, c.tracks);
    else if (m === 'sleep') setSleep(b.dataset.v);
  });
  addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('[data-more],#npAdd,#sleepBtn,[data-addall]')) closeMenu(); });
  $('#main').addEventListener('scroll', closeMenu, { passive: true });

  function setSleep(v) {
    clearTimeout(sleepT); sleepT = null; sleepEnd = false;
    if (v === 'end') { sleepEnd = true; toast('Stopping after this song'); }
    else if (+v) { sleepT = setTimeout(() => { pause(); paintSleep(false); toast('Sleep timer — paused'); }, +v * 60e3); toast(`Pausing in ${v} minutes`); }
    else toast('Sleep timer off');
    paintSleep(v !== '0');
  }

  /* ================= drag to reorder ================= */
  function sortable(ol, onMove) {
    let from = null;
    ol.addEventListener('dragstart', (e) => { const li = e.target.closest('li[draggable]'); if (!li) return; from = +li.dataset.i; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ''); });
    ol.addEventListener('dragover', (e) => { if (from == null) return; e.preventDefault(); $$('.drop', ol).forEach((x) => x.classList.remove('drop')); e.target.closest('li[draggable]')?.classList.add('drop'); });
    ol.addEventListener('drop', (e) => { e.preventDefault(); const li = e.target.closest('li[draggable]'); if (li && from != null && +li.dataset.i !== from) onMove(from, +li.dataset.i); from = null; });
    ol.addEventListener('dragend', () => { from = null; $$('.dragging,.drop', ol).forEach((x) => x.classList.remove('dragging', 'drop')); });
  }

  /* ================= router ================= */
  const V = $('#view');
  let VT = 0;
  function parse() {
    const h = location.hash.slice(1) || '/';
    const [path, qs] = h.split('?');
    return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(qs || '') };
  }
  const live = (tok) => tok === VT;
  async function route() {
    const { parts, q } = parse();
    const tok = ++VT;
    for (const k of LISTS.keys()) if (!k.startsWith('Q')) LISTS.delete(k);
    closeMenu();
    const r = parts[0] || 'home';
    CUR_TAB = { home: 'home', library: 'library', list: 'library', radio: 'radio', lofi: 'lofi' }[r] || '';
    paintChans(CUR_TAB);
    document.body.classList.toggle('m-compact', r !== 'home');
    if (r !== 'search' && MQ.value && document.activeElement !== MQ) MQ.value = '';
    scrollTo({ top: 0, behavior: 'instant' });
    const views = { home: viewHome, search: viewSearch, library: viewLibrary, radio: viewRadio, lofi: viewLofi, artist: viewArtist, album: viewAlbum, list: viewList, aplaylist: viewAPlaylist, mix: viewMix, chart: viewChart };
    try { await (views[r] || viewHome)(parts[1], q, tok); }
    catch (e) { if (live(tok)) V.innerHTML = errBox(e); console.error(e); }
    markCurrent();
  }
  addEventListener('hashchange', route);

  /* --- music channel panels (same feel as the homepage hero) --- */
  let CUR_TAB = 'home';
  const CHANS = $$('#mchans .m-panel');
  function paintChans(id) {
    CHANS.forEach((p) => {
      p.classList.toggle('on', p.dataset.nav === id);
      p.classList.toggle('cur', p.dataset.nav === CUR_TAB);
      if (p.dataset.nav === CUR_TAB) p.setAttribute('aria-current', 'page'); else p.removeAttribute('aria-current');
    });
  }
  CHANS.forEach((p) => ['mouseenter', 'focus'].forEach((ev) => p.addEventListener(ev, () => paintChans(p.dataset.nav))));
  $('#mchans').addEventListener('mouseleave', () => paintChans(CUR_TAB));
  $('#mchans').addEventListener('focusout', (e) => { if (!$('#mchans').contains(e.relatedTarget)) paintChans(CUR_TAB); });
  // nav background once scrolled
  const onScroll = () => $('#mnav').classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', () => { onScroll(); if (!menu.hidden && Math.abs(scrollY - menuY) > 60) closeMenu(); }, { passive: true });

  /* --- the hero search box drives the search page --- */
  const MQ = $('#mq');
  let mqDeb;
  const goSearch = (v, remember) => {
    if (remember) rememberSearch(v);
    if (parse().parts[0] !== 'search') { location.hash = '#/search' + (v ? '?q=' + enc(v) : ''); return; }
    history.replaceState(null, '', '#/search' + (v ? '?q=' + enc(v) : ''));
    paintHist(); searchResults(v);
  };
  MQ.addEventListener('input', () => { clearTimeout(mqDeb); mqDeb = setTimeout(() => { const v = MQ.value.trim(); if (v || parse().parts[0] === 'search') goSearch(v); }, 320); });
  MQ.addEventListener('focus', () => { if (!MQ.value && S.searches.length && parse().parts[0] !== 'search') location.hash = '#/search'; });
  $('#mfind').onsubmit = (e) => { e.preventDefault(); clearTimeout(mqDeb); goSearch(MQ.value.trim(), true); };
  MQ.addEventListener('keydown', (e) => { if (e.key === 'Escape') { MQ.value = ''; MQ.blur(); if (parse().parts[0] === 'search') location.hash = '#/'; } });
  const fill = (id, html, tok) => { const el = document.getElementById(id); if (el && live(tok)) el.innerHTML = html; return el; };

  /* ================= views ================= */
  function jumpHTML(n = 12) {
    const items = S.activity.slice(0, n);
    if (!items.length) return '';
    return `<section class="sec">${secHead(1, 'Pick up where you left off', '', '<button class="link" data-clearjump>Clear</button>')}
      <div class="jump">${items.map((a, i) => {
        const label = { song: 'Song', artist: 'Artist', album: 'Album', aplaylist: 'Playlist', mix: 'Mix' }[a.k] || '';
        const inner = `${art(a.img, a.t)}<span><small>${label}</small><b>${esc(a.t)}</b>${a.s ? `<em>${esc(a.s)}</em>` : ''}</span>`;
        const x = `<button class="ib sm x" data-unjump="${i}" aria-label="Remove ${esc(a.t)}">${ic('close')}</button>`;
        return a.k === 'song' ? `<button class="jb" data-jump="${i}">${inner}${x}</button>` : `<a class="jb${a.k === 'artist' ? ' art' : ''}" href="${esc(a.href || '#/')}">${inner}${x}</a>`;
      }).join('')}</div></section>`;
  }

  async function viewHome(_, __, tok) {
    const h = new Date().getHours();
    $('#mGreet').textContent = (h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + ' · ' + new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const seeds = topArtists(5);
    let n = S.activity.length ? 1 : 0;
    V.innerHTML = `
      ${jumpHTML()}
      <section class="sec">${secHead(++n, 'Tuned for you', seeds.length ? `Because you play ${seeds.slice(0, 3).map((s) => esc(s.name)).join(', ')}` : 'Play and like songs — this learns what you’re into', `<button class="btn ghost" id="recNew">${ic('dice')}New picks</button><button class="btn ghost" id="recShuf">${ic('shuffle')}Shuffle</button><button class="btn hot" id="recPlay">${ic('play')}Play</button>`)}<div id="recBox">${skelRows(6)}</div></section>
      <section class="sec">${secHead(++n, 'The chart', 'Top songs worldwide right now', `<button class="btn hot" id="chartPlay">${ic('play')}Play all</button>`)}<div id="chartBox">${skelRows(6)}</div></section>
      <section class="sec">${secHead(++n, 'Artists everyone’s playing')}<div id="artBox">${skelCards(7)}</div></section>
      <section class="sec">${secHead(++n, 'Community playlists', 'Trending on Audius')}<div id="plBox">${skelCards(6)}</div></section>`;


    // recommendations
    let recs = [], recShown = 10;
    const paintRecs = () => fill('recBox', recs.length ? rows(recs.slice(0, recShown)) + (recs.length > recShown ? '<div class="more-row"><button class="btn ghost" id="recMore">Show more</button></div>' : '') : emptyBox('Nothing yet', 'Play a few songs and check back.'), tok);
    const loadRecs = async (fresh) => {
      fill('recBox', skelRows(6), tok);
      try {
        const j = seeds.length ? await M(`recs?a=${seeds.map((s) => s.id).join(',')}&n=40`, fresh) : await M('chart');
        recs = seeds.length ? j.tracks : shuffled(j.tracks).slice(0, 30); recShown = 10; paintRecs();
      } catch (e) { fill('recBox', errBox(e), tok); }
    };
    loadRecs();
    $('#recNew').onclick = () => loadRecs(true);
    $('#recPlay').onclick = () => playList(recs, 0, { label: 'Tuned for you' });
    $('#recShuf').onclick = () => playList(recs, 0, { shuffle: true, label: 'Tuned for you' });
    V.addEventListener('click', (e) => { if (e.target.id === 'recMore') { recShown = recs.length; paintRecs(); markCurrent(); } });

    // chart + artists
    M('chart').then((j) => {
      fill('chartBox', rows(j.tracks.slice(0, 10)) + '<div class="more-row"><a class="btn ghost" href="#/chart">See the full top 50</a></div>', tok);
      fill('artBox', `<div class="hscroll">${j.artists.map(artistCard).join('')}</div>`, tok);
      const b = $('#chartPlay'); if (b) b.onclick = () => playList(j.tracks, 0, { label: 'The chart' });
      markCurrent();
    }).catch((e) => { fill('chartBox', errBox(e), tok); fill('artBox', '', tok); });

    A('/playlists/trending?limit=16').then((list) => {
      fill('plBox', `<div class="hscroll">${list.map((p) => card({ href: `#/aplaylist/${p.id}`, img: p.artwork?.['480x480'] || p.artwork?.['150x150'], title: p.playlist_name, sub: `${p.user?.name || ''}${p.track_count ? ' · ' + p.track_count + ' songs' : ''}`, play: `aplaylist:${p.id}` })).join('')}</div>`, tok);
    }).catch(() => fill('plBox', emptyBox('Couldn’t reach Audius'), tok));
  }

  async function viewChart(_, __, tok) {
    V.innerHTML = `<a class="back" href="#/">${ic('back')}Discover</a><div class="ph-head"><div class="cover">${ph('Top 50')}</div><div><span class="eyebrow">Chart</span><h1>The Top 50</h1><div class="meta">Worldwide · updated daily</div><div class="page-acts"><button class="btn hot" id="pPlay">${ic('play')}Play</button><button class="btn ghost" id="pShuf">${ic('shuffle')}Shuffle</button></div></div></div><div id="cBox">${skelRows(10)}</div>`;
    const j = await M('chart');
    if (!live(tok)) return;
    fill('cBox', rows(j.tracks), tok);
    $('#pPlay').onclick = () => playList(j.tracks, 0, { label: 'Top 50' });
    $('#pShuf').onclick = () => playList(j.tracks, 0, { shuffle: true, label: 'Top 50' });
  }

  /* --- search --- */
  let searchTok = 0;
  function rememberSearch(q) { q = q.trim(); if (!q) return; S.searches = [q, ...S.searches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 10); save('searches'); }
  function paintHist() {
    const box = $('#sHist'); if (!box) return;
    box.innerHTML = !MQ.value.trim() && S.searches.length ? `<span class="hist-l">Recent</span>${S.searches.map((s, i) => `<button class="chip" data-hs="${esc(s)}">${esc(s)}<span class="x" data-hx="${i}" aria-label="Remove">×</span></button>`).join('')}` : '';
  }
  async function viewSearch(_, q) {
    const query = q.get('q') || '';
    if (document.activeElement !== MQ) MQ.value = query;
    V.innerHTML = `<div class="hist" id="sHist"></div><div id="sRes"></div>`;
    $('#sHist').onclick = (e) => {
      const x = e.target.closest('[data-hx]');
      if (x) { S.searches.splice(+x.dataset.hx, 1); save('searches'); paintHist(); return; }
      const b = e.target.closest('[data-hs]'); if (b) { MQ.value = b.dataset.hs; goSearch(b.dataset.hs, true); }
    };
    paintHist(); searchResults(MQ.value.trim());
  }
  async function searchResults(q) {
    const tok = ++searchTok, box = $('#sRes');
    for (const k of LISTS.keys()) if (!k.startsWith('Q')) LISTS.delete(k);
    if (!q) {
      box.innerHTML = `<section class="sec">${secHead(1, 'Or try')}<div class="chips">${['Taylor Swift', 'Drake', 'Lofi', 'Bad Bunny', 'The Weeknd', 'Kendrick Lamar', 'Billie Eilish', 'Daft Punk', 'Afrobeats', 'Classic rock'].map((s) => `<a class="chip" href="#/search?q=${enc(s)}">${esc(s)}</a>`).join('')}</div></section>`;
      return;
    }
    box.innerHTML = skelRows(8);
    const [cat, au] = await Promise.allSettled([M('search?q=' + enc(q)), A(`/tracks/search?query=${enc(q)}&limit=15`)]);
    if (tok !== searchTok) return;
    const j = cat.status === 'fulfilled' ? cat.value : { tracks: [], artists: [], albums: [] };
    const aut = au.status === 'fulfilled' ? (au.value || []).map(auTrack) : [];
    if (!j.tracks.length && !j.artists.length && !aut.length) {
      box.innerHTML = cat.status === 'rejected' ? errBox(cat.reason) : emptyBox('No matches', 'Check the spelling or try the artist’s name.');
      return;
    }
    const top = j.artists.find((a) => a.name.toLowerCase() === q.toLowerCase()) || j.artists[0];
    let n = 0;
    box.innerHTML = `
      ${top ? `<section class="sec">${secHead(++n, 'Top result')}<a class="jb art" href="#/artist/${esc(top.id)}" style="max-width:420px;padding:12px 30px 12px 12px">${art(top.pic, top.name)}<span><small>Artist</small><b style="font-size:20px;font-family:var(--serif)">${esc(top.name)}</b><em>${fans(top.fans)} fans</em></span></a></section>` : ''}
      ${j.tracks.length ? `<section class="sec">${secHead(++n, 'Songs', '', `<button class="btn hot" id="srPlay">${ic('play')}Play all</button>`)}${rows(j.tracks.slice(0, 20))}</section>` : ''}
      ${j.artists.length ? `<section class="sec">${secHead(++n, 'Artists')}<div class="hscroll">${j.artists.map(artistCard).join('')}</div></section>` : ''}
      ${j.albums.length ? `<section class="sec">${secHead(++n, 'Albums')}<div class="hscroll">${j.albums.map((a) => card({ href: `#/album/${a.id}`, img: a.art, title: a.t, sub: `${a.a}${a.year ? ' · ' + a.year : ''}`, play: `album:${a.id}` })).join('')}</div></section>` : ''}
      ${aut.length ? `<section class="sec">${secHead(++n, 'On Audius', 'Independent uploads')}${rows(aut)}</section>` : ''}`;
    const sp = $('#srPlay'); if (sp) sp.onclick = () => { rememberSearch(q); playList(j.tracks.slice(0, 20), 0, { label: `Search · ${q}` }); };
    box.addEventListener('click', (e) => { if (e.target.closest('.row,.artist,.card,.jb')) rememberSearch(q); }, { once: true });
    markCurrent();
  }

  /* --- library --- */
  function viewLibrary(_, q) {
    const tab = q.get('tab') || 'playlists';
    const T = [['playlists', 'Playlists'], ['liked', 'Liked songs'], ['artists', 'Artists'], ['stations', 'Stations'], ['history', 'History']];
    let body = '';
    if (tab === 'playlists') {
      body = `<div class="grid">
        <button class="card new-card" data-newlist><div class="sleeve">${ic('plus')}</div><b>New playlist</b><small>Start from scratch</small></button>
        <a class="card" href="#/list/liked"><div class="sleeve"><span class="disc"></span><span class="ph" style="background:linear-gradient(135deg,#ff3d6e,#3b2bd9);width:100%;height:100%;border-radius:6px;position:relative;z-index:1">${ic('heart')}</span>${S.liked.length ? `<button class="card-play" data-cplay="list:liked" aria-label="Play">${ic('play')}</button>` : ''}</div><b>Liked songs</b><small>${S.liked.length} songs</small></a>
        ${S.lists.map(listCard).join('')}</div>`;
    } else if (tab === 'liked') {
      body = S.liked.length ? `<div class="page-acts" style="margin:0 0 14px"><button class="btn hot" data-cplay="list:liked">${ic('play')}Play</button><button class="btn ghost" data-shufflelist="liked">${ic('shuffle')}Shuffle</button></div>${rows(S.liked, { ctx: 'liked' })}` : emptyBox('No liked songs yet', 'Tap the heart on any song to keep it here.');
    } else if (tab === 'artists') {
      body = S.follows.length ? `<div class="grid">${S.follows.map(artistCard).join('')}</div>` : emptyBox('Not following anyone', 'Follow artists from their page to see them here.');
    } else if (tab === 'stations') {
      body = S.stations.length ? `<div class="stations">${S.stations.map(stationCard).join('')}</div>` : emptyBox('No saved stations', 'Star a station in Live radio to save it.');
    } else {
      const songs = S.activity.filter((a) => a.k === 'song' && a.ref).map((a) => a.ref);
      body = songs.length ? `<div class="page-acts" style="margin:0 0 14px"><button class="btn ghost" data-clearhist>${ic('trash')}Clear history</button></div>${rows(songs)}` : emptyBox('Nothing played yet');
    }
    V.innerHTML = `<header class="hero"><span class="eyebrow">Library</span><h1>Your <em>playlists</em></h1></header>
      <nav class="tabs">${T.map(([k, l]) => `<a href="#/library?tab=${k}" class="${k === tab ? 'on' : ''}">${l}</a>`).join('')}</nav>${body}`;
  }

  /* --- user playlist / liked --- */
  function viewList(id) {
    const liked = id === 'liked';
    const l = liked ? { id: 'liked', name: 'Liked songs', tracks: S.liked } : S.lists.find((x) => x.id === id);
    if (!l) { V.innerHTML = emptyBox('Playlist not found', 'It may have been deleted.'); return; }
    const dur = l.tracks.reduce((s, t) => s + (t.d || 0), 0);
    V.innerHTML = `<a class="back" href="#/library">${ic('back')}Your playlists</a>
      <div class="ph-head"><div class="cover">${liked ? `<span class="ph" style="background:linear-gradient(135deg,#ff3d6e,#3b2bd9)">${ic('heart')}</span>` : l.tracks.length ? mosaic(l.tracks) : ph(l.name)}</div>
      <div><span class="eyebrow">${liked ? 'Collection' : 'Playlist'}</span><h1 ${liked ? '' : 'data-rename title="Click to rename"'}>${esc(l.name)}</h1>
      <div class="meta">${l.tracks.length} songs${dur ? ' · ' + long(dur) : ''}</div>
      <div class="page-acts">
        <button class="btn hot" data-cplay="list:${esc(l.id)}" ${l.tracks.length ? '' : 'disabled'}>${ic('play')}Play</button>
        <button class="btn ghost" data-shufflelist="${esc(l.id)}">${ic('shuffle')}Shuffle</button>
        ${l.tracks.length ? `<button class="btn ghost" data-radiolist="${esc(l.id)}">${ic('wave')}Radio</button>` : ''}
        ${liked ? '' : `<button class="btn ghost" data-rename>${ic('edit')}Rename</button><button class="btn ghost" data-dellist="${esc(l.id)}">${ic('trash')}Delete</button>`}
      </div></div></div>
      <div id="lBox" class="sec" style="margin-top:28px">${l.tracks.length ? rows(l.tracks, { ctx: l.id, drag: true }) : emptyBox('This playlist is empty', 'Use “Add to playlist…” from any song’s ⋯ menu.')}</div>`;
    const ol = $('#lBox ol');
    if (ol) sortable(ol, (from, to) => { const [x] = l.tracks.splice(from, 1); l.tracks.splice(to, 0, x); save(liked ? 'liked' : 'lists'); viewList(id); markCurrent(); });
  }

  /* --- artist --- */
  async function viewArtist(id, _, tok) {
    V.innerHTML = `<div class="banner" style="background-color:var(--line)"><span class="eyebrow">Artist</span><h1>&nbsp;</h1></div><div class="sec">${skelRows(5)}</div>`;
    let a, tracks, albums = [], related = [];
    if (id.startsWith('au')) {
      const [u, t] = await Promise.all([A(`/users/${id.slice(2)}`), A(`/users/${id.slice(2)}/tracks?limit=50`)]);
      a = { id, name: u.name, pic: u.profile_picture?.['480x480'] || '', big: u.cover_photo?.['2000x'] || u.profile_picture?.['1000x1000'] || '', fans: u.follower_count || 0 };
      tracks = (t || []).map(auTrack);
    } else {
      const j = await M('artist?id=' + enc(id));
      ({ artist: a, tracks, albums, related } = j);
    }
    if (!live(tok)) return;
    remember({ k: 'artist', id, t: a.name, s: 'Artist', img: a.pic, href: `#/artist/${id}` });
    let shown = 5;
    const top = () => rows(tracks.slice(0, shown)) + (tracks.length > shown ? '<div class="more-row"><button class="btn ghost" id="topMore">Show more</button></div>' : '');
    V.innerHTML = `<div class="banner" style="background-image:url('${esc(a.big || a.pic)}')"><span class="eyebrow">${id.startsWith('au') ? 'Audius artist' : 'Artist'}</span><h1>${esc(a.name)}</h1>
      <div style="opacity:.85">${fans(a.fans)} ${id.startsWith('au') ? 'followers' : 'fans'}</div>
      <div class="page-acts"><button class="btn hot" id="aPlay">${ic('play')}Play</button><button class="btn ghost" id="aShuf">${ic('shuffle')}Shuffle</button>${followBtn(a)}${tracks[0] ? `<button class="btn ghost" id="aRadio">${ic('wave')}Radio</button>` : ''}</div></div>
      <section class="sec">${secHead(1, 'Popular')}<div id="topBox">${tracks.length ? top() : emptyBox('No songs found')}</div></section>
      ${albums.length ? `<section class="sec">${secHead(2, 'Discography')}<div class="hscroll">${albums.map((x) => card({ href: `#/album/${x.id}`, img: x.art, title: x.t, sub: `${x.year}${x.type ? ' · ' + x.type[0].toUpperCase() + x.type.slice(1) : ''}`, play: `album:${x.id}` })).join('')}</div></section>` : ''}
      ${related.length ? `<section class="sec">${secHead(albums.length ? 3 : 2, 'Fans also like')}<div class="hscroll">${related.map(artistCard).join('')}</div></section>` : ''}`;
    $('#aPlay').onclick = () => playList(tracks, 0, { label: a.name });
    $('#aShuf').onclick = () => playList(tracks, 0, { shuffle: true, label: a.name });
    const rb = $('#aRadio'); if (rb) rb.onclick = () => songRadio(tracks[0]);
    $('#topBox').onclick = (e) => { if (e.target.id === 'topMore') { shown = tracks.length; $('#topBox').innerHTML = top(); markCurrent(); } };
  }

  /* --- album --- */
  async function viewAlbum(id, _, tok) {
    V.innerHTML = `<div class="ph-head"><div class="cover sk"></div><div><span class="eyebrow">Album</span><h1>&nbsp;</h1></div></div>${skelRows(8)}`;
    const j = await M('album?id=' + enc(id));
    if (!live(tok)) return;
    const al = j.album, dur = j.tracks.reduce((s, t) => s + t.d, 0), aid = j.tracks[0]?.aid;
    remember({ k: 'album', id, t: al.t, s: al.a, img: al.art, href: `#/album/${id}` });
    V.innerHTML = `<div class="ph-head"><div class="cover">${art(al.big || al.art, al.t)}</div>
      <div><span class="eyebrow">${esc(al.type || 'Album')}</span><h1>${esc(al.t)}</h1>
      <div class="meta">${aid ? `<a href="#/artist/${esc(aid)}">${esc(al.a)}</a>` : esc(al.a)}${al.year ? ' · ' + al.year : ''} · ${j.tracks.length} songs · ${long(dur)}</div>
      <div class="page-acts"><button class="btn hot" id="pPlay">${ic('play')}Play</button><button class="btn ghost" id="pShuf">${ic('shuffle')}Shuffle</button><button class="btn ghost" data-addall>${ic('plus')}Add to playlist</button></div></div></div>
      <div class="sec" style="margin-top:28px">${rows(j.tracks, { album: false })}</div>${al.label ? `<p class="eyebrow" style="margin-top:24px">${esc(al.label)}</p>` : ''}`;
    $('#pPlay').onclick = () => playList(j.tracks, 0, { label: al.t });
    $('#pShuf').onclick = () => playList(j.tracks, 0, { shuffle: true, label: al.t });
    PAGE_TRACKS = j.tracks;
  }
  let PAGE_TRACKS = [];

  /* --- audius playlist --- */
  async function viewAPlaylist(id, _, tok) {
    V.innerHTML = `<div class="ph-head"><div class="cover sk"></div><div><span class="eyebrow">Playlist</span><h1>&nbsp;</h1></div></div>${skelRows(8)}`;
    const [meta, tr] = await Promise.all([A(`/playlists/${id}`), A(`/playlists/${id}/tracks`)]);
    if (!live(tok)) return;
    const p = Array.isArray(meta) ? meta[0] : meta, tracks = (tr || []).map(auTrack);
    const img = p?.artwork?.['1000x1000'] || p?.artwork?.['480x480'] || tracks[0]?.big;
    remember({ k: 'aplaylist', id, t: p?.playlist_name || 'Playlist', s: p?.user?.name || 'Audius', img: p?.artwork?.['480x480'] || tracks[0]?.art, href: `#/aplaylist/${id}` });
    V.innerHTML = `<div class="ph-head"><div class="cover">${art(img, p?.playlist_name)}</div>
      <div><span class="eyebrow">Audius playlist</span><h1>${esc(p?.playlist_name || 'Playlist')}</h1>
      <div class="meta">${p?.user ? `<a href="#/artist/au${esc(p.user.id)}">${esc(p.user.name)}</a> · ` : ''}${tracks.length} songs · ${long(tracks.reduce((s, t) => s + t.d, 0))}</div>
      <div class="page-acts"><button class="btn hot" id="pPlay">${ic('play')}Play</button><button class="btn ghost" id="pShuf">${ic('shuffle')}Shuffle</button><button class="btn ghost" data-addall>${ic('plus')}Save as playlist</button></div></div></div>
      <div class="sec" style="margin-top:28px">${tracks.length ? rows(tracks) : emptyBox('This playlist is empty')}</div>`;
    $('#pPlay').onclick = () => playList(tracks, 0, { label: p?.playlist_name });
    $('#pShuf').onclick = () => playList(tracks, 0, { shuffle: true, label: p?.playlist_name });
    PAGE_TRACKS = tracks;
  }

  /* --- mood mix --- */
  async function viewMix(id, _, tok) {
    const m = MOODS.find((x) => x.id === id);
    if (!m) { V.innerHTML = emptyBox('Mix not found'); return; }
    V.innerHTML = `<div class="ph-head"><div class="cover"><div class="mix" style="background:linear-gradient(160deg,${m.c[0]},${m.c[1]});width:100%;height:100%;aspect-ratio:auto"><span class="tag">Mood mix</span><b>${esc(m.name)}</b></div></div>
      <div><span class="eyebrow">Mood mix · ${esc(m.g.join(' · '))}</span><h1>${esc(m.name)}</h1><div class="meta">${esc(m.d)} — reshuffled every visit</div>
      <div class="page-acts"><button class="btn hot" id="pPlay">${ic('play')}Play</button><button class="btn ghost" id="pNew">${ic('dice')}Reshuffle</button><button class="btn ghost" data-addall>${ic('plus')}Save as playlist</button></div></div></div>
      <div class="sec" style="margin-top:28px" id="mBox">${skelRows(10)}</div>`;
    const tracks = await mixTracks(m);
    if (!live(tok)) return;
    remember({ k: 'mix', id, t: m.name, s: 'Mood mix', img: tracks[0]?.art, href: `#/mix/${id}` });
    fill('mBox', tracks.length ? rows(tracks) : emptyBox('Nothing in this mix right now'), tok);
    $('#pPlay').onclick = () => playList(tracks, 0, { label: m.name });
    $('#pNew').onclick = () => { memo.forEach((_, k) => k.startsWith('a:/tracks/trending') && memo.delete(k)); route(); };
    PAGE_TRACKS = tracks;
  }

  /* --- radio --- */
  let radioTag = 'Top';
  const stationCard = (s) => {
    const saved = S.stations.some((x) => x.id === s.id);
    return `<div class="st" data-sid="${esc(s.id)}" role="button" tabindex="0">${s.art ? `<img class="logo" src="${esc(s.art)}" alt="" loading="lazy" data-seed="${esc(s.name)}">` : ph(s.name, 'logo')}
      <span><span class="onair">On air</span><b>${esc(s.name)}</b><small>${esc([s.cc, ...(s.tags || []).slice(0, 2)].filter(Boolean).join(' · '))}${s.br ? ` · ${s.br} kbps` : ''}</small></span>
      <button class="ib sm star${saved ? ' on' : ''}" data-star="${esc(s.id)}" aria-label="Save station">${ic('star')}</button></div>`;
  };
  const STMETA = new Map();
  const regSt = (list) => { list.forEach((s) => STMETA.set(s.id, s)); return list; };
  async function viewRadio(_, q, tok) {
    regSt(S.stations); regSt(S.tuned);
    V.innerHTML = `<header class="hero"><span class="eyebrow">Live</span><h1>Live <em>radio</em></h1>
      <form class="find" id="rFind">${ic('search')}<input name="q" placeholder="Search thousands of stations" autocomplete="off" aria-label="Search stations"></form></header>
      ${S.stations.length ? `<section class="sec">${secHead(1, 'Your stations')}<div class="stations">${S.stations.map(stationCard).join('')}</div></section>` : ''}
      ${S.tuned.length ? `<section class="sec">${secHead(S.stations.length ? 2 : 1, 'Recently tuned')}<div class="stations">${S.tuned.slice(0, 6).map(stationCard).join('')}</div></section>` : ''}
      <section class="sec">${secHead(1 + !!S.stations.length + !!S.tuned.length, 'Station directory', 'Popular streams from around the world')}
        <div class="chips" id="rChips">${RADIO_TAGS.map(([l]) => `<button class="chip${l === radioTag ? ' on' : ''}" data-tag="${esc(l)}">${esc(l)}</button>`).join('')}</div>
        <div id="rBox"><div class="stations">${Array.from({ length: 9 }, () => '<div class="sk" style="height:74px"></div>').join('')}</div></div></section>`;
    const load = async (params) => {
      fill('rBox', `<div class="stations">${Array.from({ length: 9 }, () => '<div class="sk" style="height:74px"></div>').join('')}</div>`, tok);
      try { const list = regSt(await stations(params)); fill('rBox', list.length ? `<div class="stations">${list.map(stationCard).join('')}</div>` : emptyBox('No stations found'), tok); markCurrent(); }
      catch (e) { fill('rBox', errBox(e), tok); }
    };
    const tagParams = () => { const t = RADIO_TAGS.find(([l]) => l === radioTag)?.[1]; return t ? 'tag=' + enc(t) : ''; };
    $('#rChips').onclick = (e) => { const b = e.target.closest('[data-tag]'); if (!b) return; radioTag = b.dataset.tag; $$('#rChips .chip').forEach((c) => c.classList.toggle('on', c === b)); $('#rFind input').value = ''; load(tagParams()); };
    let deb;
    $('#rFind input').addEventListener('input', (e) => { clearTimeout(deb); deb = setTimeout(() => { const v = e.target.value.trim(); load(v ? 'name=' + enc(v) : tagParams()); }, 400); });
    $('#rFind').onsubmit = (e) => e.preventDefault();
    load(tagParams());
  }
  function toggleStation(id) {
    const s = STMETA.get(id); if (!s) return;
    const on = S.stations.some((x) => x.id === id);
    S.stations = on ? S.stations.filter((x) => x.id !== id) : [slimSt(s), ...S.stations];
    save('stations');
    $$(`[data-star="${CSS.escape(id)}"]`).forEach((b) => b.classList.toggle('on', !on));
    toast(on ? `Removed ${s.name}` : `Saved ${s.name}`);
  }

  /* --- lofi --- */
  function viewLofi() {
    V.innerHTML = `<header class="hero"><span class="eyebrow">24 / 7</span><h1>Lofi <em>lounge</em></h1><p style="color:var(--mute);margin:0;max-width:520px">Always-on streams. They open in a small video window that keeps playing while you browse.</p></header>
      <section class="sec"><div class="streams">${LOFI.map((s) => `<button class="stream" data-v="${s[0]}"><div class="thumb"><img src="https://i.ytimg.com/vi/${s[0]}/hqdefault.jpg" alt="" loading="lazy" data-seed="${esc(s[1])}"><span class="livepill">Live</span></div><b>${esc(s[1])}</b><small>${esc(s[2])}</small></button>`).join('')}</div></section>`;
  }

  /* ================= global click handling ================= */
  async function playCollection(spec, shuffle = false) {
    const [kind, id] = spec.split(/:(.*)/);
    try {
      let tracks = [], label = '';
      if (kind === 'album') { const j = await M('album?id=' + enc(id)); tracks = j.tracks; label = j.album.t; }
      else if (kind === 'aplaylist') { const [m, t] = await Promise.all([A(`/playlists/${id}`), A(`/playlists/${id}/tracks`)]); tracks = (t || []).map(auTrack); label = (Array.isArray(m) ? m[0] : m)?.playlist_name || 'Playlist'; }
      else if (kind === 'mix') { const m = MOODS.find((x) => x.id === id); tracks = await mixTracks(m); label = m.name; }
      else if (kind === 'list') { const l = id === 'liked' ? { tracks: S.liked, name: 'Liked songs' } : S.lists.find((x) => x.id === id); tracks = l?.tracks || []; label = l?.name || ''; }
      if (!tracks.length) { toast('Nothing to play there'); return; }
      playList(tracks, 0, { shuffle, label });
    } catch (e) { toast(e.message); }
  }

  document.addEventListener('click', async (e) => {
    const t = e.target;
    const cp = t.closest('[data-cplay]');
    if (cp) { e.preventDefault(); e.stopPropagation(); playCollection(cp.dataset.cplay); return; }
    const sl = t.closest('[data-shufflelist]');
    if (sl) { playCollection('list:' + sl.dataset.shufflelist, true); return; }
    const rl = t.closest('[data-radiolist]');
    if (rl) { const l = rl.dataset.radiolist === 'liked' ? S.liked : S.lists.find((x) => x.id === rl.dataset.radiolist)?.tracks || []; if (l.length) songRadio(l[(Math.random() * l.length) | 0]); return; }
    if (t.closest('[data-retry]')) { route(); return; }
    if (t.closest('[data-newlist]')) { const l = await createListWith([]); if (l) location.hash = '#/list/' + l.id; return; }
    const dl = t.closest('[data-dellist]');
    if (dl) { const l = S.lists.find((x) => x.id === dl.dataset.dellist); if (l && (await confirmAsk(`Delete “${l.name}”?`))) { S.lists = S.lists.filter((x) => x !== l); save('lists'); paintSide(); location.hash = '#/library'; toast('Playlist deleted'); } return; }
    if (t.closest('[data-rename]')) {
      const id = parse().parts[1], l = S.lists.find((x) => x.id === id);
      if (l) { const n = await askText('Rename playlist', l.name); if (n) { l.name = n; save('lists'); paintSide(); viewList(id); } }
      return;
    }
    const aa = t.closest('[data-addall]');
    if (aa && PAGE_TRACKS.length) { addMenu(aa, PAGE_TRACKS); return; }
    const fb = t.closest('[data-follow]');
    if (fb) { toggleFollow(fb.dataset.follow); return; }
    const star = t.closest('[data-star]');
    if (star) { e.stopPropagation(); toggleStation(star.dataset.star); return; }
    const st = t.closest('.st[data-sid]');
    if (st) { const s = STMETA.get(st.dataset.sid); if (s) playStation(s); return; }
    const sv = t.closest('.stream[data-v]');
    if (sv) { const s = LOFI.find((x) => x[0] === sv.dataset.v); if (s) playStream(s); return; }
    if (t.closest('[data-clearjump]')) { S.activity = []; save('activity'); route(); return; }
    if (t.closest('[data-clearhist]')) { S.activity = S.activity.filter((a) => a.k !== 'song'); save('activity'); route(); return; }
    const uj = t.closest('[data-unjump]');
    if (uj) { e.preventDefault(); e.stopPropagation(); S.activity.splice(+uj.dataset.unjump, 1); save('activity'); const sec = uj.closest('.sec'); const html = jumpHTML(); if (html) sec.outerHTML = html; else sec.remove(); return; }
    const jb = t.closest('[data-jump]');
    if (jb) { const a = S.activity[+jb.dataset.jump]; if (a?.ref) playList([a.ref]); return; }

    // track rows
    const rowEl = t.closest('.row[data-l]');
    if (!rowEl) return;
    const tr = trackAt(rowEl);
    if (!tr) return;
    if (t.closest('[data-like]')) { toggleLike(tr); return; }
    if (t.closest('[data-more]')) {
      const ol = rowEl.closest('ol');
      const ctx = ol?.dataset.ctx;
      trackMenu(t.closest('[data-more]'), tr, { listId: ctx && ctx !== 'queue' ? ctx : null, queueIdx: ctx === 'queue' ? +rowEl.dataset.i : null });
      return;
    }
    if (t.closest('a')) return;
    const list = LISTS.get(rowEl.dataset.l), i = +rowEl.dataset.i;
    if (rowEl.dataset.l.startsWith('Q')) { P.i = P.i + 1 + i; playTrack(P.q[P.i]); return; }
    if (isCur(tr)) { toggle(); return; }
    playList(list, i, { label: rowEl.closest('.sec')?.querySelector('h2')?.textContent || '' });
  });
  document.addEventListener('keydown', (e) => {
    const st = e.target.closest?.('.st[data-sid]');
    if (st && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); st.click(); }
  });

  /* ================= player controls wiring ================= */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'toggle') toggle();
    else if (a === 'next') next(false);
    else if (a === 'prev') prev();
    else if (a === 'shuffle') { setShuffle(!P.shuffle); toast(P.shuffle ? 'Shuffle on' : 'Shuffle off'); }
    else if (a === 'repeat') cycleRepeat();
  });
  $('#barNow').onclick = () => drawer(true);
  $('#panelBtn').onclick = () => drawer(!$('#np').classList.contains('open'));
  $('#npClose').onclick = $('#npScrim').onclick = () => drawer(false);
  $('#npSub').addEventListener('click', (e) => { if (e.target.closest('a')) drawer(false); });
  $('#noteX').onclick = () => { $('#previewNote').hidden = true; store.set('noteX', true); };
  $('#npLike').onclick = $('#barLike').onclick = () => toggleLike(P.cur);
  $('#npAdd').onclick = (e) => { if (P.cur) addMenu(e.currentTarget, [P.cur]); };
  $('#npRadio').onclick = () => { if (P.cur) songRadio(P.cur); };
  $('#videoBtn').onclick = $('#npVideo').onclick = () => { if (P.eng === 'yt') setVideo($('#dock').classList.contains('off')); };
  $('#dockHide').onclick = () => toast('The YouTube player stays visible while a song is playing.');
  $('#dockSize').onclick = () => $('#dock').classList.toggle('big');
  $('#stopBtn').onclick = closePlayer;
  $('#qClear').onclick = () => { P.q = P.q.slice(0, P.i + 1); P.orig = P.q.slice(); renderQueue(); toast('Queue cleared'); };
  $('#vol').oninput = (e) => { S.cfg.vol = e.target.value / 100; S.cfg.muted = false; applyVol(); save('cfg'); };
  $('#muteBtn').onclick = () => { S.cfg.muted = !S.cfg.muted; applyVol(); save('cfg'); };
  $('#sleepBtn').onclick = (e) => openMenu(e.currentTarget, `<div class="mh">Sleep timer</div>${[['15', '15 minutes'], ['30', '30 minutes'], ['45', '45 minutes'], ['60', '1 hour'], ['end', 'End of this song'], ['0', 'Off']].map(([v, l]) => `<button data-m="sleep" data-v="${v}">${ic('clock')}${l}</button>`).join('')}`, { kind: 'sleep' });
  const paintAuto = () => $('#autoBtn').classList.toggle('on', S.cfg.autoplay);
  $('#autoBtn').onclick = () => { S.cfg.autoplay = !S.cfg.autoplay; save('cfg'); paintAuto(); toast(S.cfg.autoplay ? 'Autoplay on — similar songs keep coming' : 'Autoplay off'); renderQueue(); };

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea,select,[contenteditable]') || e.metaKey || e.ctrlKey || e.altKey || dlg.open) return;
    const k = e.key;
    if (k === ' ' || k === 'k') { if (!P.mode) return; e.preventDefault(); toggle(); }
    else if (k === 'ArrowRight' && e.shiftKey) next(false);
    else if (k === 'ArrowLeft' && e.shiftKey) prev();
    else if (k === 'ArrowRight') seek(position() + 10);
    else if (k === 'ArrowLeft') seek(Math.max(0, position() - 10));
    else if (k === 'm') { S.cfg.muted = !S.cfg.muted; applyVol(); save('cfg'); }
    else if (k === 'l' && P.cur) toggleLike(P.cur);
    else if (k === 's' && P.mode === 'song') { setShuffle(!P.shuffle); toast(P.shuffle ? 'Shuffle on' : 'Shuffle off'); }
    else if (k === '/') { e.preventDefault(); MQ.focus(); MQ.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else if (k === 'Escape') { closeMenu(); drawer(false); }
  });
  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => toggle());
    ms.setActionHandler('pause', () => toggle());
    ms.setActionHandler('nexttrack', () => next(false));
    ms.setActionHandler('previoustrack', () => prev());
    try { ms.setActionHandler('seekto', (d) => seek(d.seekTime)); } catch { /* unsupported */ }
  }

  /* ================= boot ================= */
  if (FILE) markNoapi();
  applyVol(); paintModes(); paintAuto(); setVideo(false); setPlaying(false);
  const q0 = new URLSearchParams(location.search).get('q');
  if (q0 && !location.hash) location.hash = '#/search?q=' + enc(q0.slice(0, 80));
  route();
})();
