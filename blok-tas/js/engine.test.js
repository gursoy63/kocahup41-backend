#!/usr/bin/env node
"use strict";
const E = require("./engine.js");
let fail = 0;
function ok(name, cond) {
  if (!cond) {
    fail++;
    console.error("FAIL", name);
  } else console.log("ok", name);
}

ok("12 levels", E.LEVELS.length === 12);
ok("unique accents", new Set(E.LEVELS.map((l) => l.accent)).size === 12);
ok("shapes unlock by min", E.poolFor(1).every((s) => s.min <= 1) && E.poolFor(8).length > E.poolFor(1).length);

const b = E.emptyBoard();
ok("empty anyFit 1x1", E.anyFit(b, [[0, 0]]));
ok("cannot place OOB", !E.canPlace(b, [[0, 0], [0, 1]], 0, 7));

E.place(b, [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]], 0, 0, 1);
ok("row not full yet", E.findClears(b).rows.length === 0);
E.place(b, [[0, 0]], 0, 7, 1);
ok("row full", E.findClears(b).rows[0] === 0);
const n = E.applyClears(b, E.findClears(b));
ok("cleared 8", n === 8);
ok("row empty after", !b[0]);

const r = E.rotateCells([[0, 0], [0, 1], [0, 2], [1, 1]]);
ok("T rotate has 4", r.length === 4);

const rnd = E.rngFrom(42);
const hand = E.deal(E.emptyBoard(), 1, rnd, ["#a", "#b", "#c"]);
ok("deal 3", hand.length === 3);
ok("level1 pieces min1", hand.every((p) => p.min <= 1));
ok("hand can play empty", E.handCanPlay(E.emptyBoard(), hand));

const full = E.emptyBoard();
for (let i = 0; i < 64; i++) full[i] = 1;
ok("full board no fit", !E.anyFit(full, [[0, 0]]));

ok("bomb removes", E.bombAt(E.copyBoard(full), 3, 3) === 9);
ok("score combo", E.lineScore(16, 2) > E.lineScore(8, 1));

if (fail) {
  console.error("FAILED", fail);
  process.exit(1);
}
console.log("ENGINE_OK");
