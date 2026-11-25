(function () {
  var KEY = "gililand-storyboard-2026-11-25-pins";
  var WA = "972548469516";
  var MAX_URL = 4000;
  var ST;
  try { ST = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { ST = {}; }
  ST.pins = ST.pins || [];
  ST.notes = ST.notes || {};

  function save() { localStorage.setItem(KEY, JSON.stringify(ST)); }
  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function byId(id) { return document.getElementById(id); }
  function secById(id) {
    for (var i = 0; i < SECS.length; i++) if (SECS[i].id === id) return SECS[i];
  }
  function addItem(list, item) {
    if (!item) return;
    if (item.kind === "pair") {
      (item.items || []).forEach(function (it) { addItem(list, it); });
      return;
    }
    for (var i = 0; i < list.length; i++) if (list[i].id === item.id) return;
    list.push(item);
  }
  function gallery(s) {
    var list = [];
    (s.featured || []).forEach(function (it) { addItem(list, it); });
    (s.groups || []).forEach(function (g) {
      (g.featured || []).forEach(function (it) { addItem(list, it); });
      (g.pages || []).forEach(function (it) { addItem(list, it); });
    });
    return list;
  }
  function findInGallery(s, pid) {
    var g = gallery(s);
    for (var i = 0; i < g.length; i++) if (g[i].id === pid) return { item: g[i], index: i, list: g };
    return null;
  }
  function pageById(pid) {
    for (var s = 0; s < SECS.length; s++) {
      var found = findInGallery(SECS[s], pid);
      if (found) return { sec: SECS[s], page: found.item, index: found.index, list: found.list };
    }
  }
  function pinCount(pageId) {
    var n = 0;
    ST.pins.forEach(function (p) { if (p.img === pageId) n++; });
    return n;
  }

  var viewer = { open: false, sec: null, index: 0, list: [], sel: -1 };

  function renderNav() {
    var nav = byId("nav");
    nav.innerHTML = "";
    SECS.forEach(function (s) {
      var a = document.createElement("a");
      a.className = "nav-item";
      a.href = "#" + s.id;
      a.setAttribute("data-sec", s.id);
      a.innerHTML = '<img src="' + s.navImg + '" alt="' + esc(s.nav) + '"><span>' + esc(s.nav) + "</span>";
      nav.appendChild(a);
    });
  }

  function featButton(item, extraClass) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "feat" + (extraClass ? " " + extraClass : "") + (item.kind === "sheet" ? " sheet" : "");
    b.innerHTML = '<img src="' + item.src + '" alt="' + esc(item.label) + '" loading="lazy">' +
      '<span class="cap">' + esc(item.label) + "</span>";
    b.onclick = function () { openViewerById(item.id); };
    return b;
  }

  function renderFeatured(host, items) {
    if (!items || !items.length) return;
    var box = document.createElement("div");
    box.className = "featured";
    items.forEach(function (it) {
      if (it.kind === "pair") {
        (it.items || []).forEach(function (child) { box.appendChild(featButton(child)); });
      } else {
        box.appendChild(featButton(it, it.kind === "sheet" ? "sheet" : ""));
      }
    });
    host.appendChild(box);
  }

  function renderThumbs(host, s, pages) {
    var box = document.createElement("div");
    box.className = "pages";
    pages.forEach(function (pg, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "page-th" + (s.tall ? " tall" : "") + (pg.blank ? " blank" : "");
      var n = pinCount(pg.id);
      b.innerHTML =
        '<img src="' + pg.src + '" alt="' + esc(pg.label) + '" loading="' + (i < 8 ? "eager" : "lazy") + '">' +
        (pg.blank ? '<span class="blank-tag">לבן</span>' : "") +
        (n ? '<span class="dot">' + n + "</span>" : "") +
        '<span class="cap">' + esc(pg.label) + "</span>";
      b.onclick = function () { openViewerById(pg.id); };
      box.appendChild(b);
    });
    host.appendChild(box);
  }

  function renderSecs() {
    var host = byId("secs");
    host.innerHTML = "";
    SECS.forEach(function (s) {
      var el = document.createElement("section");
      el.className = "sec";
      el.id = s.id;
      var head = document.createElement("h2");
      head.textContent = s.title;
      el.appendChild(head);
      if (s.note) {
        var note = document.createElement("p");
        note.className = "note";
        note.textContent = s.note;
        el.appendChild(note);
      }
      if (s.details) {
        var d = document.createElement("details");
        d.innerHTML = "<summary>פרטים</summary><p>" + esc(s.details) + "</p>";
        el.appendChild(d);
      }
      renderFeatured(el, s.featured || []);
      (s.groups || []).forEach(function (g) {
        if (g.title) {
          var h3 = document.createElement("h3");
          h3.textContent = g.title;
          el.appendChild(h3);
        }
        renderFeatured(el, g.featured || []);
        if (g.pages && g.pages.length) renderThumbs(el, s, g.pages);
      });
      var nb = document.createElement("div");
      nb.className = "note-box";
      nb.innerHTML = '<label for="tx-' + s.id + '">הערה כללית לחלק הזה</label>' +
        '<textarea id="tx-' + s.id + '" placeholder="הערה כללית…"></textarea>';
      el.appendChild(nb);
      host.appendChild(el);
      var ta = byId("tx-" + s.id);
      ta.value = ST.notes[s.id] || "";
      ta.oninput = function () { ST.notes[s.id] = ta.value; save(); };
    });
  }

  function setActiveNav() {
    var hdr = document.querySelector("header");
    var y = (hdr ? hdr.offsetHeight : 140) + 24;
    var current = SECS[0] && SECS[0].id;
    SECS.forEach(function (s) {
      var el = byId(s.id);
      if (!el) return;
      var top = el.getBoundingClientRect().top;
      if (top <= y) current = s.id;
    });
    document.querySelectorAll(".nav-item").forEach(function (el) {
      el.classList.toggle("active", el.getAttribute("data-sec") === current);
    });
  }

  function openViewerById(pid) {
    var found = pageById(pid);
    if (!found) return;
    viewer.open = true;
    viewer.sec = found.sec.id;
    viewer.list = found.list;
    viewer.index = found.index;
    viewer.sel = -1;
    byId("viewer").className = "on";
    document.body.style.overflow = "hidden";
    drawViewer();
  }
  function closeViewer() {
    viewer.open = false;
    byId("viewer").className = "";
    document.body.style.overflow = "";
    renderSecs();
    setActiveNav();
  }
  function drawViewer() {
    var s = secById(viewer.sec);
    var pg = viewer.list[viewer.index];
    byId("v-title").textContent = s.title + " · " + pg.label;
    var img = byId("v-img");
    img.alt = pg.label;
    if (img.getAttribute("src") !== pg.src) img.src = pg.src;
    drawPins();
  }
  function drawPins() {
    var pg = viewer.list[viewer.index];
    var stg = byId("v-stage");
    stg.querySelectorAll(".pin").forEach(function (e) { e.remove(); });
    var L = byId("v-list");
    L.innerHTML = "";
    var n = 0;
    ST.pins.forEach(function (p, idx) {
      if (p.img !== pg.id) return;
      n++;
      var num = n;
      var pin = document.createElement("div");
      pin.className = "pin" + (viewer.sel === idx ? " sel" : "");
      pin.textContent = num;
      pin.style.left = "calc(" + p.x + "% - 26px)";
      pin.style.top = p.y + "%";
      pin.onclick = function (e) {
        e.stopPropagation();
        viewer.sel = idx;
        drawPins();
        var t = L.querySelector('[data-i="' + idx + '"] textarea');
        if (t) t.focus();
      };
      stg.appendChild(pin);
      var d = document.createElement("div");
      d.className = "item";
      d.setAttribute("data-i", idx);
      d.innerHTML =
        "<b>#" + num + "</b> <span class=\"hint\">(" + p.x + "%, " + p.y + "%)</span> " +
        "<button type=\"button\" class=\"del\">✕</button>" +
        "<textarea placeholder=\"כתבו הערה…\"></textarea>";
      var t = d.querySelector("textarea");
      t.value = p.c || "";
      t.oninput = function () { p.c = t.value; save(); };
      d.querySelector(".del").onclick = function () {
        if (confirm("למחוק סיכה " + num + "?")) {
          ST.pins.splice(idx, 1);
          if (viewer.sel === idx) viewer.sel = -1;
          save();
          drawPins();
        }
      };
      L.appendChild(d);
    });
    if (!n) L.innerHTML = '<p class="hint">לחיצה על התמונה נועצת סיכה.</p>';
  }

  byId("v-stage").addEventListener("click", function (e) {
    if (!viewer.open) return;
    if (e.target.classList.contains("pin")) return;
    var im = byId("v-img");
    var r = im.getBoundingClientRect();
    var x = +((e.clientX - r.left) / r.width * 100).toFixed(1);
    var y = +((e.clientY - r.top) / r.height * 100).toFixed(1);
    if (x < 0 || y < 0 || x > 100 || y > 100) return;
    var pg = viewer.list[viewer.index];
    ST.pins.push({ sec: viewer.sec, img: pg.id, x: x, y: y, c: "", t: new Date().toISOString() });
    viewer.sel = ST.pins.length - 1;
    save();
    drawPins();
    var L = byId("v-list");
    var t = L.lastElementChild && L.lastElementChild.querySelector("textarea");
    if (t) t.focus();
  });

  byId("v-prev").onclick = function () {
    if (viewer.index > 0) { viewer.index--; viewer.sel = -1; drawViewer(); }
  };
  byId("v-next").onclick = function () {
    if (viewer.index < viewer.list.length - 1) { viewer.index++; viewer.sel = -1; drawViewer(); }
  };
  byId("v-close").onclick = closeViewer;
  document.addEventListener("keydown", function (e) {
    if (!viewer.open) return;
    if (e.key === "Escape") { closeViewer(); return; }
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "TEXTAREA" || tag === "INPUT") return;
    if (e.key === "ArrowRight") byId("v-prev").click();
    if (e.key === "ArrowLeft") byId("v-next").click();
  });

  function pageLabel(p) {
    var found = pageById(p.img);
    return found ? found.page.label : p.img;
  }

  function summary() {
    var out = [TITLE, ""], any = false;
    SECS.forEach(function (s) {
      var note = (ST.notes[s.id] || "").trim();
      var pins = ST.pins.filter(function (p) { return p.sec === s.id; });
      if (!note && !pins.length) return;
      any = true;
      out.push("== " + s.title + " ==");
      if (note) out.push("הערה כללית: " + note);
      pins.forEach(function (p, i) {
        out.push("#" + (i + 1) + " " + pageLabel(p) + " (" + p.x + "%, " + p.y + "%): " + (p.c || ""));
      });
      out.push("");
    });
    if (!any) out.push("(אין הערות)");
    return out.join("\n");
  }

  function waUrl(text) {
    return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
  }
  function splitText(t, maxEncoded) {
    var lines = t.split("\n");
    var parts = [], cur = "";
    function encodedLen(s) { return encodeURIComponent(s).length; }
    var prefix = TITLE + "\n\n";
    var budget = maxEncoded - encodedLen(prefix) - 40;
    lines.forEach(function (line) {
      var next = cur ? cur + "\n" + line : line;
      if (encodedLen(next) > budget && cur) {
        parts.push(cur);
        cur = line;
      } else cur = next;
    });
    if (cur) parts.push(cur);
    if (parts.length <= 1) return [t];
    return parts.map(function (p, i) {
      return TITLE + " (" + (i + 1) + "/" + parts.length + ")\n\n" + p;
    });
  }

  function setMsg(html, color) {
    var m = byId("doneMsg");
    m.style.color = color || "";
    m.innerHTML = html;
  }

  function doCopy(t) {
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject())
      .then(function () { alert("ההערות הועתקו"); })
      .catch(function () { prompt("העתיקו ידנית:", t); });
  }
  function doExport() {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([summary() + "\n\n" + JSON.stringify(ST, null, 2)], { type: "text/plain;charset=utf-8" }));
    a.download = "gililand-storyboard-notes.txt";
    a.click();
  }

  byId("cp").onclick = function () { doCopy(summary()); };
  byId("exp").onclick = doExport;

  byId("done").onclick = function () {
    var t = summary();
    var m = byId("doneMsg");
    if (t.indexOf("(אין הערות)") >= 0) {
      setMsg("אין עדיין הערות. הוסיפו סיכה או הערה כללית ולחצו שוב.", "#c00");
      return;
    }
    var base = "https://wa.me/" + WA + "?text=";
    var encoded = encodeURIComponent(t);
    var url = base + encoded;
    if (url.length <= MAX_URL) {
      setMsg("פותח וואטסאפ עם כל ההערות…", "#080");
      window.open(url, "_blank");
      return;
    }
    var room = MAX_URL - base.length;
    var parts = splitText(t, room);
    var html = "ההודעה ארוכה מדי לקישור אחד, לכן פוצלה ל־" + parts.length + " חלקים. אפשר גם להעתיק הכל.";
    html += '<div class="tools">';
    parts.forEach(function (p, i) {
      html += '<button type="button" data-part="' + i + '">פתח חלק ' + (i + 1) + "/" + parts.length + "</button>";
    });
    html += '<button type="button" id="copyAll">העתק הכל</button></div>';
    setMsg(html, "#333");
    m.querySelectorAll("[data-part]").forEach(function (btn) {
      btn.onclick = function () {
        var i = +btn.getAttribute("data-part");
        window.open(waUrl(parts[i]), "_blank");
      };
    });
    byId("copyAll").onclick = function () { doCopy(t); };
    window.open(waUrl(parts[0]), "_blank");
  };

  function syncHeaderPad() {
    var hdr = document.querySelector("header");
    if (!hdr) return;
    var h = hdr.offsetHeight + 10;
    document.documentElement.style.setProperty("--hdr", h + "px");
  }
  window.addEventListener("resize", function () { syncHeaderPad(); setActiveNav(); }, { passive: true });
  window.addEventListener("scroll", setActiveNav, { passive: true });

  renderNav();
  renderSecs();
  syncHeaderPad();
  setActiveNav();
  document.querySelectorAll("header img").forEach(function (im) {
    if (im.complete) return;
    im.addEventListener("load", syncHeaderPad, { once: true });
  });
  window.addEventListener("load", syncHeaderPad);
})();
