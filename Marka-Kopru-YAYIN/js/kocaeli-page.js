(function () {
  if (/github\.io$/i.test(location.hostname) || /github\.io\./i.test(location.hostname)) {
    var fe = document.getElementById("feed-empty");
    if (fe) {
      fe.hidden = false;
      fe.textContent =
        "Statik (GitHub Pages) ortamda Kocaeli modülü API’si yok. Tam sürüm için proje kökünde backend ile PLATFORM-BASLAT / npm start kullanın.";
    }
    return;
  }

  var API = "/api/v1/kocaeli";

  var ILCE_LABEL = {
    izmit: "İzmit",
    derince: "Derince",
    korfez: "Körfez",
    kartepe: "Kartepe",
    basiskele: "Başiskele",
    golcuk: "Gölcük",
    kandira: "Kandıra",
    darica: "Darıca",
    cayirova: "Çayırova",
    dilovasi: "Dilovası",
    gebze: "Gebze",
  };

  var state = {
    ilce: "",
    category: "",
    sort: "new",
    catLabels: {},
    ilceler: [],
    posts: [],
    trending: [],
    dlgPostId: null,
    token: null,
  };

  function anonId() {
    var k = "k41_kocaeli_anon";
    try {
      var v = localStorage.getItem(k);
      if (v && v.length > 8) return v;
      v = crypto.randomUUID();
      localStorage.setItem(k, v);
      return v;
    } catch {
      return "sess-" + String(Math.random()).slice(2);
    }
  }

  function authHeader() {
    try {
      var t = localStorage.getItem("k41_token") || localStorage.getItem("token");
      if (t) return { Authorization: "Bearer " + t };
    } catch {}
    return {};
  }

  function mergeHeaders(h) {
    var o = Object.assign({ "Content-Type": "application/json" }, h || {});
    return Object.assign(o, authHeader());
  }

  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function badgeClass(cat) {
    if (cat === "sikayet") return "k41-badge k41-badge--sikayet";
    if (cat === "tesekkur") return "k41-badge k41-badge--tesekkur";
    return "k41-badge";
  }

  function loadPosts() {
    var q = [];
    if (state.ilce) q.push("ilce=" + encodeURIComponent(state.ilce));
    if (state.category) q.push("category=" + encodeURIComponent(state.category));
    q.push("sort=" + encodeURIComponent(state.sort));
    return fetch(API + "/posts?" + q.join("&"), { credentials: "same-origin" })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.message || j.error || "İstek başarısız");
          state.catLabels = j.labels || {};
          state.ilceler = j.ilceler || state.ilceler;
          state.posts = j.items || [];
          return j;
        });
      });
  }

  function loadTrending() {
    return fetch(API + "/trending", { credentials: "same-origin" })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error);
          state.trending = j.topics || [];
          return j;
        });
      })
      .catch(function () {
        state.trending = [];
      });
  }

  function fillSelects() {
    var si = document.getElementById("f-ilce");
    var sc = document.getElementById("f-cat");
    if (!si || !sc) return;
    si.innerHTML = "";
    sc.innerHTML = "";
    (state.ilceler || []).forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      o.textContent = ILCE_LABEL[c] || c;
      si.appendChild(o);
    });
    Object.keys(state.catLabels || {}).forEach(function (k) {
      var o = document.createElement("option");
      o.value = k;
      o.textContent = state.catLabels[k] || k;
      sc.appendChild(o);
    });
  }

  function renderChips() {
    var ilWrap = document.getElementById("ilce-filters");
    var catWrap = document.getElementById("cat-filters");
    if (!ilWrap || !catWrap) return;
    ilWrap.innerHTML = "";
    catWrap.innerHTML = "";

    var allI = el("button", "k41-chip" + (state.ilce ? "" : " is-on"), "Tümü");
    allI.type = "button";
    allI.addEventListener("click", function () {
      state.ilce = "";
      refresh();
    });
    ilWrap.appendChild(allI);

    (state.ilceler || []).forEach(function (c) {
      var b = el("button", "k41-chip" + (state.ilce === c ? " is-on" : ""), ILCE_LABEL[c] || c);
      b.type = "button";
      b.addEventListener("click", function () {
        state.ilce = c;
        refresh();
      });
      ilWrap.appendChild(b);
    });

    var allC = el("button", "k41-chip" + (state.category ? "" : " is-on"), "Tümü");
    allC.type = "button";
    allC.addEventListener("click", function () {
      state.category = "";
      refresh();
    });
    catWrap.appendChild(allC);

    Object.keys(state.catLabels || {}).forEach(function (k) {
      var b = el("button", "k41-chip" + (state.category === k ? " is-on" : ""), state.catLabels[k] || k);
      b.type = "button";
      b.addEventListener("click", function () {
        state.category = k;
        refresh();
      });
      catWrap.appendChild(b);
    });
  }

  function renderTrending() {
    var ol = document.getElementById("trending-list");
    var empty = document.getElementById("trending-empty");
    if (!ol) return;
    ol.innerHTML = "";
    if (!state.trending.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    state.trending.forEach(function (t, idx) {
      var li = document.createElement("li");
      li.innerHTML =
        "<strong>#" +
        (idx + 1) +
        "</strong> " +
        (t.categoryLabel || state.catLabels[t.category] || t.category) +
        " · " +
        (ILCE_LABEL[t.ilce] || t.ilce) +
        " <span class='k41-muted'>(" +
        Math.round(t.score) +
        ")</span>";
      ol.appendChild(li);
    });
  }

  function renderFeed() {
    var root = document.getElementById("feed");
    var empty = document.getElementById("feed-empty");
    if (!root) return;
    root.innerHTML = "";
    if (!state.posts.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    state.posts.forEach(function (p) {
      var card = el("article", "k41-post");
      var meta = el("div", "k41-post__meta");
      var lab = state.catLabels[p.category] || p.category;
      var badge = el("span", badgeClass(p.category));
      badge.textContent = lab;
      meta.appendChild(badge);
      meta.appendChild(el("span", "k41-post__loc", "📍 " + (ILCE_LABEL[p.ilce] || p.ilce)));
      meta.appendChild(el("span", "k41-post__time", fmtDate(p.createdAt)));
      card.appendChild(meta);

      if (p.title) card.appendChild(el("h3", "k41-post__title", escapeHtml(p.title)));
      card.appendChild(el("p", "k41-post__body", escapeHtml(p.body)));

      if (p.photoUrl) {
        var ph = el("div", "k41-post__photo");
        var img = document.createElement("img");
        img.src = p.photoUrl;
        img.alt = "";
        ph.appendChild(img);
        card.appendChild(ph);
      }

      var foot = el("div", "k41-post__meta");
      foot.appendChild(el("span", "k41-post__loc", "@" + escapeHtml(p.authorLabel)));
      card.appendChild(foot);

      var actions = el("div", "k41-post__actions");
      var likeBtn = el("button", "", "Beğen · " + (p.likeCount || 0));
      likeBtn.type = "button";
      likeBtn.addEventListener("click", function () {
        likePost(p.id, likeBtn);
      });
      var comBtn = el("button", "", "Yorum · " + (p.commentCount || 0));
      comBtn.type = "button";
      comBtn.addEventListener("click", function () {
        openThread(p.id);
      });
      var repBtn = el("button", "", "Bildir");
      repBtn.type = "button";
      repBtn.addEventListener("click", function () {
        openReport("post", p.id);
      });
      actions.appendChild(likeBtn);
      actions.appendChild(comBtn);
      actions.appendChild(repBtn);
      card.appendChild(actions);

      root.appendChild(card);
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function likePost(id, btn) {
    fetch(API + "/like", {
      method: "POST",
      headers: mergeHeaders({ "X-K41-Anonymous": anonId() }),
      credentials: "same-origin",
      body: JSON.stringify({ postId: id }),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.message || j.error);
          btn.textContent = (j.liked ? "Beğendin · " : "Beğen · ") + (j.likeCount != null ? j.likeCount : "");
          return refresh();
        });
      })
      .catch(function (e) {
        alert(String(e.message || e));
      });
  }

  function refresh() {
    return loadPosts()
      .then(function () {
        renderChips();
        renderFeed();
      })
      .catch(function (e) {
        document.getElementById("feed-empty").hidden = false;
        document.getElementById("feed-empty").textContent =
          "Akış yüklenemedi. Sunucu (PLATFORM-BASLAT) çalışıyor mu? " + (e.message || e);
      });
  }

  function openThread(id) {
    state.dlgPostId = id;
    var dlg = document.getElementById("dlg-thread");
    var box = document.getElementById("dlg-post");
    var ul = document.getElementById("dlg-comments");
    fetch(API + "/post/" + id, { credentials: "same-origin" })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error);
          var p = j.post;
          box.innerHTML =
            "<div class='k41-post__meta'><span class='" +
            badgeClass(p.category) +
            "'>" +
            escapeHtml(p.categoryLabel || "") +
            "</span><span class='k41-post__loc'>📍 " +
            escapeHtml(ILCE_LABEL[p.ilce] || p.ilce) +
            "</span></div>" +
            (p.title ? "<h3 class='k41-post__title'>" + escapeHtml(p.title) + "</h3>" : "") +
            "<p class='k41-post__body'>" +
            escapeHtml(p.body) +
            "</p>";
          if (p.photoUrl) {
            var wrap = document.createElement("div");
            wrap.className = "k41-post__photo";
            var im = document.createElement("img");
            im.src = p.photoUrl;
            im.alt = "";
            wrap.appendChild(im);
            box.appendChild(wrap);
          }
          ul.innerHTML = "";
          (j.comments || []).forEach(function (c) {
            var li = document.createElement("li");
            li.innerHTML =
              "<small>" +
              escapeHtml(c.authorLabel) +
              " · " +
              fmtDate(c.createdAt) +
              "</small>" +
              escapeHtml(c.body);
            ul.appendChild(li);
          });
          var anonWrap = document.getElementById("dlg-anon-wrap");
          var hasTok = !!authHeader().Authorization;
          anonWrap.style.display = hasTok ? "none" : "flex";
          dlg.showModal();
        });
      })
      .catch(function (e) {
        alert(String(e.message || e));
      });
  }

  function openReport(type, id) {
    document.getElementById("rep-type").value = type;
    document.getElementById("rep-id").value = id;
    document.getElementById("rep-reason").value = "";
    document.getElementById("dlg-report").showModal();
  }

  document.getElementById("dlg-close").addEventListener("click", function () {
    document.getElementById("dlg-thread").close();
  });

  document.getElementById("rep-cancel").addEventListener("click", function () {
    document.getElementById("dlg-report").close();
  });

  document.getElementById("dlg-comment-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var body = document.getElementById("dlg-comment-body").value.trim();
    var anonLab = document.getElementById("dlg-anon-label").value.trim();
    var payload = { postId: state.dlgPostId, body: body };
    if (!authHeader().Authorization) payload.anonLabel = anonLab || "Anonim";
    fetch(API + "/comment", {
      method: "POST",
      headers: mergeHeaders(),
      credentials: "same-origin",
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.message || j.error);
          document.getElementById("dlg-comment-body").value = "";
          openThread(state.dlgPostId);
          refresh();
        });
      })
      .catch(function (e) {
        alert(String(e.message || e));
      });
  });

  document.getElementById("report-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var reason = document.getElementById("rep-reason").value.trim();
    var payload = {
      targetType: document.getElementById("rep-type").value,
      targetId: document.getElementById("rep-id").value,
      reason: reason,
    };
    fetch(API + "/report", {
      method: "POST",
      headers: mergeHeaders(),
      credentials: "same-origin",
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.message || j.error);
          alert(j.message || "Kaydedildi.");
          document.getElementById("dlg-report").close();
        });
      })
      .catch(function (e) {
        alert(String(e.message || e));
      });
  });

  document.querySelectorAll(".k41-pill").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".k41-pill").forEach(function (x) {
        x.classList.remove("is-on");
      });
      b.classList.add("is-on");
      state.sort = b.getAttribute("data-sort") || "new";
      refresh();
    });
  });

  document.getElementById("f-photo").addEventListener("change", function () {
    var prev = document.getElementById("f-photo-preview");
    prev.innerHTML = "";
    var f = this.files && this.files[0];
    if (!f) {
      prev.hidden = true;
      return;
    }
    var rd = new FileReader();
    rd.onload = function () {
      var u = rd.result;
      if (String(u).length > 400000) {
        alert("Görsel çok büyük; daha küçük bir JPEG/PNG deneyin.");
        prev.hidden = true;
        return;
      }
      var img = document.createElement("img");
      img.src = u;
      prev.appendChild(img);
      prev.hidden = false;
    };
    rd.readAsDataURL(f);
  });

  document.getElementById("compose-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var msg = document.getElementById("compose-msg");
    msg.textContent = "";
    msg.className = "k41-msg";

    var body = document.getElementById("f-body").value.trim();
    var title = document.getElementById("f-title").value.trim();
    var ilce = document.getElementById("f-ilce").value;
    var category = document.getElementById("f-cat").value;
    var anonymous = document.getElementById("f-anon").checked;
    var prev = document.querySelector("#f-photo-preview img");
    var photoUrl = prev && prev.src ? prev.src : null;

    var payload = {
      body: body,
      title: title || undefined,
      ilce: ilce,
      category: category,
      anonymous: anonymous,
      photoUrl: photoUrl || undefined,
    };

    fetch(API + "/post", {
      method: "POST",
      headers: mergeHeaders(),
      credentials: "same-origin",
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.message || (j.details && j.details[0] && j.details[0].msg) || j.error);
          msg.textContent = "Gönderin yayında.";
          msg.className = "k41-msg is-ok";
          ev.target.reset();
          document.getElementById("f-photo-preview").innerHTML = "";
          document.getElementById("f-photo-preview").hidden = true;
          document.getElementById("f-anon").checked = true;
          return Promise.all([refresh(), loadTrending()]).then(function () {
            renderTrending();
          });
        });
      })
      .catch(function (e) {
        msg.textContent = String(e.message || e);
        msg.className = "k41-msg is-err";
      });
  });

  loadPosts()
    .then(function () {
      fillSelects();
      renderChips();
      renderFeed();
      return loadTrending();
    })
    .then(function () {
      renderTrending();
    })
    .catch(function () {
      document.getElementById("feed-empty").hidden = false;
      document.getElementById("feed-empty").textContent =
        "API’ye ulaşılamadı. backend klasöründe npm start veya üstteki PLATFORM-BASLAT.bat ile sunucuyu açın.";
    });
})();
