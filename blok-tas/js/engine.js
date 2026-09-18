/* Blok Taş Ustası — tahta ve taş düzeni */
(function (root) {
  "use strict";

  var N = 8;

  var SHAPES = [
    { id: "o1", min: 1, cells: [[0, 0]] },
    { id: "h2", min: 1, cells: [[0, 0], [0, 1]] },
    { id: "v2", min: 1, cells: [[0, 0], [1, 0]] },
    { id: "sq", min: 1, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { id: "h3", min: 2, cells: [[0, 0], [0, 1], [0, 2]] },
    { id: "v3", min: 2, cells: [[0, 0], [1, 0], [2, 0]] },
    { id: "l3", min: 2, cells: [[0, 0], [1, 0], [1, 1]] },
    { id: "t4", min: 3, cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
    { id: "h4", min: 3, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
    { id: "v4", min: 3, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { id: "l4", min: 3, cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
    { id: "s4", min: 4, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
    { id: "plus", min: 5, cells: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] },
    { id: "h5", min: 5, cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
    { id: "u5", min: 6, cells: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]] },
    { id: "p5", min: 6, cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
    { id: "l5", min: 7, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]] },
    { id: "sq9", min: 8, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] }
  ];

  var LEVELS = [
    { n: 1, name: "Mor Tahta", order: "Kare → Çift → Kare 2×2", accent: "#c4b5fd", bg: "#3b2760", board: "#1b1528", cell: "#2a223c", need: 350, pal: ["#f0c14b", "#e8d5b5", "#c4b5fd"] },
    { n: 2, name: "Kum Kıyısı", order: "Üçlü çizgi → Küçük L", accent: "#e4c36a", bg: "#3a2a12", board: "#241a0c", cell: "#3a2e18", need: 500, pal: ["#f5d76e", "#f0d5a0", "#d4a017"] },
    { n: 3, name: "Gül Bahçesi", order: "T taşı → Dört çizgi", accent: "#f9a8d4", bg: "#3a1830", board: "#241018", cell: "#3c2230", need: 700, pal: ["#fb7185", "#f9a8d4", "#fda4af"] },
    { n: 4, name: "Gök Ada", order: "S / Z taşı", accent: "#67e8f9", bg: "#123044", board: "#0c1c28", cell: "#1a3344", need: 900, pal: ["#22d3ee", "#7dd3fc", "#a5f3fc"] },
    { n: 5, name: "Amber Orman", order: "Artı → Beş çizgi", accent: "#fb923c", bg: "#3a1c0c", board: "#24140a", cell: "#3c2814", need: 1100, pal: ["#f97316", "#fbbf24", "#fdba74"] },
    { n: 6, name: "Menekşe Tepe", order: "U taşı → P taşı", accent: "#a78bfa", bg: "#2a1450", board: "#180c30", cell: "#2c1c48", need: 1300, pal: ["#8b5cf6", "#c4b5fd", "#e879f9"] },
    { n: 7, name: "Kar Diyarı", order: "Uzun L", accent: "#e0f2fe", bg: "#1e293b", board: "#0f172a", cell: "#1e293b", need: 1600, pal: ["#93c5fd", "#e2e8f0", "#7dd3fc"] },
    { n: 8, name: "Volkan Ocağı", order: "Büyük kare 3×3", accent: "#f87171", bg: "#3f1212", board: "#1c0a0a", cell: "#3a1616", need: 1900, pal: ["#ef4444", "#fb923c", "#fbbf24"] },
    { n: 9, name: "Zümrüt Derinlik", order: "Tüm taşlar", accent: "#34d399", bg: "#064e3b", board: "#022c22", cell: "#14532d", need: 2200, pal: ["#10b981", "#6ee7b7", "#a7f3d0"] },
    { n: 10, name: "Altın Maden", order: "Altın palet", accent: "#facc15", bg: "#422006", board: "#1c1408", cell: "#3a2a10", need: 2600, pal: ["#facc15", "#fde047", "#ca8a04"] },
    { n: 11, name: "Gece Bahçesi", order: "Neon taşlar", accent: "#818cf8", bg: "#1e1b4b", board: "#020617", cell: "#312e81", need: 3000, pal: ["#6366f1", "#22d3ee", "#e879f9"] },
    { n: 12, name: "Usta Zirvesi", order: "Karışık usta paleti", accent: "#f59e0b", bg: "#1f1633", board: "#111018", cell: "#2a2038", need: 3600, pal: ["#f43f5e", "#22c55e", "#eab308"] }
  ];

  function cloneCells(cells) {
    return cells.map(function (p) { return [p[0], p[1]]; });
  }

  function rotateCells(cells) {
    var next = cells.map(function (p) { return [p[1], -p[0]]; });
    var minR = Infinity, minC = Infinity, i;
    for (i = 0; i < next.length; i++) {
      if (next[i][0] < minR) minR = next[i][0];
      if (next[i][1] < minC) minC = next[i][1];
    }
    return next.map(function (p) { return [p[0] - minR, p[1] - minC]; });
  }

  function bounds(cells) {
    var r = 0, c = 0, i;
    for (i = 0; i < cells.length; i++) {
      if (cells[i][0] > r) r = cells[i][0];
      if (cells[i][1] > c) c = cells[i][1];
    }
    return { rows: r + 1, cols: c + 1 };
  }

  function emptyBoard() {
    return new Uint8Array(N * N);
  }

  function copyBoard(b) {
    return new Uint8Array(b);
  }

  function canPlace(board, cells, r0, c0) {
    var i, r, c;
    for (i = 0; i < cells.length; i++) {
      r = r0 + cells[i][0];
      c = c0 + cells[i][1];
      if (r < 0 || c < 0 || r >= N || c >= N) return false;
      if (board[r * N + c]) return false;
    }
    return true;
  }

  function anyFit(board, cells) {
    var r, c;
    for (r = 0; r < N; r++)
      for (c = 0; c < N; c++)
        if (canPlace(board, cells, r, c)) return true;
    return false;
  }

  function place(board, cells, r0, c0, color) {
    var i, r, c;
    for (i = 0; i < cells.length; i++) {
      r = r0 + cells[i][0];
      c = c0 + cells[i][1];
      board[r * N + c] = color || 1;
    }
  }

  function findClears(board) {
    var rows = [], cols = [], r, c, full;
    for (r = 0; r < N; r++) {
      full = true;
      for (c = 0; c < N; c++) if (!board[r * N + c]) { full = false; break; }
      if (full) rows.push(r);
    }
    for (c = 0; c < N; c++) {
      full = true;
      for (r = 0; r < N; r++) if (!board[r * N + c]) { full = false; break; }
      if (full) cols.push(c);
    }
    return { rows: rows, cols: cols };
  }

  function applyClears(board, clears) {
    var i, r, c, n = 0;
    for (i = 0; i < clears.rows.length; i++) {
      r = clears.rows[i];
      for (c = 0; c < N; c++) {
        if (board[r * N + c]) { board[r * N + c] = 0; n++; }
      }
    }
    for (i = 0; i < clears.cols.length; i++) {
      c = clears.cols[i];
      for (r = 0; r < N; r++) {
        if (board[r * N + c]) { board[r * N + c] = 0; n++; }
      }
    }
    return n;
  }

  function lineScore(clearedCells, lineCount) {
    if (!clearedCells) return 0;
    var combo = Math.max(1, lineCount);
    return clearedCells * 20 * combo + (combo > 1 ? combo * 50 : 0);
  }

  function poolFor(levelN) {
    return SHAPES.filter(function (s) { return s.min <= levelN; });
  }

  function rngFrom(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s = Math.imul(s ^ (s >>> 16), 2246822519);
      s = Math.imul(s ^ (s >>> 13), 3266489917);
      s ^= s >>> 16;
      return (s >>> 0) / 4294967296;
    };
  }

  function pickShape(pool, rnd) {
    var s = pool[Math.floor(rnd() * pool.length)];
    var cells = cloneCells(s.cells);
    var turns = Math.floor(rnd() * 4), i;
    for (i = 0; i < turns; i++) cells = rotateCells(cells);
    return { id: s.id, cells: cells, min: s.min };
  }

  function deal(board, levelN, rnd, pal) {
    var pool = poolFor(levelN);
    var tries, hand, i, colors;
    colors = pal || ["#f0c14b", "#e8d5b5", "#c4b5fd"];
    for (tries = 0; tries < 48; tries++) {
      hand = [pickShape(pool, rnd), pickShape(pool, rnd), pickShape(pool, rnd)];
      for (i = 0; i < 3; i++) hand[i].color = colors[i % colors.length];
      if (hand.some(function (p) { return anyFit(board, p.cells); })) return hand;
    }
    hand = [
      { id: "o1", cells: [[0, 0]], color: colors[0], min: 1 },
      { id: "o1", cells: [[0, 0]], color: colors[1], min: 1 },
      { id: "h2", cells: [[0, 0], [0, 1]], color: colors[2], min: 1 }
    ];
    return hand;
  }

  function handCanPlay(board, hand) {
    return hand.some(function (p) { return p && anyFit(board, p.cells); });
  }

  function removeCell(board, r, c) {
    if (r < 0 || c < 0 || r >= N || c >= N) return false;
    if (!board[r * N + c]) return false;
    board[r * N + c] = 0;
    return true;
  }

  function bombAt(board, r, c) {
    var rr, cc, n = 0;
    for (rr = r - 1; rr <= r + 1; rr++)
      for (cc = c - 1; cc <= c + 1; cc++)
        if (removeCell(board, rr, cc)) n++;
    return n;
  }

  var API = {
    N: N,
    SHAPES: SHAPES,
    LEVELS: LEVELS,
    cloneCells: cloneCells,
    rotateCells: rotateCells,
    bounds: bounds,
    emptyBoard: emptyBoard,
    copyBoard: copyBoard,
    canPlace: canPlace,
    anyFit: anyFit,
    place: place,
    findClears: findClears,
    applyClears: applyClears,
    lineScore: lineScore,
    poolFor: poolFor,
    rngFrom: rngFrom,
    deal: deal,
    handCanPlay: handCanPlay,
    removeCell: removeCell,
    bombAt: bombAt
  };

  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.BlokTas = API;
})(typeof window !== "undefined" ? window : globalThis);
