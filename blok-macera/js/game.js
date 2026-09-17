/* Blok Macera Ustası */
(function () {
  "use strict";

  if (typeof THREE === "undefined") {
    document.body.innerHTML =
      '<p style="font-family:system-ui;padding:2rem">Üç boyutlu motor yüklenemedi. Sayfayı yenileyin.</p>';
    return;
  }

  var W = 96, H = 40, D = 96, CHUNK = 16, WATER_Y = 13, EYE = 1.58, HW = 0.28;
  var AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, SAND = 4, WATER = 5, LOG = 6, LEAVES = 7;
  var COBBLE = 8, PLANKS = 9, GLASS = 10, COAL = 11, IRON = 12, GOLD = 13, CRYSTAL = 14;
  var BEDROCK = 15, TABLE = 16, FLOWER = 17, SNOW = 18, BRICK = 19, TORCH = 20;
  var STICK = 100, WPICK = 101, SPICK = 102, IPICK = 103, WAXE = 104, INGOT = 105;

  var BLOCKS = {};
  function B(id, name, color, top, side, bot, hard, drop, trans) {
    BLOCKS[id] = { name: name, color: color, top: top, side: side, bot: bot, hard: hard, drop: drop, trans: !!trans };
  }
  B(GRASS, "Çimen", "#4a9a45", 0, 1, 2, 0.55, DIRT);
  B(DIRT, "Toprak", "#7a5230", 2, 2, 2, 0.5, DIRT);
  B(STONE, "Taş", "#8b9199", 3, 3, 3, 1.4, COBBLE);
  B(SAND, "Kum", "#d7c27a", 4, 4, 4, 0.45, SAND);
  B(WATER, "Su", "#3a7ec8", 5, 5, 5, 0.2, 0, true);
  B(LOG, "Odun", "#6b4423", 6, 7, 6, 0.9, LOG);
  B(LEAVES, "Yaprak", "#4ec45a", 8, 8, 8, 0.25, 0);
  B(COBBLE, "Kırık taş", "#6d7076", 9, 9, 9, 1.3, COBBLE);
  B(PLANKS, "Tahta", "#b8894a", 10, 10, 10, 0.7, PLANKS);
  B(GLASS, "Cam", "#c5e8f0", 11, 11, 11, 0.3, 0, true);
  B(COAL, "Kömür", "#2a2a2e", 12, 12, 12, 1.5, COAL);
  B(IRON, "Demir cevheri", "#c4b8a8", 13, 13, 13, 1.8, IRON);
  B(GOLD, "Altın cevheri", "#e6c34a", 14, 14, 14, 1.6, GOLD);
  B(CRYSTAL, "Usta kristali", "#7cf0d2", 15, 15, 15, 0.35, CRYSTAL);
  B(BEDROCK, "Kaya tabanı", "#1a1a1c", 16, 16, 16, 99, 0);
  B(TABLE, "Çalışma masası", "#a56b32", 17, 18, 10, 0.8, TABLE);
  B(FLOWER, "Çiçek", "#e85d8a", 19, 19, 19, 0.1, FLOWER, true);
  B(SNOW, "Kar", "#eef6fb", 20, 20, 2, 0.3, SNOW);
  B(BRICK, "Tuğla", "#a24b3a", 21, 21, 21, 1.2, BRICK);
  B(TORCH, "Meşale", "#ffb347", 22, 22, 22, 0.1, TORCH, true);

  var ITEMS = {};
  ITEMS[STICK] = { name: "Çubuk", color: "#c4a574" };
  ITEMS[WPICK] = { name: "Tahta kazma", color: "#c48a3a", tool: "pick", speed: 1.8 };
  ITEMS[SPICK] = { name: "Taş kazma", color: "#9aa0a8", tool: "pick", speed: 2.6 };
  ITEMS[IPICK] = { name: "Demir kazma", color: "#d9dfe8", tool: "pick", speed: 3.6 };
  ITEMS[WAXE] = { name: "Tahta balta", color: "#8b5a2b", tool: "axe", speed: 2.2 };
  ITEMS[INGOT] = { name: "Demir külçe", color: "#cfd4dc" };

  var RECIPES = [
    { name: "Tahta ×4", out: PLANKS, n: 4, need: [[LOG, 1]] },
    { name: "Çubuk ×4", out: STICK, n: 4, need: [[PLANKS, 2]] },
    { name: "Çalışma masası", out: TABLE, n: 1, need: [[PLANKS, 4]] },
    { name: "Cam ×4", out: GLASS, n: 4, need: [[SAND, 4]] },
    { name: "Tuğla ×4", out: BRICK, n: 4, need: [[COBBLE, 4]] },
    { name: "Meşale ×4", out: TORCH, n: 4, need: [[COAL, 1], [STICK, 1]] },
    { name: "Tahta kazma", out: WPICK, n: 1, need: [[PLANKS, 3], [STICK, 2]] },
    { name: "Taş kazma", out: SPICK, n: 1, need: [[COBBLE, 3], [STICK, 2]] },
    { name: "Demir külçe", out: INGOT, n: 1, need: [[IRON, 1], [COAL, 1]] },
    { name: "Demir kazma", out: IPICK, n: 1, need: [[INGOT, 3], [STICK, 2]] },
    { name: "Tahta balta", out: WAXE, n: 1, need: [[PLANKS, 3], [STICK, 2]] }
  ];

  var KEY = "bmu_v1";
  function $(id) { return document.getElementById(id); }
  function loadDb() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; }
  }
  function saveDb() { localStorage.setItem(KEY, JSON.stringify(db)); }

  var db = loadDb();
  if (!db.profile) db.profile = { name: "Kaşif", color: "#3dcc7a" };
  if (!db.settings) db.settings = { sens: 1, music: 0.25, sfx: 0.55, invert: false, fps: false };
  if (!db.worlds) db.worlds = [];

  var world = { seed: 1, id: "", name: "", map: null, time: 0.22, mined: 0, placed: 0, crystals: 0, temple: null };
  var player = { x: 48.5, y: 20, z: 48.5, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: -0.12, hp: 10, food: 10, inv: [], hot: 0 };

  function emptyInv() {
    var a = [];
    for (var i = 0; i < 36; i++) a.push(null);
    a[0] = { id: PLANKS, n: 24 };
    a[1] = { id: WPICK, n: 1 };
    a[2] = { id: TORCH, n: 8 };
    return a;
  }

  function idx(x, y, z) { return y * W * D + z * W + x; }
  function inb(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D; }
  function get(x, y, z) { return inb(x, y, z) ? world.map[idx(x, y, z)] : AIR; }
  function setb(x, y, z, id) { if (inb(x, y, z)) world.map[idx(x, y, z)] = id; }
  function isSolid(x, y, z) {
    var id = get(Math.floor(x), Math.floor(y), Math.floor(z));
    return id !== AIR && id !== WATER && id !== LEAVES && id !== FLOWER && id !== TORCH && id !== GLASS;
  }

  function hash2(x, y, s) {
    var n = Math.sin(x * 127.1 + y * 311.7 + s * 74.13) * 43758.5453;
    return n - Math.floor(n);
  }
  function fade(t) { return t * t * (3 - 2 * t); }
  function vnoise(x, z, s) {
    var x0 = Math.floor(x), z0 = Math.floor(z);
    var fx = fade(x - x0), fz = fade(z - z0);
    var a = hash2(x0, z0, s), b = hash2(x0 + 1, z0, s), c = hash2(x0, z0 + 1, s), d = hash2(x0 + 1, z0 + 1, s);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  }
  function fbm(x, z, s, o) {
    var v = 0, a = 1, f = 1, tot = 0, i;
    for (i = 0; i < o; i++) { v += vnoise(x * f, z * f, s + i * 19) * a; tot += a; a *= 0.5; f *= 2; }
    return v / tot;
  }
  function n3(x, y, z, s) {
    return (vnoise(x + y * 0.17, z + y * 0.13, s) + vnoise(x * 0.7, z * 0.7, s + 9)) * 0.5;
  }
  function seedFrom(str) {
    var t = String(str || "").trim() || Math.random().toString(36).slice(2, 10);
    var h = 2166136261, i;
    for (i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
    return { text: t, n: h >>> 0 };
  }

  function growTree(x, y, z, hgt) {
    var i, dx, dz, ly, tx, ty, tz;
    for (i = 0; i < hgt; i++) if (inb(x, y + i, z) && get(x, y + i, z) === AIR) setb(x, y + i, z, LOG);
    var top = y + hgt - 1;
    for (ly = -2; ly <= 2; ly++)
      for (dx = -2; dx <= 2; dx++)
        for (dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && ly !== 0) continue;
          tx = x + dx; ty = top + ly; tz = z + dz;
          if (inb(tx, ty, tz) && get(tx, ty, tz) === AIR) setb(tx, ty, tz, LEAVES);
        }
  }

  function placeTemple(seed) {
    var x = 16 + Math.floor(hash2(3, 9, seed) * (W - 36));
    var z = 16 + Math.floor(hash2(8, 1, seed) * (D - 36));
    var y = 8, yy, xx, zz;
    for (yy = H - 2; yy > 4; yy--) {
      var g = get(x + 3, yy, z + 3);
      if (g && g !== WATER) { y = yy + 1; break; }
    }
    for (xx = 0; xx < 7; xx++)
      for (zz = 0; zz < 7; zz++) {
        setb(x + xx, y, z + zz, BRICK);
        if (xx === 0 || zz === 0 || xx === 6 || zz === 6) {
          setb(x + xx, y + 1, z + zz, BRICK);
          if ((xx + zz) % 2 === 0) setb(x + xx, y + 2, z + zz, BRICK);
        }
      }
    setb(x + 3, y, z + 3, GOLD);
    setb(x + 3, y + 1, z + 3, CRYSTAL);
    setb(x + 1, y + 1, z + 1, CRYSTAL);
    setb(x + 5, y + 1, z + 5, CRYSTAL);
    setb(x + 3, y + 3, z + 3, GOLD);
    world.temple = { x: x + 3, y: y + 1, z: z + 3 };
  }

  function generate(seedText, onProg) {
    var s = seedFrom(seedText);
    world.seed = s.n;
    world.seedText = s.text;
    world.map = new Uint8Array(W * H * D);
    var x, y, z, h, biome, id;
    for (z = 0; z < D; z++) {
      for (x = 0; x < W; x++) {
        h = 10 + Math.floor(fbm(x * 0.03, z * 0.03, s.n, 5) * 16 + fbm(x * 0.09, z * 0.09, s.n + 3, 3) * 4);
        biome = fbm(x * 0.02, z * 0.02, s.n + 40, 3);
        if (h < 1) h = 1;
        if (h > H - 4) h = H - 4;
        for (y = 0; y < H; y++) {
          id = AIR;
          if (y === 0) id = BEDROCK;
          else if (y > h && y <= WATER_Y) id = WATER;
          else if (y > h) id = AIR;
          else if (y === h) {
            if (h <= WATER_Y + 1) id = SAND;
            else if (biome > 0.72 && h > 22) id = SNOW;
            else id = GRASS;
          } else if (y > h - 4) id = h <= WATER_Y + 1 ? SAND : DIRT;
          else id = STONE;
          if (id === STONE) {
            var cave = n3(x * 0.09, y * 0.11, z * 0.09, s.n + 70);
            if (cave > 0.72 && y > 2 && y < h - 1) id = AIR;
            else if (hash2(x, y * 3 + z, s.n) > 0.984 && y < 12) id = GOLD;
            else if (hash2(x + 9, y + z, s.n) > 0.97 && y < 18) id = IRON;
            else if (hash2(x, z + y, s.n + 2) > 0.955) id = COAL;
          }
          setb(x, y, z, id);
        }
        if (get(x, h, z) === GRASS && hash2(x, z, s.n + 5) > 0.986) setb(x, h + 1, z, FLOWER);
      }
      if (z % 8 === 0 && onProg) onProg(0.1 + (z / D) * 0.45);
    }
    var i;
    for (i = 0; i < 42; i++) {
      x = 4 + Math.floor(hash2(i, 2, s.n) * (W - 8));
      z = 4 + Math.floor(hash2(i, 7, s.n) * (D - 8));
      if (Math.hypot(x - W / 2, z - D / 2) < 14) continue;
      for (y = H - 2; y > 8; y--) if (get(x, y, z) === GRASS) break;
      if (get(x, y, z) === GRASS) growTree(x, y + 1, z, 4 + Math.floor(hash2(i, 11, s.n) * 3));
    }
    placeTemple(s.n);
    if (onProg) onProg(0.62);
  }

  function findSpawn() {
    var cx = (W / 2) | 0, cz = (D / 2) | 0, r, a, x, z, y, id;
    for (r = 0; r < 42; r++) {
      for (a = 0; a < 18; a++) {
        x = cx + Math.round(Math.cos((a / 18) * Math.PI * 2) * r);
        z = cz + Math.round(Math.sin((a / 18) * Math.PI * 2) * r);
        for (y = H - 2; y > 4; y--) {
          id = get(x, y, z);
          if (id === GRASS || id === SAND || id === SNOW) return { x: x + 0.5, y: y + 1, z: z + 0.5 };
        }
      }
    }
    return { x: cx + 0.5, y: 28, z: cz + 0.5 };
  }

  function clearAround(sx, sz, rad) {
    var x, y, z, id;
    for (x = sx - rad; x <= sx + rad; x++)
      for (z = sz - rad; z <= sz + rad; z++)
        for (y = 1; y < H; y++) {
          id = get(x, y, z);
          if (id === LOG || id === LEAVES) setb(x, y, z, AIR);
        }
  }

  var atlasTex = null;
  function makeAtlas() {
    var tile = 32, cols = 8;
    var c = document.createElement("canvas");
    c.width = cols * tile; c.height = cols * tile;
    var g = c.getContext("2d");
    function cell(i, fn) {
      g.save();
      g.translate((i % cols) * tile, Math.floor(i / cols) * tile);
      fn(g, tile);
      g.restore();
    }
    function noiseRect(ctx, size, c1, c2, seed) {
      var img = ctx.createImageData(size, size), d = img.data, i, n, r, gg, b;
      for (i = 0; i < size * size; i++) {
        n = hash2(i % size, (i / size) | 0, seed);
        r = (c1[0] + (c2[0] - c1[0]) * n) | 0;
        gg = (c1[1] + (c2[1] - c1[1]) * n) | 0;
        b = (c1[2] + (c2[2] - c1[2]) * n) | 0;
        d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    cell(0, function (ctx, s) { noiseRect(ctx, s, [62, 140, 58], [90, 180, 70], 1); });
    cell(1, function (ctx, s) { noiseRect(ctx, s, [70, 48, 28], [92, 140, 60], 2); ctx.fillStyle = "rgba(60,140,50,0.55)"; ctx.fillRect(0, 0, s, 8); });
    cell(2, function (ctx, s) { noiseRect(ctx, s, [92, 62, 34], [70, 44, 24], 3); });
    cell(3, function (ctx, s) { noiseRect(ctx, s, [120, 124, 130], [90, 94, 100], 4); });
    cell(4, function (ctx, s) { noiseRect(ctx, s, [220, 200, 120], [190, 168, 90], 5); });
    cell(5, function (ctx, s) { noiseRect(ctx, s, [40, 100, 180], [70, 160, 210], 6); ctx.globalAlpha = 0.35; ctx.fillStyle = "#9fe"; ctx.fillRect(0, 0, s, s); });
    cell(6, function (ctx, s) { noiseRect(ctx, s, [90, 64, 32], [70, 48, 24], 7); });
    cell(7, function (ctx, s) { noiseRect(ctx, s, [80, 52, 26], [110, 78, 40], 8); ctx.fillStyle = "rgba(40,20,8,0.35)"; ctx.fillRect(10, 0, 4, s); ctx.fillRect(20, 0, 3, s); });
    cell(8, function (ctx, s) { noiseRect(ctx, s, [70, 170, 72], [42, 130, 50], 9); });
    cell(9, function (ctx, s) { noiseRect(ctx, s, [96, 100, 108], [70, 74, 80], 10); });
    cell(10, function (ctx, s) { noiseRect(ctx, s, [186, 132, 70], [150, 100, 50], 11); ctx.fillStyle = "rgba(80,40,10,0.25)"; for (var i = 0; i < 4; i++) ctx.fillRect(0, i * 8, s, 2); });
    cell(11, function (ctx, s) { noiseRect(ctx, s, [180, 220, 230], [140, 190, 210], 12); ctx.globalAlpha = 0.4; ctx.fillStyle = "#fff"; ctx.fillRect(4, 4, s - 8, s - 8); });
    cell(12, function (ctx, s) { noiseRect(ctx, s, [50, 50, 54], [110, 110, 118], 13); ctx.fillStyle = "#111"; ctx.fillRect(8, 10, 6, 5); ctx.fillRect(18, 16, 7, 6); });
    cell(13, function (ctx, s) { noiseRect(ctx, s, [130, 130, 136], [90, 90, 96], 14); ctx.fillStyle = "#d8c4b0"; ctx.fillRect(7, 8, 5, 5); ctx.fillRect(16, 18, 6, 4); });
    cell(14, function (ctx, s) { noiseRect(ctx, s, [140, 140, 90], [210, 180, 60], 15); ctx.fillStyle = "#f0d24a"; ctx.fillRect(10, 9, 8, 6); });
    cell(15, function (ctx, s) { noiseRect(ctx, s, [80, 230, 210], [180, 255, 240], 16); ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.5; ctx.fillRect(10, 10, 12, 12); });
    cell(16, function (ctx, s) { noiseRect(ctx, s, [20, 20, 22], [50, 50, 54], 17); });
    cell(17, function (ctx, s) { noiseRect(ctx, s, [160, 100, 48], [120, 70, 30], 18); ctx.fillStyle = "#3a2a18"; ctx.fillRect(4, 4, s - 8, s - 8); });
    cell(18, function (ctx, s) { noiseRect(ctx, s, [150, 92, 44], [110, 64, 28], 19); });
    cell(19, function (ctx, s) {
      noiseRect(ctx, s, [62, 140, 58], [90, 180, 70], 21);
      ctx.fillStyle = "#2f7a3a"; ctx.fillRect(14, 16, 4, 14);
      ctx.fillStyle = "#e85d8a"; ctx.beginPath(); ctx.arc(16, 12, 7, 0, Math.PI * 2); ctx.fill();
    });
    cell(20, function (ctx, s) { noiseRect(ctx, s, [230, 240, 250], [200, 214, 226], 20); });
    cell(21, function (ctx, s) { noiseRect(ctx, s, [160, 70, 54], [120, 48, 38], 21); ctx.strokeStyle = "rgba(40,10,8,0.4)"; for (var i = 0; i < 4; i++) ctx.strokeRect(0, i * 8, s, 8); });
    cell(22, function (ctx, s) {
      noiseRect(ctx, s, [90, 64, 32], [70, 48, 24], 22);
      ctx.fillStyle = "#6b4423"; ctx.fillRect(14, 14, 4, 16);
      ctx.fillStyle = "#ffb347"; ctx.beginPath(); ctx.arc(16, 10, 6, 0, Math.PI * 2); ctx.fill();
    });
    atlasTex = new THREE.CanvasTexture(c);
    atlasTex.magFilter = THREE.NearestFilter;
    atlasTex.minFilter = THREE.NearestFilter;
    atlasTex.generateMipmaps = false;
    atlasTex.colorSpace = THREE.SRGBColorSpace;
    return atlasTex;
  }

  function tileUV(tile) {
    var cols = 8, inset = 0.003;
    var u0 = (tile % cols) / cols + inset;
    var v1 = 1 - Math.floor(tile / cols) / cols - inset;
    var u1 = u0 + 1 / cols - inset * 2;
    var v0 = v1 - 1 / cols + inset * 2;
    return [u0, v0, u1, v1];
  }

  var FACES = [
    { d: [1, 0, 0], n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
    { d: [-1, 0, 0], n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
    { d: [0, 1, 0], n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
    { d: [0, -1, 0], n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
    { d: [0, 0, 1], n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
    { d: [0, 0, -1], n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }
  ];

  function occluded(id, nid) {
    if (nid === AIR) return false;
    if (id === nid && (id === WATER || id === LEAVES || id === GLASS)) return true;
    var b = BLOCKS[nid];
    if (!b) return true;
    return !b.trans;
  }

  function aoAt(x, y, z, cx, cy, cz) {
    var t = (isSolid(x + cx, y, z) ? 1 : 0) + (isSolid(x, y + cy, z) ? 1 : 0) + (isSolid(x, y, z + cz) ? 1 : 0);
    return 1 - t * 0.2;
  }

  var chunkMeshes = {};
  var scene, camera, renderer, sun, hemi, highlight, arm, clock, skyMesh, opaqueMat, waterMat;

  function meshChunk(cx, cz) {
    var key = cx + "," + cz;
    var old = chunkMeshes[key];
    if (old) {
      old.forEach(function (m) { scene.remove(m); m.geometry.dispose(); });
    }
    var pos = [], nor = [], uv = [], col = [];
    var wpos = [], wnor = [], wuv = [], wcol = [];
    var x0 = cx * CHUNK, z0 = cz * CHUNK;
    var x, y, z, id, f, i, nx, ny, nz, def, tile, uvs, cr, ao, fi, destP, destN, destU, destC, shade, tint, corners, order, uvC;
    for (x = x0; x < x0 + CHUNK; x++)
      for (z = z0; z < z0 + CHUNK; z++)
        for (y = 0; y < H; y++) {
          id = get(x, y, z);
          if (!id) continue;
          def = BLOCKS[id];
          if (!def) continue;
          for (fi = 0; fi < 6; fi++) {
            f = FACES[fi];
            nx = x + f.d[0]; ny = y + f.d[1]; nz = z + f.d[2];
            if (occluded(id, get(nx, ny, nz))) continue;
            tile = f.d[1] === 1 ? def.top : f.d[1] === -1 ? def.bot : def.side;
            uvs = tileUV(tile);
            destP = id === WATER ? wpos : pos;
            destN = id === WATER ? wnor : nor;
            destU = id === WATER ? wuv : uv;
            destC = id === WATER ? wcol : col;
            shade = f.d[1] === 1 ? 1 : f.d[1] === -1 ? 0.55 : 0.78;
            tint = id === GRASS && f.d[1] === 1 ? [0.55, 1, 0.45] : [1, 1, 1];
            corners = f.c;
            order = [0, 1, 2, 0, 2, 3];
            uvC = [[uvs[0], uvs[1]], [uvs[2], uvs[1]], [uvs[2], uvs[3]], [uvs[0], uvs[3]]];
            for (i = 0; i < 6; i++) {
              cr = corners[order[i]];
              destP.push(x + cr[0], y + cr[1], z + cr[2]);
              destN.push(f.n[0], f.n[1], f.n[2]);
              destU.push(uvC[order[i]][0], uvC[order[i]][1]);
              ao = aoAt(x, y, z, cr[0] ? 1 : -1, cr[1] ? 1 : -1, cr[2] ? 1 : -1);
              destC.push(tint[0] * shade * ao, tint[1] * shade * ao, tint[2] * shade * ao);
            }
          }
        }
    var meshes = [];
    function build(p, n, u, c, mat) {
      if (!p.length) return;
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(u, 2));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
      var mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      meshes.push(mesh);
    }
    build(pos, nor, uv, col, opaqueMat);
    build(wpos, wnor, wuv, wcol, waterMat);
    chunkMeshes[key] = meshes;
  }

  function remeshAround(x, z) {
    var cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    var dx, dz, nx, nz;
    for (dx = -1; dx <= 1; dx++)
      for (dz = -1; dz <= 1; dz++) {
        nx = cx + dx; nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= W / CHUNK || nz >= D / CHUNK) continue;
        if (dx === 0 && dz === 0) continue;
        if ((x % CHUNK === 0 && dx === -1) || ((x + 1) % CHUNK === 0 && dx === 1) ||
            (z % CHUNK === 0 && dz === -1) || ((z + 1) % CHUNK === 0 && dz === 1)) meshChunk(nx, nz);
      }
    meshChunk(cx, cz);
  }

  function meshAll(onProg) {
    var nx = W / CHUNK, nz = D / CHUNK, n = 0, tot = nx * nz, cx, cz;
    for (cz = 0; cz < nz; cz++)
      for (cx = 0; cx < nx; cx++) {
        meshChunk(cx, cz);
        n++;
        if (onProg) onProg(0.62 + (n / tot) * 0.35);
      }
  }

  function initThree() {
    if (scene) return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.08, 220);
    renderer = new THREE.WebGLRenderer({ canvas: $("view"), antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene.fog = new THREE.Fog(0x7ec8ff, 28, 92);
    hemi = new THREE.HemisphereLight(0xd7ecff, 0x5a7a48, 1.05);
    scene.add(hemi);
    scene.add(new THREE.AmbientLight(0x8fb89a, 0.42));
    sun = new THREE.DirectionalLight(0xfff6e0, 1.15);
    sun.position.set(40, 80, 20);
    scene.add(sun);
    opaqueMat = new THREE.MeshLambertMaterial({ map: makeAtlas(), vertexColors: true });
    waterMat = new THREE.MeshLambertMaterial({
      map: atlasTex, vertexColors: true, transparent: true, opacity: 0.62, depthWrite: false
    });
    highlight = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
      new THREE.LineBasicMaterial({ color: 0x111111 })
    );
    highlight.visible = false;
    scene.add(highlight);
    arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.07), new THREE.MeshLambertMaterial({ color: db.profile.color }));
    arm.position.set(0.26, -0.34, -0.42);
    arm.rotation.x = 0.4;
    camera.add(arm);
    scene.add(camera);
    clock = new THREE.Clock();
    skyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(160, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x7ec8ff, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    scene.add(skyMesh);
  }

  function voxelRay(maxDist) {
    var ox = player.x, oy = player.y + EYE, oz = player.z;
    var cy = Math.cos(player.pitch);
    var dx = Math.sin(player.yaw) * cy, dy = Math.sin(player.pitch), dz = -Math.cos(player.yaw) * cy;
    var x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    var stepX = dx < 0 ? -1 : 1, stepY = dy < 0 ? -1 : 1, stepZ = dz < 0 ? -1 : 1;
    var tDeltaX = Math.abs(1 / (dx || 1e-8)), tDeltaY = Math.abs(1 / (dy || 1e-8)), tDeltaZ = Math.abs(1 / (dz || 1e-8));
    var tMaxX = tDeltaX * (dx > 0 ? x + 1 - ox : ox - x);
    var tMaxY = tDeltaY * (dy > 0 ? y + 1 - oy : oy - y);
    var tMaxZ = tDeltaZ * (dz > 0 ? z + 1 - oz : oz - z);
    var px = x, py = y, pz = z, dist = 0, i, id;
    for (i = 0; i < 64; i++) {
      if (inb(x, y, z)) {
        id = get(x, y, z);
        if (id && id !== WATER) return { x: x, y: y, z: z, px: px, py: py, pz: pz, id: id, dist: dist };
      }
      px = x; py = y; pz = z;
      if (tMaxX < tMaxY && tMaxX < tMaxZ) { dist = tMaxX; x += stepX; tMaxX += tDeltaX; }
      else if (tMaxY < tMaxZ) { dist = tMaxY; y += stepY; tMaxY += tDeltaY; }
      else { dist = tMaxZ; z += stepZ; tMaxZ += tDeltaZ; }
      if (dist > maxDist) return null;
    }
    return null;
  }

  function aabbBlocked(nx, ny, nz) {
    var x0 = nx - HW, x1 = nx + HW, y0 = ny, y1 = ny + 1.72, z0 = nz - HW, z1 = nz + HW;
    var i0 = Math.floor(x0), i1 = Math.floor(x1), j0 = Math.floor(y0), j1 = Math.floor(y1), k0 = Math.floor(z0), k1 = Math.floor(z1);
    var i, j, k;
    for (i = i0; i <= i1; i++)
      for (j = j0; j <= j1; j++)
        for (k = k0; k <= k1; k++) if (isSolid(i, j, k)) return true;
    return false;
  }

  function aabbTouches(bx, by, bz, px, py, pz) {
    return !(px + HW < bx || px - HW > bx + 1 || py + 1.72 < by || py > by + 1 || pz + HW < bz || pz - HW > bz + 1);
  }

  function itemDef(id) { return BLOCKS[id] || ITEMS[id] || { name: "?", color: "#888" }; }

  function addItem(id, n) {
    if (!id || !n) return;
    var i, s, take;
    for (i = 0; i < player.inv.length; i++) {
      s = player.inv[i];
      if (s && s.id === id && s.n < 64) {
        take = Math.min(64 - s.n, n); s.n += take; n -= take; if (!n) return;
      }
    }
    for (i = 0; i < player.inv.length; i++) {
      if (!player.inv[i]) {
        take = Math.min(64, n); player.inv[i] = { id: id, n: take }; n -= take; if (!n) return;
      }
    }
  }
  function takeItem(id, n) {
    var left = n, i, s, t;
    for (i = 0; i < player.inv.length; i++) {
      s = player.inv[i];
      if (s && s.id === id) {
        t = Math.min(s.n, left); s.n -= t; left -= t;
        if (s.n <= 0) player.inv[i] = null;
        if (!left) return true;
      }
    }
    return left <= 0;
  }
  function countItem(id) {
    var n = 0;
    player.inv.forEach(function (s) { if (s && s.id === id) n += s.n; });
    return n;
  }
  function selected() { return player.inv[player.hot]; }
  function canCraft(r) {
    return r.need.every(function (p) { return countItem(p[0]) >= p[1]; });
  }
  function doCraft(r) {
    if (!canCraft(r)) return;
    r.need.forEach(function (p) { takeItem(p[0], p[1]); });
    addItem(r.out, r.n);
    sfx("craft");
    toast(itemDef(r.out).name + " üretildi");
    renderInv();
    renderHotbar();
  }

  var keys = {};
  var pointerLocked = false;
  var mining = 0, mineHit = null, swing = 0;
  var stick = { x: 0, z: 0, on: false };
  var wantMine = false, placeCd = 0;
  var running = false, paused = false, overlayOpen = true;
  var lastSave = 0, fpsT = 0, frames = 0, fps = 0, drown = 0, fallVy = 0, footT = 0;

  var actx = null, musicTimer = 0, musicStep = 0;
  function audioOk() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!actx) actx = new Ctx();
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function beep(freq, dur, type, vol) {
    var c = audioOk();
    if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "square";
    o.frequency.value = freq;
    g.gain.value = (db.settings.sfx || 0) * (vol || 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }
  function sfx(kind) {
    if (kind === "break") beep(180, 0.08, "square", 0.07);
    else if (kind === "place") beep(320, 0.06, "triangle", 0.06);
    else if (kind === "craft") beep(520, 0.12, "sine", 0.08);
    else if (kind === "crystal") { beep(660, 0.12, "sine", 0.1); setTimeout(function () { beep(880, 0.16, "sine", 0.1); }, 90); }
    else if (kind === "hurt") beep(90, 0.18, "sawtooth", 0.1);
    else if (kind === "ui") beep(400, 0.04, "sine", 0.04);
    else if (kind === "step") beep(90 + Math.random() * 30, 0.04, "triangle", 0.03);
  }
  function tickMusic(dt) {
    if (!db.settings.music) return;
    var c = actx;
    if (!c) return;
    musicTimer += dt;
    if (musicTimer < 0.55) return;
    musicTimer = 0;
    var notes = [196, 247, 294, 330, 392, 330, 294, 247];
    var o = c.createOscillator(), g = c.createGain();
    o.type = "sine";
    o.frequency.value = notes[musicStep % notes.length];
    musicStep++;
    g.gain.value = db.settings.music * 0.035;
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.5);
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toast._id);
    toast._id = setTimeout(function () { t.classList.remove("is-on"); }, 2200);
  }

  function rankName() {
    var sc = world.mined + world.placed * 2 + world.crystals * 40;
    if (world.crystals >= 3) return "Büyük Usta";
    if (sc > 180) return "Usta";
    if (sc > 70) return "Kalfa";
    return "Çırak";
  }

  function renderHearts() {
    var h = $("hearts"), c = $("crumbs"), i, s;
    h.innerHTML = "";
    for (i = 0; i < 10; i++) {
      s = document.createElement("span");
      s.className = "heart" + (i < player.hp ? " is-on" : "");
      h.appendChild(s);
    }
    c.innerHTML = "";
    for (i = 0; i < 10; i++) {
      s = document.createElement("span");
      s.className = "crumb" + (i < Math.ceil(player.food) ? " is-on" : "");
      c.appendChild(s);
    }
    $("rank").textContent = rankName() + " · kristal " + world.crystals + "/3";
  }

  function slotEl(s, i, hot) {
    var d = document.createElement("button");
    d.type = "button";
    d.className = "slot" + (hot && i === player.hot ? " is-on" : "");
    d.dataset.i = String(i);
    if (s) {
      var ico = document.createElement("span");
      ico.className = "ico";
      ico.style.background = itemDef(s.id).color;
      d.appendChild(ico);
      if (s.n > 1) {
        var n = document.createElement("span");
        n.className = "n";
        n.textContent = String(s.n);
        d.appendChild(n);
      }
      d.title = itemDef(s.id).name;
    }
    return d;
  }

  function renderHotbar() {
    var bar = $("hotbar");
    bar.innerHTML = "";
    var i;
    for (i = 0; i < 9; i++) bar.appendChild(slotEl(player.inv[i], i, true));
  }

  function renderInv() {
    var g = $("inv-grid"), r = $("recipes");
    g.innerHTML = "";
    var i;
    for (i = 0; i < 36; i++) {
      var sl = slotEl(player.inv[i], i, false);
      sl.addEventListener("click", function (ev) {
        player.hot = Number(ev.currentTarget.dataset.i) % 9;
        if (Number(ev.currentTarget.dataset.i) < 9) player.hot = Number(ev.currentTarget.dataset.i);
        renderHotbar();
        renderInv();
      });
      g.appendChild(sl);
    }
    r.innerHTML = "";
    RECIPES.forEach(function (rec) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "recipe";
      b.disabled = !canCraft(rec);
      b.innerHTML = "<b>" + rec.name + "</b><span>" + rec.need.map(function (p) {
        return p[1] + " " + itemDef(p[0]).name;
      }).join(" · ") + "</span>";
      b.addEventListener("click", function () { doCraft(rec); });
      r.appendChild(b);
    });
  }

  function showPanel(id) {
    ["panel-menu", "panel-new", "panel-worlds", "panel-char", "panel-settings", "panel-multi", "panel-pause", "panel-help", "panel-inv", "panel-load"].forEach(function (p) {
      $(p).hidden = p !== id;
    });
    overlayOpen = !!id;
    $("overlay").hidden = !id;
    if (id) {
      pointerLocked = false;
      if (document.exitPointerLock) document.exitPointerLock();
    }
  }

  function persistWorld() {
    if (!world.id || !world.map) return;
    var rec = {
      id: world.id,
      name: world.name,
      seed: world.seed,
      seedText: world.seedText,
      time: world.time,
      mined: world.mined,
      placed: world.placed,
      crystals: world.crystals,
      temple: world.temple,
      updated: Date.now(),
      player: {
        x: player.x, y: player.y, z: player.z, yaw: player.yaw, pitch: player.pitch,
        hp: player.hp, food: player.food, inv: player.inv, hot: player.hot
      }
    };
    var bin = "";
    var i, chunk = 8192;
    for (i = 0; i < world.map.length; i += chunk) {
      bin += String.fromCharCode.apply(null, world.map.subarray(i, i + chunk));
    }
    rec.map = btoa(bin);
    var list = db.worlds.filter(function (w) { return w.id !== world.id; });
    list.unshift(rec);
    db.worlds = list.slice(0, 4);
    saveDb();
  }

  function restoreWorld(rec) {
    world.id = rec.id;
    world.name = rec.name;
    world.seed = rec.seed || 1;
    world.seedText = rec.seedText;
    world.temple = rec.temple || null;
    world.time = rec.time || 0.22;
    world.mined = rec.mined || 0;
    world.placed = rec.placed || 0;
    world.crystals = rec.crystals || 0;
    var raw = atob(rec.map);
    world.map = new Uint8Array(raw.length);
    var i;
    for (i = 0; i < raw.length; i++) world.map[i] = raw.charCodeAt(i);
    var p = rec.player || {};
    player.x = p.x; player.y = p.y; player.z = p.z;
    player.yaw = p.yaw || 0; player.pitch = p.pitch || 0;
    player.hp = p.hp == null ? 10 : p.hp;
    player.food = p.food == null ? 10 : p.food;
    player.inv = p.inv || emptyInv();
    player.hot = p.hot || 0;
    player.vx = player.vy = player.vz = 0;
  }

  function applyDayNight() {
    var t = world.time % 1;
    var day = t < 0.72;
    var k = day ? 1 - Math.abs(t - 0.36) / 0.36 : 0.08;
    if (k < 0.08) k = 0.08;
    var sky = day ? new THREE.Color().setHSL(0.58, 0.55, 0.35 + k * 0.35) : new THREE.Color(0x061018);
    if (t > 0.62 && t < 0.78) sky.setHSL(0.05, 0.7, 0.28);
    scene.fog.color.copy(sky);
    skyMesh.material.color.copy(sky);
    renderer.setClearColor(sky, 1);
    hemi.intensity = 0.45 + k * 0.7;
    sun.intensity = 0.35 + k * 0.9;
    sun.position.set(Math.cos(t * Math.PI * 2) * 80, Math.sin(t * Math.PI * 2) * 90, 20);
  }

  function hurt(n) {
    player.hp -= n;
    sfx("hurt");
    if (player.hp < 0) player.hp = 0;
    renderHearts();
    if (player.hp <= 0) {
      player.hp = 10;
      player.food = 8;
      var sp = findSpawn();
      player.x = sp.x; player.y = sp.y; player.z = sp.z;
      player.vy = 0;
      toast("Yeniden doğdunuz");
      renderHearts();
    }
  }

  function updatePlayer(dt) {
    if (dt > 0.05) dt = 0.05;
    var speed = (keys.ShiftLeft || keys.ShiftRight) ? 1.8 : 4.55;
    var cy = Math.cos(player.yaw), sy = Math.sin(player.yaw);
    var ix = 0, iz = 0;
    if (keys.KeyW || keys.ArrowUp) { ix += sy; iz -= cy; }
    if (keys.KeyS || keys.ArrowDown) { ix -= sy; iz += cy; }
    if (keys.KeyA || keys.ArrowLeft) { ix -= cy; iz -= sy; }
    if (keys.KeyD || keys.ArrowRight) { ix += cy; iz += sy; }
    if (stick.on) {
      ix = sy * stick.z + cy * stick.x;
      iz = -cy * stick.z + sy * stick.x;
    }
    var len = Math.hypot(ix, iz);
    if (len > 1) { ix /= len; iz /= len; }
    var head = get(Math.floor(player.x), Math.floor(player.y + EYE), Math.floor(player.z));
    if (head === WATER) speed *= 0.45;
    player.vx = ix * speed;
    player.vz = iz * speed;
    var grounded = aabbBlocked(player.x, player.y - 0.06, player.z);
    if ((keys.Space || keys.jump) && grounded) player.vy = 8.2;
    player.vy -= 26 * dt;
    if (player.vy < -32) player.vy = -32;
    var ny = player.y + player.vy * dt;
    if (!aabbBlocked(player.x, ny, player.z)) {
      if (player.vy < -12) fallVy = player.vy;
      player.y = ny;
    } else {
      if (player.vy < 0) {
        if (fallVy < -14) hurt(Math.min(6, Math.floor((-fallVy - 12) / 2)));
        fallVy = 0;
        player.vy = 0;
      } else player.vy = 0;
    }
    var nx = player.x + player.vx * dt;
    if (!aabbBlocked(nx, player.y, player.z)) player.x = nx;
    var nz = player.z + player.vz * dt;
    if (!aabbBlocked(player.x, player.y, nz)) player.z = nz;
    if (player.x < 1) player.x = 1;
    if (player.z < 1) player.z = 1;
    if (player.x > W - 2) player.x = W - 2;
    if (player.z > D - 2) player.z = D - 2;
    if (player.y < 1) { player.y = 1; player.vy = 0; }
    if (len > 0.2 && grounded) {
      footT += dt;
      if (footT > 0.38) { footT = 0; sfx("step"); }
    }
    if (head === WATER) {
      drown += dt;
      if (drown > 6) { drown = 4.2; hurt(1); }
    } else drown = 0;
    player.food -= dt * 0.015;
    if (player.food < 0) player.food = 0;
    if (player.food > 3 && player.hp < 10) {
      player._regen = (player._regen || 0) + dt;
      if (player._regen > 5) { player.hp++; player._regen = 0; renderHearts(); }
    }
    camera.position.set(player.x, player.y + EYE, player.z);
    camera.rotation.set(0, 0, 0);
    camera.rotateY(-player.yaw);
    camera.rotateX(player.pitch);
    if (swing > 0) {
      swing -= dt * 6;
      arm.rotation.x = 0.35 + Math.sin((1 - Math.max(swing, 0)) * Math.PI) * 0.9;
    } else arm.rotation.x = 0.35;
  }

  function tryBreak(dt) {
    var hit = voxelRay(6);
    if (!hit || hit.id === BEDROCK) { mining = 0; mineHit = null; return; }
    if (!mineHit || mineHit.x !== hit.x || mineHit.y !== hit.y || mineHit.z !== hit.z) {
      mineHit = hit; mining = 0;
    }
    var def = BLOCKS[hit.id];
    if (!def) return;
    var tool = selected() && ITEMS[selected().id];
    var spd = 1;
    if (tool && tool.speed) {
      if ((hit.id === STONE || hit.id === COBBLE || hit.id === COAL || hit.id === IRON || hit.id === GOLD || hit.id === BRICK) && tool.tool === "pick") spd = tool.speed;
      if ((hit.id === LOG || hit.id === PLANKS || hit.id === TABLE) && tool.tool === "axe") spd = tool.speed;
    }
    mining += dt;
    swing = 1;
    if (mining >= def.hard / spd) {
      setb(hit.x, hit.y, hit.z, AIR);
      if (def.drop) addItem(def.drop, 1);
      if (hit.id === CRYSTAL) {
        world.crystals++;
        toast("Usta kristali · " + world.crystals + "/3");
        sfx("crystal");
        renderHearts();
        if (world.crystals >= 3) toast("Büyük Usta oldunuz!");
      } else sfx("break");
      world.mined++;
      remeshAround(hit.x, hit.z);
      mining = 0; mineHit = null;
      renderHotbar();
    }
  }

  function tryPlace() {
    var hit = voxelRay(6);
    if (!hit) return;
    var sel = selected();
    if (!sel || !BLOCKS[sel.id]) return;
    var x = hit.px, y = hit.py, z = hit.pz;
    if (!inb(x, y, z) || get(x, y, z)) return;
    if (aabbTouches(x, y, z, player.x, player.y, player.z)) return;
    setb(x, y, z, sel.id);
    takeItem(sel.id, 1);
    world.placed++;
    remeshAround(x, z);
    sfx("place");
    swing = 1;
    renderHotbar();
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!renderer) return;
    var dt = clock ? clock.getDelta() : 0.016;
    frames++; fpsT += dt;
    if (fpsT >= 0.5) { fps = Math.round(frames / fpsT); frames = 0; fpsT = 0; }
    if (running && !paused && !overlayOpen) {
      world.time += dt / 420;
      updatePlayer(dt);
      applyDayNight();
      tickMusic(dt);
      if (wantMine) tryBreak(dt); else { mining = 0; mineHit = null; }
      placeCd -= dt;
      var hit = voxelRay(6);
      if (hit) {
        highlight.visible = true;
        highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
        var nm = BLOCKS[hit.id] ? BLOCKS[hit.id].name : "";
        $("hint").textContent = nm + (world.temple ? "  ·  Anıt " + Math.round(Math.hypot(player.x - world.temple.x, player.z - world.temple.z)) + " m" : "");
      } else {
        highlight.visible = false;
        $("hint").textContent = "WASD hareket · sol kaz · sağ yerleştir · E çanta";
      }
      lastSave += dt;
      if (lastSave > 40) { lastSave = 0; persistWorld(); }
      if (db.settings.fps) {
        $("debug").hidden = false;
        $("debug").textContent = Math.floor(player.x) + " " + Math.floor(player.y) + " " + Math.floor(player.z) + "  " + fps + " fps";
      } else $("debug").hidden = true;
    }
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function lockPointer() {
    var c = $("view");
    if (c.requestPointerLock) c.requestPointerLock();
  }

  function startGame(fromSave, rec, seedText, name) {
    showPanel("panel-load");
    $("load-bar").style.width = "6%";
    $("load-hint").textContent = "Ada şekilleniyor…";
    initThree();
    arm.material.color.set(db.profile.color);
    setTimeout(function () {
      if (fromSave) {
        try { restoreWorld(rec); } catch (err) {
          $("load-hint").textContent = "Kayıt okunamadı. Yeni dünya açın.";
          return;
        }
        if (!world.map || world.map.length !== W * H * D) {
          $("load-hint").textContent = "Kayıt bu sürümle uyumsuz.";
          return;
        }
      } else {
        generate(seedText, function (p) { $("load-bar").style.width = Math.round(p * 100) + "%"; });
        world.id = "w_" + Date.now().toString(36);
        world.name = name || "Yeşil Ada";
        world.mined = 0; world.placed = 0; world.crystals = 0; world.time = 0.22;
        player.inv = emptyInv(); player.hot = 0; player.hp = 10; player.food = 10;
        var sp = findSpawn();
        player.x = sp.x; player.y = sp.y; player.z = sp.z;
        player.yaw = 0.4; player.pitch = -0.08; player.vy = 0;
        world.time = 0.34;
        clearAround(Math.floor(sp.x), Math.floor(sp.z), 6);
      }
      Object.keys(chunkMeshes).forEach(function (k) {
        chunkMeshes[k].forEach(function (m) { scene.remove(m); m.geometry.dispose(); });
      });
      chunkMeshes = {};
      $("load-hint").textContent = "Manzara örülüyor…";
      meshAll(function (p) { $("load-bar").style.width = Math.round(p * 100) + "%"; });
      if (fromSave && !world.temple) placeTemple(world.seed || 1);
      camera.position.set(player.x, player.y + EYE, player.z);
      applyDayNight();
      running = true; paused = false;
      $("hud").hidden = false;
      $("touch").hidden = !("ontouchstart" in window);
      renderHotbar(); renderHearts();
      persistWorld();
      showPanel(null);
      toast("Hoş geldin, " + db.profile.name);
    }, 40);
  }

  function pauseGame() {
    if (!running) return;
    paused = true;
    persistWorld();
    showPanel("panel-pause");
  }

  function resumeGame() {
    paused = false;
    showPanel(null);
    lockPointer();
  }

  function renderWorlds() {
    var box = $("world-list");
    box.innerHTML = "";
    if (!db.worlds.length) {
      box.innerHTML = '<p class="hint">Henüz kayıt yok.</p>';
      return;
    }
    db.worlds.forEach(function (w) {
      var row = document.createElement("div");
      row.className = "world-item";
      var left = document.createElement("div");
      left.innerHTML = "<b>" + w.name + "</b><div class='hint'>" + new Date(w.updated).toLocaleString("tr-TR") + "</div>";
      var go = document.createElement("button");
      go.textContent = "Oyna";
      go.addEventListener("click", function () { startGame(true, w); });
      var del = document.createElement("button");
      del.textContent = "Sil";
      del.style.color = "#ef6b5a";
      del.style.background = "transparent";
      del.addEventListener("click", function () {
        db.worlds = db.worlds.filter(function (x) { return x.id !== w.id; });
        saveDb();
        renderWorlds();
      });
      row.appendChild(left);
      row.appendChild(go);
      row.appendChild(del);
      box.appendChild(row);
    });
  }

  var COLORS = ["#3dcc7a", "#5ec8ff", "#e4c36a", "#ef6b5a", "#c084fc", "#f472b6", "#f8fafc", "#38bdf8"];
  function renderColors() {
    var box = $("char-colors");
    box.innerHTML = "";
    COLORS.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (db.profile.color === c ? " is-on" : "");
      b.style.background = c;
      b.addEventListener("click", function () {
        db.profile.color = c;
        renderColors();
      });
      box.appendChild(b);
    });
  }

  function bindUi() {
    $("btn-new").onclick = function () { sfx("ui"); showPanel("panel-new"); $("new-name").value = "Yeşil Ada"; $("new-seed").value = ""; };
    $("btn-worlds").onclick = function () { sfx("ui"); renderWorlds(); showPanel("panel-worlds"); };
    $("btn-char").onclick = function () { sfx("ui"); $("char-name").value = db.profile.name; renderColors(); showPanel("panel-char"); };
    $("btn-settings").onclick = function () {
      sfx("ui");
      $("set-sens").value = db.settings.sens;
      $("set-music").value = db.settings.music;
      $("set-sfx").value = db.settings.sfx;
      $("set-invert").checked = db.settings.invert;
      $("set-fps").checked = db.settings.fps;
      showPanel("panel-settings");
    };
    $("btn-multi").onclick = function () { sfx("ui"); $("mp-msg").textContent = ""; showPanel("panel-multi"); };
    $("new-back").onclick = $("worlds-back").onclick = $("char-back").onclick = $("mp-back").onclick = function () { showPanel("panel-menu"); };
    $("new-go").onclick = function () {
      audioOk();
      startGame(false, null, $("new-seed").value, $("new-name").value.trim() || "Yeşil Ada");
    };
    $("char-save").onclick = function () {
      db.profile.name = $("char-name").value.trim() || "Kaşif";
      saveDb();
      showPanel("panel-menu");
    };
    $("set-save").onclick = function () {
      db.settings.sens = Number($("set-sens").value);
      db.settings.music = Number($("set-music").value);
      db.settings.sfx = Number($("set-sfx").value);
      db.settings.invert = $("set-invert").checked;
      db.settings.fps = $("set-fps").checked;
      saveDb();
      if (running) { paused = false; showPanel(null); } else showPanel("panel-menu");
    };
    $("mp-go").onclick = function () {
      var code = $("mp-code").value.trim();
      var msg = $("mp-msg");
      if (code.length < 3) { msg.className = "msg err"; msg.textContent = "En az 3 karakterlik davet kodu girin."; return; }
      msg.className = "msg"; msg.textContent = "Sunucuya bağlanılıyor…";
      var ws;
      try { ws = new WebSocket("wss://oyun.rotanergy.com"); }
      catch (e) { msg.className = "msg err"; msg.textContent = "Bu tarayıcı WebSocket desteklemiyor."; return; }
      var done = false;
      var t = setTimeout(function () {
        if (done) return;
        done = true;
        try { ws.close(); } catch (e2) {}
        msg.className = "msg err";
        msg.textContent = "Sunucu şu an kapalı. Tek oyunculu maceraya devam edebilirsiniz.";
      }, 4000);
      ws.onopen = function () {
        done = true; clearTimeout(t);
        ws.send(JSON.stringify({ t: "join", code: code, name: db.profile.name, color: db.profile.color }));
        msg.className = "msg ok";
        msg.textContent = "Bağlandı. Oda senkronu bekleniyor…";
      };
      ws.onerror = ws.onclose = function () {
        if (done) return;
        done = true; clearTimeout(t);
        msg.className = "msg err";
        msg.textContent = "Oda sunucusuna ulaşılamadı. Dünya kayıtları cihazınızda güvende.";
      };
    };
    $("pause-resume").onclick = resumeGame;
    $("pause-inv").onclick = function () { renderInv(); showPanel("panel-inv"); };
    $("pause-help").onclick = function () { showPanel("panel-help"); };
    $("pause-save").onclick = function () {
      persistWorld();
      running = false; paused = false;
      $("hud").hidden = true;
      showPanel("panel-menu");
    };
    $("help-back").onclick = function () { if (running) showPanel("panel-pause"); else showPanel("panel-menu"); };
    $("inv-close").onclick = function () { if (running) resumeGame(); else showPanel("panel-menu"); };

    window.addEventListener("keydown", function (e) {
      keys[e.code] = true;
      if (e.code === "Escape") {
        if (running && !overlayOpen) pauseGame();
        else if (running && $("panel-pause").hidden === false) resumeGame();
        return;
      }
      if (!running || overlayOpen) return;
      if (e.code === "KeyE") { paused = true; renderInv(); showPanel("panel-inv"); e.preventDefault(); }
      if (e.code >= "Digit1" && e.code <= "Digit9") player.hot = Number(e.code.slice(-1)) - 1, renderHotbar();
    });
    window.addEventListener("keyup", function (e) { keys[e.code] = false; });
    window.addEventListener("blur", function () { keys = {}; });

    $("view").addEventListener("click", function () {
      if (running && !overlayOpen) lockPointer();
    });
    document.addEventListener("pointerlockchange", function () {
      pointerLocked = document.pointerLockElement === $("view");
    });
    document.addEventListener("mousemove", function (e) {
      if (!pointerLocked || overlayOpen) return;
      var s = db.settings.sens * 0.0022;
      player.yaw += e.movementX * s;
      player.pitch -= e.movementY * s * (db.settings.invert ? -1 : 1);
      if (player.pitch < -1.4) player.pitch = -1.4;
      if (player.pitch > 1.4) player.pitch = 1.4;
    });
    $("view").addEventListener("mousedown", function (e) {
      if (!running || overlayOpen) return;
      if (e.button === 0) wantMine = true;
      if (e.button === 2) { e.preventDefault(); tryPlace(); }
    });
    window.addEventListener("mouseup", function (e) { if (e.button === 0) wantMine = false; });
    $("view").addEventListener("contextmenu", function (e) { e.preventDefault(); });
    $("view").addEventListener("wheel", function (e) {
      if (!running || overlayOpen) return;
      player.hot = (player.hot + (e.deltaY > 0 ? 1 : -1) + 9) % 9;
      renderHotbar();
    }, { passive: true });

    $("hotbar").addEventListener("click", function (e) {
      var sl = e.target.closest(".slot");
      if (!sl) return;
      player.hot = Number(sl.dataset.i);
      renderHotbar();
    });

    var stickEl = $("stick"), knob = $("knob");
    function stickFrom(cx, cy) {
      var r = stickEl.getBoundingClientRect();
      var x = (cx - (r.left + r.width / 2)) / (r.width / 2);
      var y = (cy - (r.top + r.height / 2)) / (r.height / 2);
      var l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
      stick.on = true; stick.x = x; stick.z = -y;
      knob.style.left = 37 + x * 32 + "px";
      knob.style.top = 37 + y * 32 + "px";
    }
    stickEl.addEventListener("touchstart", function (e) { e.preventDefault(); stickFrom(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    stickEl.addEventListener("touchmove", function (e) { e.preventDefault(); stickFrom(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    stickEl.addEventListener("touchend", function () { stick.on = false; stick.x = stick.z = 0; knob.style.left = "37px"; knob.style.top = "37px"; });
    var look = $("lookpad"), lx = 0, ly = 0, looking = false;
    look.addEventListener("touchstart", function (e) { looking = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY; }, { passive: true });
    look.addEventListener("touchmove", function (e) {
      if (!looking) return;
      var t = e.touches[0];
      var dx = t.clientX - lx, dy = t.clientY - ly;
      lx = t.clientX; ly = t.clientY;
      player.yaw += dx * 0.008 * db.settings.sens;
      player.pitch -= dy * 0.008 * db.settings.sens * (db.settings.invert ? -1 : 1);
      if (player.pitch < -1.4) player.pitch = -1.4;
      if (player.pitch > 1.4) player.pitch = 1.4;
    }, { passive: true });
    look.addEventListener("touchend", function () { looking = false; });
    $("t-jump").addEventListener("touchstart", function (e) { e.preventDefault(); keys.jump = true; }, { passive: false });
    $("t-jump").addEventListener("touchend", function () { keys.jump = false; });
    $("t-mine").addEventListener("touchstart", function (e) { e.preventDefault(); wantMine = true; }, { passive: false });
    $("t-mine").addEventListener("touchend", function () { wantMine = false; });
    $("t-place").addEventListener("touchstart", function (e) { e.preventDefault(); tryPlace(); }, { passive: false });
    $("t-inv").addEventListener("click", function () { paused = true; renderInv(); showPanel("panel-inv"); });
  }

  window.addEventListener("resize", function () {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  bindUi();
  showPanel("panel-menu");
  loop();
})();
