/* Blok Taş Ustası — görünüm ve oynanış */
(function () {
  "use strict";

  var E = window.BlokTas;
  if (!E) {
    document.body.textContent = "Oyun motoru yüklenemedi.";
    return;
  }

  var KEY = "btu_v1";
  var N = E.N;
  function $(id) { return document.getElementById(id); }

  function loadDb() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (err) { return {}; }
  }
  function saveDb() { localStorage.setItem(KEY, JSON.stringify(db)); }

  var db = loadDb();
  if (!db.campaign) db.campaign = { unlocked: 1, stars: 0, best: 0 };
  if (!db.boost) db.boost = { rotate: 2, hammer: 1 };

  var state = {
    level: 1,
    board: E.emptyBoard(),
    hand: [null, null, null],
    score: 0,
    stars: db.campaign.stars || 0,
    won: false,
    over: false,
    tool: null,
    selected: 0,
    seed: 1,
    rnd: E.rngFrom(1)
  };
  var history = [];
  var dragging = null;

  function L() {
    return E.LEVELS[Math.max(0, Math.min(E.LEVELS.length, state.level) - 1)];
  }

  function applyTheme() {
    var lv = L();
    var r = document.documentElement.style;
    r.setProperty("--bg", lv.bg);
    r.setProperty("--board", lv.board);
    r.setProperty("--cell", lv.cell);
    r.setProperty("--accent", lv.accent);
    document.querySelector("meta[name=theme-color]").setAttribute("content", lv.bg);
    $("level-name").textContent = "Seviye " + lv.n + " · " + lv.name;
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toast._id);
    toast._id = setTimeout(function () { t.classList.remove("is-on"); }, 1800);
  }

  function snapshot() {
    history.push({
      board: E.copyBoard(state.board),
      hand: state.hand.map(function (p) {
        return p ? { id: p.id, cells: E.cloneCells(p.cells), color: p.color, min: p.min } : null;
      }),
      score: state.score,
      stars: state.stars,
      rotate: db.boost.rotate,
      hammer: db.boost.hammer
    });
    if (history.length > 20) history.shift();
  }

  function persist() {
    db.campaign.stars = state.stars;
    if (state.score > (db.campaign.best || 0)) db.campaign.best = state.score;
    saveDb();
  }

  function showPanel(id) {
    ["panel-menu", "panel-levels", "panel-over", "panel-win"].forEach(function (p) {
      $(p).hidden = p !== id;
    });
    $("overlay").hidden = !id;
  }

  function renderHud() {
    var lv = L();
    $("score").textContent = String(state.score);
    $("stars").textContent = String(state.stars);
    var pct = Math.min(100, Math.round((state.score / lv.need) * 100));
    $("bar").style.width = pct + "%";
    $("n-rotate").textContent = db.boost.rotate > 0 ? ("Ücretsiz×" + db.boost.rotate) : "Yok";
    $("n-hammer").textContent = db.boost.hammer > 0 ? ("Ücretsiz×" + db.boost.hammer) : "Yok";
    $("n-bomb").textContent = "45";
    $("b-rotate").disabled = db.boost.rotate <= 0;
    $("b-hammer").disabled = db.boost.hammer <= 0;
    $("b-bomb").disabled = state.stars < 45;
    $("b-undo").disabled = history.length === 0 || state.stars < 15;
    $("b-refresh").disabled = false;
    ["b-refresh", "b-rotate", "b-hammer", "b-bomb", "b-undo"].forEach(function (id) {
      $(id).classList.toggle("is-on", state.tool === id.slice(2));
    });
    $("b-hammer").classList.toggle("is-on", state.tool === "hammer");
    $("b-bomb").classList.toggle("is-on", state.tool === "bomb");
  }

  function cellEl(r, c) {
    return $("board").children[r * N + c];
  }

  function paintBoard(ghost, valid) {
    var i, r, c, v, el, gset = {};
    if (ghost && ghost.cells) {
      ghost.cells.forEach(function (p) {
        gset[(ghost.r + p[0]) + "," + (ghost.c + p[1])] = true;
      });
    }
    for (r = 0; r < N; r++)
      for (c = 0; c < N; c++) {
        el = cellEl(r, c);
        v = state.board[r * N + c];
        el.className = "cell" + (v ? " is-on" : "") + (gset[r + "," + c] ? (valid ? " is-ghost" : " is-bad") : "");
        el.style.background = v ? colorOf(v) : "";
      }
  }

  function colorOf(v) {
    var pal = L().pal;
    if (typeof v === "string") return v;
    return pal[(v - 1) % pal.length];
  }

  function renderBoard() {
    var box = $("board");
    if (box.childElementCount !== N * N) {
      box.innerHTML = "";
      var r, c, el;
      for (r = 0; r < N; r++)
        for (c = 0; c < N; c++) {
          el = document.createElement("div");
          el.className = "cell";
          el.dataset.r = String(r);
          el.dataset.c = String(c);
          box.appendChild(el);
        }
    }
    paintBoard(null, false);
  }

  function pieceMarkup(piece, tile) {
    var b = E.bounds(piece.cells);
    var grid = document.createElement("div");
    grid.className = "piece-grid";
    grid.style.gridTemplateColumns = "repeat(" + b.cols + ", " + tile + "px)";
    var map = {};
    piece.cells.forEach(function (p) { map[p[0] + "," + p[1]] = true; });
    var r, c, d;
    for (r = 0; r < b.rows; r++)
      for (c = 0; c < b.cols; c++) {
        d = document.createElement("div");
        if (map[r + "," + c]) {
          d.className = "ptile";
          d.style.background = piece.color;
        } else {
          d.style.width = tile + "px";
          d.style.height = tile + "px";
        }
        grid.appendChild(d);
      }
    return grid;
  }

  function renderTray() {
    var tray = $("tray");
    tray.innerHTML = "";
    state.hand.forEach(function (p, i) {
      var wrap = document.createElement("div");
      wrap.className = "piece";
      wrap.dataset.i = String(i);
      if (!p) {
        wrap.style.opacity = "0.2";
        tray.appendChild(wrap);
        return;
      }
      wrap.appendChild(pieceMarkup(p, 22));
      wrap.addEventListener("pointerdown", onPieceDown);
      wrap.addEventListener("click", function () { state.selected = i; });
      tray.appendChild(wrap);
    });
  }

  function hoverCell(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return null;
    var cell = el.closest ? el.closest(".cell") : null;
    if (!cell) return null;
    return { r: Number(cell.dataset.r), c: Number(cell.dataset.c) };
  }

  function onPieceDown(ev) {
    if (state.over || $("overlay").hidden === false) return;
    if (state.tool) return;
    var i = Number(ev.currentTarget.dataset.i);
    var piece = state.hand[i];
    if (!piece) return;
    state.selected = i;
    dragging = { i: i, piece: piece, pointer: ev.pointerId };
    ev.currentTarget.setPointerCapture(ev.pointerId);
    var g = $("ghost");
    g.hidden = false;
    g.innerHTML = "";
    g.appendChild(pieceMarkup(piece, 26));
    moveGhost(ev.clientX, ev.clientY);
    ev.preventDefault();
  }

  function moveGhost(x, y) {
    var g = $("ghost");
    g.style.left = x + "px";
    g.style.top = y + "px";
  }

  function dropAt(x, y) {
    if (!dragging) return;
    var slot = dragging.i;
    var piece = state.hand[slot];
    dragging = null;
    $("ghost").hidden = true;
    if (!piece) { paintBoard(null, false); return; }
    var hit = hoverCell(x, y);
    if (!hit) { paintBoard(null, false); return; }
    if (!E.canPlace(state.board, piece.cells, hit.r, hit.c)) {
      toast("Sığmıyor");
      paintBoard(null, false);
      return;
    }
    snapshot();
    var colorIdx = L().pal.indexOf(piece.color) + 1;
    if (colorIdx <= 0) colorIdx = 1;
    E.place(state.board, piece.cells, hit.r, hit.c, colorIdx);
    state.hand[slot] = null;
    var placed = piece.cells.length;
    state.score += placed * 10;
    var clears = E.findClears(state.board);
    var lines = clears.rows.length + clears.cols.length;
    if (lines) {
      var n = E.applyClears(state.board, clears);
      var add = E.lineScore(n, lines);
      state.score += add;
      state.stars += lines;
      toast((lines > 1 ? "Kombo ×" + lines + " · " : "Temiz · ") + add);
      sfx(lines > 1 ? "combo" : "clear");
    } else sfx("place");
    if (!state.hand.some(Boolean)) refill();
    afterMove();
  }

  function refill() {
    state.hand = E.deal(state.board, state.level, state.rnd, L().pal);
  }

  function afterMove() {
    var lv = L();
    if (!state.won && state.score >= lv.need) {
      state.won = true;
      if ((db.campaign.unlocked || 1) < lv.n + 1) db.campaign.unlocked = Math.min(E.LEVELS.length, lv.n + 1);
      persist();
      $("win-title").textContent = lv.n >= E.LEVELS.length ? "Büyük Usta oldunuz" : ("Seviye " + lv.n + " tamamlandı");
      $("win-hint").textContent = lv.n >= E.LEVELS.length
        ? "On iki tahtanın taş düzeni sizinle."
        : ("Sıradaki taş düzeni: " + E.LEVELS[lv.n].order);
      $("win-next").hidden = lv.n >= E.LEVELS.length;
      showPanel("panel-win");
    }
    if (!E.handCanPlay(state.board, state.hand.filter(Boolean)) && state.hand.some(Boolean)) {
      state.over = true;
      $("over-title").textContent = "Taş sığmıyor";
      $("over-hint").textContent = "Çekiç, bomba veya yeni el ile tahtayı açın.";
      showPanel("panel-over");
    }
    persist();
    renderBoard();
    renderTray();
    renderHud();
  }

  function startLevel(n) {
    state.level = n;
    state.board = E.emptyBoard();
    state.score = 0;
    state.won = false;
    state.over = false;
    state.tool = null;
    state.seed = (Date.now() ^ (n * 9973)) >>> 0;
    state.rnd = E.rngFrom(state.seed);
    db.boost.rotate = 2;
    db.boost.hammer = 1;
    history = [];
    applyTheme();
    refill();
    showPanel(null);
    renderBoard();
    renderTray();
    renderHud();
    toast("Seviye " + L().n + " · " + L().order);
  }

  var actx = null;
  function sfx(kind) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!actx) actx = new Ctx();
    var o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    var now = actx.currentTime;
    o.frequency.value = kind === "clear" ? 520 : kind === "combo" ? 660 : kind === "place" ? 240 : 180;
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    o.start(now); o.stop(now + 0.18);
  }

  function renderLevels() {
    var box = $("level-grid");
    box.innerHTML = "";
    E.LEVELS.forEach(function (lv) {
      var locked = lv.n > (db.campaign.unlocked || 1);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "level-card";
      b.disabled = locked;
      b.style.setProperty("--lvl", lv.accent);
      b.innerHTML = "<b>" + lv.n + ". " + lv.name + "</b><small>" + lv.order + "</small>";
      b.addEventListener("click", function () { if (!locked) startLevel(lv.n); });
      box.appendChild(b);
    });
  }

  $("board").addEventListener("pointermove", function (ev) {
    if (!dragging) return;
    moveGhost(ev.clientX, ev.clientY);
    var hit = hoverCell(ev.clientX, ev.clientY);
    var piece = state.hand[dragging.i];
    if (!hit || !piece) { paintBoard(null, false); return; }
    paintBoard({ r: hit.r, c: hit.c, cells: piece.cells }, E.canPlace(state.board, piece.cells, hit.r, hit.c));
  });
  window.addEventListener("pointerup", function (ev) {
    if (!dragging) return;
    dropAt(ev.clientX, ev.clientY);
  });
  $("board").addEventListener("click", function (ev) {
    var cell = ev.target.closest(".cell");
    if (!cell) return;
    var r = Number(cell.dataset.r), c = Number(cell.dataset.c);
    if (state.tool === "hammer") {
      if (!state.board[r * N + c]) return;
      snapshot();
      E.removeCell(state.board, r, c);
      db.boost.hammer = Math.max(0, db.boost.hammer - 1);
      state.tool = null;
      sfx("place");
      afterMove();
      return;
    }
    if (state.tool === "bomb") {
      if (state.stars < 45) return;
      snapshot();
      E.bombAt(state.board, r, c);
      state.stars -= 45;
      state.tool = null;
      sfx("clear");
      afterMove();
      return;
    }
    var piece = state.hand[state.selected];
    if (!piece || state.over || $("overlay").hidden === false) return;
    if (!E.canPlace(state.board, piece.cells, r, c)) {
      toast("Sığmıyor");
      return;
    }
    snapshot();
    var colorIdx = L().pal.indexOf(piece.color) + 1;
    if (colorIdx <= 0) colorIdx = 1;
    E.place(state.board, piece.cells, r, c, colorIdx);
    state.hand[state.selected] = null;
    state.score += piece.cells.length * 10;
    var clears = E.findClears(state.board);
    var lines = clears.rows.length + clears.cols.length;
    if (lines) {
      var n = E.applyClears(state.board, clears);
      var add = E.lineScore(n, lines);
      state.score += add;
      state.stars += lines;
      toast((lines > 1 ? "Kombo ×" + lines + " · " : "Temiz · ") + add);
      sfx(lines > 1 ? "combo" : "clear");
    } else sfx("place");
    if (!state.hand.some(Boolean)) refill();
    afterMove();
  });

  $("b-refresh").onclick = function () {
    snapshot();
    refill();
    state.over = false;
    showPanel(null);
    renderTray();
    renderHud();
    toast("Yeni el");
  };
  $("b-rotate").onclick = function () {
    var p = state.hand[state.selected];
    if (!p) {
      var i;
      for (i = 0; i < 3; i++) if (state.hand[i]) { state.selected = i; p = state.hand[i]; break; }
    }
    if (!p) return;
    if (db.boost.rotate <= 0) { toast("Döndürme hakkı bitti"); return; }
    snapshot();
    p.cells = E.rotateCells(p.cells);
    db.boost.rotate--;
    renderTray();
    renderHud();
  };
  $("b-hammer").onclick = function () {
    if (db.boost.hammer <= 0) { toast("Çekiç yok"); return; }
    state.tool = state.tool === "hammer" ? null : "hammer";
    toast(state.tool ? "Tahtadan bir taş seçin" : "İptal");
    renderHud();
  };
  $("b-bomb").onclick = function () {
    if (state.stars < 45) { toast("45 yıldız gerekir"); return; }
    state.tool = state.tool === "bomb" ? null : "bomb";
    toast(state.tool ? "Patlatılacak kareyi seçin" : "İptal");
    renderHud();
  };
  $("b-undo").onclick = function () {
    if (state.stars < 15) { toast("15 yıldız gerekir"); return; }
    if (!history.length) return;
    var h = history.pop();
    state.board = h.board;
    state.hand = h.hand;
    state.score = h.score;
    state.stars = Math.max(0, h.stars - 15);
    db.boost.rotate = h.rotate;
    db.boost.hammer = h.hammer;
    state.over = false;
    showPanel(null);
    renderBoard();
    renderTray();
    renderHud();
    toast("Geri alındı");
  };

  $("menu-play").onclick = function () { startLevel(Math.min(db.campaign.unlocked || 1, E.LEVELS.length)); };
  $("menu-levels").onclick = $("btn-levels").onclick = function () { renderLevels(); showPanel("panel-levels"); };
  $("levels-back").onclick = function () { showPanel("panel-menu"); };
  $("over-deal").onclick = function () {
    snapshot();
    refill();
    state.over = false;
    showPanel(null);
    renderTray();
    renderHud();
    toast("Yeni el");
  };
  $("over-retry").onclick = function () { startLevel(state.level); };
  $("over-menu").onclick = $("win-menu").onclick = function () { showPanel("panel-menu"); };
  $("win-next").onclick = function () {
    var n = state.level + 1;
    if (n > E.LEVELS.length) showPanel("panel-menu");
    else startLevel(n);
  };

  applyTheme();
  renderBoard();
  renderHud();
  (function () {
    var m = /[?&]seviye=(\d+)/.exec(location.search || "");
    if (!m) {
      showPanel("panel-menu");
      return;
    }
    var n = Math.max(1, Math.min(E.LEVELS.length, Number(m[1])));
    db.campaign.unlocked = Math.max(db.campaign.unlocked || 1, n);
    saveDb();
    startLevel(n);
  })();
})();
