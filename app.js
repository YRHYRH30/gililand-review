(function () {
  var KEY = "gililand-review-v1-pins";
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
  function pageById(pid) {
    for (var s = 0; s < SECS.length; s++) {
      var pages = SECS[s].pages;
      for (var i = 0; i < pages.length; i++) if (pages[i].id === pid) return { sec: SECS[s], page: pages[i], index: i };
    }
  }
  function pinCount(secId, pageId) {
    var n = 0;
    ST.pins.forEach(function (p) {
      if (p.sec === secId && (!pageId || p.img === pageId)) n++;
    });
    return n;
  }

  var currentSec = SECS[0].id;
  var viewer = { open: false, sec: null, index: 0, sel: -1 };

  function renderNav() {
    var nav = byId("nav");
    nav.innerHTML = "";
    SECS.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "nav-item" + (s.id === currentSec ? " active" : "");
      b.setAttribute("data-sec", s.id);
      b.innerHTML = '<img src="' + s.navImg + '" alt="' + esc(s.nav) + '"><span>' + esc(s.nav) + "</span>";
      b.onclick = function () { showSec(s.id); };
      nav.appendChild(b);
    });
  }

  function renderSecs() {
    var host = byId("secs");
    host.innerHTML = "";
    SECS.forEach(function (s) {
      var el = document.createElement("section");
      el.className = "sec" + (s.id === currentSec ? " on" : "");
      el.id = "sec-" + s.id;
      var h = "<h2>" + esc(s.title) + "</h2>";
      if (s.details) {
        h += "<details><summary>פרטים</summary><p>" + esc(s.details) + "</p></details>";
      }
      h += '<div class="pages" id="pg-' + s.id + '"></div>';
      h += '<div class="note-box"><label for="tx-' + s.id + '">הערה כללית לחלק הזה</label>';
      h += '<textarea id="tx-' + s.id + '" placeholder="הערה כללית…"></textarea></div>';
      el.innerHTML = h;
      host.appendChild(el);
      var ta = byId("tx-" + s.id);
      ta.value = ST.notes[s.id] || "";
      ta.oninput = function () { ST.notes[s.id] = ta.value; save(); };
      renderThumbs(s);
    });
  }

  function renderThumbs(s) {
    var box = byId("pg-" + s.id);
    if (!box) return;
    box.innerHTML = "";
    s.pages.forEach(function (pg, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "page-th" + (s.tall ? " tall" : "");
      b.setAttribute("data-page", pg.id);
      var n = pinCount(s.id, pg.id);
      b.innerHTML =
        '<img src="' + pg.thumb + '" alt="' + esc(pg.label) + '" loading="' + (i < 18 ? "eager" : "lazy") + '" width="280" height="280">' +
        (n ? '<span class="dot">' + n + "</span>" : "") +
        '<span class="cap">' + esc(pg.label) + "</span>";
      b.onclick = function () { openViewer(s.id, i); };
      box.appendChild(b);
    });
  }

  function showSec(id) {
    currentSec = id;
    document.querySelectorAll(".sec").forEach(function (el) {
      el.classList.toggle("on", el.id === "sec-" + id);
    });
    document.querySelectorAll(".nav-item").forEach(function (el) {
      el.classList.toggle("active", el.getAttribute("data-sec") === id);
    });
    if (location.hash !== "#" + id) {
      try { history.replaceState(null, "", "#" + id); } catch (e) { location.hash = id; }
    }
    window.scrollTo(0, 0);
  }

  function openViewer(secId, index) {
    var s = secById(secId);
    if (!s) return;
    viewer.open = true;
    viewer.sec = secId;
    viewer.index = index;
    viewer.sel = -1;
    byId("viewer").className = "on";
    document.body.style.overflow = "hidden";
    drawViewer();
  }
  function closeViewer() {
    viewer.open = false;
    byId("viewer").className = "";
    document.body.style.overflow = "";
    var s = secById(viewer.sec);
    if (s) renderThumbs(s);
  }
  function drawViewer() {
    var s = secById(viewer.sec);
    var pg = s.pages[viewer.index];
    byId("v-title").textContent = s.title + " · " + pg.label;
    var img = byId("v-img");
    img.alt = pg.label;
    if (img.getAttribute("src") !== pg.src) img.src = pg.src;
    drawPins();
  }
  function drawPins() {
    var s = secById(viewer.sec);
    var pg = s.pages[viewer.index];
    var stg = byId("v-stage");
    stg.querySelectorAll(".pin").forEach(function (e) { e.remove(); });
    var L = byId("v-list");
    L.innerHTML = "";
    var n = 0;
    ST.pins.forEach(function (p, idx) {
      if (p.sec !== viewer.sec || p.img !== pg.id) return;
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
          renderThumbs(s);
        }
      };
      L.appendChild(d);
    });
    if (!n) L.innerHTML = '<p class="hint">לחצו על התמונה כדי לנעוץ סיכה.</p>';
  }

  byId("v-stage").addEventListener("click", function (e) {
    if (!viewer.open) return;
    if (e.target.classList.contains("pin")) return;
    var im = byId("v-img");
    var r = im.getBoundingClientRect();
    var x = +((e.clientX - r.left) / r.width * 100).toFixed(1);
    var y = +((e.clientY - r.top) / r.height * 100).toFixed(1);
    if (x < 0 || y < 0 || x > 100 || y > 100) return;
    var s = secById(viewer.sec);
    var pg = s.pages[viewer.index];
    ST.pins.push({ sec: viewer.sec, img: pg.id, x: x, y: y, c: "", t: new Date().toISOString() });
    viewer.sel = ST.pins.length - 1;
    save();
    drawPins();
    var L = byId("v-list");
    var t = L.lastElementChild && L.lastElementChild.querySelector("textarea");
    if (t) t.focus();
  });

  byId("v-prev").onclick = function () {
    var s = secById(viewer.sec);
    if (viewer.index > 0) { viewer.index--; viewer.sel = -1; drawViewer(); }
  };
  byId("v-next").onclick = function () {
    var s = secById(viewer.sec);
    if (viewer.index < s.pages.length - 1) { viewer.index++; viewer.sel = -1; drawViewer(); }
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
    a.download = "gililand-review-notes.txt";
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

  window.gililandSummary = summary;
  window.gililandWaUrl = waUrl;
  window.gililandSplit = function (t) { return splitText(t, MAX_URL - ("https://wa.me/" + WA + "?text=").length); };

  renderNav();
  renderSecs();
  var hash = (location.hash || "").replace(/^#/, "");
  if (hash && secById(hash)) showSec(hash);
  else showSec(SECS[0].id);
})();
