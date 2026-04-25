"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = path.resolve(__dirname);
const port = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function isUnderRoot(resolved) {
  const r = path.resolve(ROOT) + path.sep;
  return resolved === path.resolve(ROOT) || resolved.startsWith(r);
}

http
  .createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain" });
      return res.end("Method not allowed");
    }

    let pathname;
    try {
      pathname = new URL(req.url || "/", "http://_").pathname;
    } catch {
      res.writeHead(400);
      return res.end("Bad request");
    }

    const rel =
      pathname === "/" || pathname === ""
        ? "index.html"
        : path.normalize(decodeURIComponent(pathname).replace(/^\//, ""));

    if (rel.startsWith("..") || rel.includes("..") || !rel) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Bad path");
    }

    const file = path.join(ROOT, rel);
    if (!isUnderRoot(file)) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Bad path");
    }

    let st;
    try {
      st = fs.statSync(file);
    } catch {
      st = null;
    }

    if (st && st.isFile()) {
      const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      if (req.method === "HEAD") return res.end();
      return fs.createReadStream(file).on("error", onErr).pipe(res);
    }

    const fallback = path.join(ROOT, "404.html");
    let st2;
    try {
      st2 = fs.statSync(fallback);
    } catch {
      st2 = null;
    }
    if (st2 && st2.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      if (req.method === "HEAD") return res.end();
      return fs.createReadStream(fallback).on("error", onErr).pipe(res);
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");

    function onErr() {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
  })
  .listen(port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log("marka-kopru listening on " + port);
  });
