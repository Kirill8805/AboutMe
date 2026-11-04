/* ============================================================
   ЛОГИКА САЙТА: рендер карточек, фильтры, форма, анимации
   ============================================================ */
(function () {
  "use strict";
  var D = window.PORTFOLIO_DATA || { projects: [], sites: [], contacts: {} };

  /* ---------- Иконки (inline SVG) ---------- */
  var ICON = {
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>',
    arrowR: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    ext: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    img: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.6"/><path d="m21 15-4.5-4.5L5 21"/></svg>',
    screen: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    check: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
  };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function el(id) { return document.getElementById(id); }

  /* ---------- Обложка (картинка или плейсхолдер) ---------- */
  function coverHTML(src, accent, kind) {
    var bar = accent ? '<span class="card-accent" style="background:' + esc(accent) + '"></span>' : "";
    if (src) return bar + '<img src="' + esc(src) + '" alt="" loading="lazy">';
    var icon = kind === "site" ? ICON.screen : ICON.img;
    var label = kind === "site" ? "Превью сайта" : "Обложка проекта";
    return bar + '<div class="ph">' + icon + '<span>' + label + "</span></div>";
  }

  /* ---------- Карточка проекта ---------- */
  function projectCard(p) {
    return '' +
      '<article class="card card-click reveal" data-category="' + esc(p.category) + '" onclick="location.href=\'project.html?id=' + esc(p.id) + '\'">' +
        '<div class="card-cover">' + coverHTML(p.cover, p.accent) + '</div>' +
        '<div class="card-body">' +
          '<div class="card-badges">' +
            '<span class="chip">' + esc(p.category) + '</span>' +
            '<span class="chip chip-status" data-s="' + esc(p.status) + '">' + esc(p.status) + '</span>' +
          '</div>' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<div class="tagline">' + esc(p.tagline) + '</div>' +
          '<p class="desc">' + esc(p.description) + '</p>' +
          '<div class="card-foot"><a class="card-link" href="project.html?id=' + esc(p.id) + '">Подробнее ' + ICON.arrow + '</a></div>' +
        '</div>' +
      '</article>';
  }

  /* ---------- Карточка демо-сайта ---------- */
  function siteCard(s) {
    var demo = s.demoUrl
      ? '<a class="btn btn-accent btn-sm" href="' + esc(s.demoUrl) + '" target="_blank" rel="noopener">Открыть демо ' + ICON.ext + '</a>'
      : '<a class="btn btn-accent btn-sm" href="#" onclick="return false" title="Ссылка на демо будет добавлена">Открыть демо ' + ICON.ext + '</a>';
    return '' +
      '<article class="card site-card reveal" data-category="' + esc(s.category) + '">' +
        '<div class="card-cover">' + coverHTML(s.preview, s.accent, "site") + '</div>' +
        '<div class="card-body">' +
          '<h3>' + esc(s.title) + '</h3>' +
          '<div class="tagline">' + esc(s.category) + '</div>' +
          '<div class="card-foot">' +
            '<div class="site-actions">' + demo + '</div>' +
            '<a class="order-link" href="index.html?example=' + esc(s.id) + '#contact">Заказать похожий →</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ---------- Рендер списков ---------- */
  function renderInto(id, html) { var n = el(id); if (n) n.innerHTML = html; }

  /* ---------- Универсальный слайдер ---------- */
  function buildSlider(trackId, items, renderCard) {
    var track = el(trackId);
    if (!track) return;
    var slider = track.closest(".slider");
    var viewport = track.parentElement;
    var dotsWrap = slider ? slider.querySelector(".slider-dots") : null;
    var prevBtn = slider ? slider.querySelector(".slider-btn.prev") : null;
    var nextBtn = slider ? slider.querySelector(".slider-btn.next") : null;
    if (!items || !items.length) return;
    var n = items.length;
    var pos = 0, step = 0, visible = 2, animating = false, timer = null;

    function gap() { return parseFloat(getComputedStyle(track).gap) || 24; }
    function calcVisible() {
      var slide = track.querySelector(".card"); if (!slide) return 2;
      var w = slide.getBoundingClientRect().width;
      return Math.max(1, Math.round((viewport.clientWidth + gap()) / (w + gap())));
    }
    function measure() {
      var slide = track.querySelector(".card");
      step = slide.getBoundingClientRect().width + gap();
    }
    function setX(px, animated) {
      track.style.transition = animated ? "" : "none";
      track.style.transform = "translateX(" + px + "px)";
      if (!animated) { void track.offsetWidth; track.style.transition = ""; }
    }
    function build() {
      track.style.transition = "none";
      track.innerHTML = items.map(renderCard).join("");
      visible = calcVisible();
      // клоны первых карточек для бесшовной прокрутки
      Array.prototype.slice.call(track.children, 0, visible).forEach(function (s) {
        track.appendChild(s.cloneNode(true));
      });
      // в слайдере показываем карточки сразу (без reveal-задержки)
      Array.prototype.forEach.call(track.querySelectorAll(".reveal"), function (c) { c.classList.add("in"); });
      measure();
      pos = 0; setX(0, false);
      buildDots(); updateDots();
    }
    function buildDots() {
      if (!dotsWrap) return;
      var h = "";
      for (var i = 0; i < n; i++) h += '<button type="button" data-i="' + i + '" aria-label="Слайд ' + (i + 1) + '"></button>';
      dotsWrap.innerHTML = h;
    }
    function updateDots() {
      if (!dotsWrap) return;
      var active = ((pos % n) + n) % n;
      Array.prototype.forEach.call(dotsWrap.children, function (d, i) { d.classList.toggle("active", i === active); });
    }
    function afterAnim(cb) {
      var done = false;
      function h() { if (done) return; done = true; track.removeEventListener("transitionend", h); cb(); }
      track.addEventListener("transitionend", h);
      setTimeout(h, 720);
    }
    function next() {
      if (animating) return; animating = true;
      pos++; setX(-pos * step, true); updateDots();
      afterAnim(function () {
        if (pos >= n) { pos = 0; setX(0, false); }
        animating = false;
      });
    }
    function prev() {
      if (animating) return; animating = true;
      if (pos <= 0) { pos = n; setX(-pos * step, false); }
      pos--; setX(-pos * step, true); updateDots();
      afterAnim(function () { animating = false; });
    }
    function goTo(i) {
      if (animating) return; animating = true;
      pos = i; setX(-pos * step, true); updateDots();
      afterAnim(function () { animating = false; });
    }
    function start() { stop(); timer = setInterval(next, 5000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); start(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); start(); });
    if (dotsWrap) dotsWrap.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; goTo(parseInt(b.getAttribute("data-i"), 10)); start();
    });
    viewport.addEventListener("mouseenter", stop);
    viewport.addEventListener("mouseleave", start);
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var v = calcVisible();
        if (v !== visible) { build(); }
        else { measure(); pos = ((pos % n) + n) % n; setX(-pos * step, false); }
      }, 160);
    });

    build();
    start();
  }

  /* ---------- Инициализация слайдеров ---------- */
  function initFeatured() {
    buildSlider("featured-track", D.projects, projectCard);
    buildSlider("sites-track", D.sites, siteCard);
  }

  /* ---------- Плавающая кнопка прокрутки (вниз / наверх) ---------- */
  function initScrollNav() {
    if (document.querySelector(".scroll-nav")) return;
    var down = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="4" x2="12" y2="19"/><polyline points="6 13 12 19 18 13"/></svg>';
    var up = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="5"/><polyline points="6 11 12 5 18 11"/></svg>';
    var btn = document.createElement("button");
    btn.className = "scroll-nav"; btn.type = "button"; btn.setAttribute("aria-label", "Прокрутка");
    btn.innerHTML = down;
    document.body.appendChild(btn);

    function atBottom() { return (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 8); }
    function refresh() { btn.innerHTML = atBottom() ? up : down; }
    var HEADER = 64;
    btn.addEventListener("click", function () {
      if (atBottom()) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      var targets = Array.prototype.slice.call(document.querySelectorAll("section, footer"));
      var cur = window.scrollY + HEADER + 2;
      var targetTop = null;
      for (var i = 0; i < targets.length; i++) {
        var top = Math.round(targets[i].getBoundingClientRect().top + window.scrollY);
        if (top > cur + 4) { targetTop = top; break; }
      }
      if (targetTop === null) { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }); return; }
      window.scrollTo({ top: Math.max(0, targetTop - HEADER), behavior: "smooth" });
    });
    window.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("resize", refresh);
    refresh();
  }
  function initFeaturedSites() {
    renderInto("featured-sites", D.sites.slice(0, 2).map(siteCard).join(""));
  }
  function initAllSites() {
    renderInto("sites-grid", D.sites.map(siteCard).join(""));
  }

  /* ---------- Страница «Все проекты» + фильтры ---------- */
  function initProjects() {
    var grid = el("projects-grid");
    if (!grid) return;
    grid.innerHTML = D.projects.map(projectCard).join("");
    observeReveal();

    var cats = ["Все"];
    D.projects.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });
    var fWrap = el("filters");
    if (fWrap) {
      fWrap.innerHTML = cats.map(function (c, i) {
        return '<button class="filter-btn' + (i === 0 ? " is-active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
      }).join("");
      fWrap.addEventListener("click", function (e) {
        var b = e.target.closest(".filter-btn"); if (!b) return;
        fWrap.querySelectorAll(".filter-btn").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        var cat = b.getAttribute("data-cat");
        grid.querySelectorAll(".card").forEach(function (card) {
          var show = cat === "Все" || card.getAttribute("data-category") === cat;
          card.style.display = show ? "" : "none";
        });
      });
    }
  }

  /* ---------- Детальная страница проекта ---------- */
  function initProjectDetail() {
    var root = el("project-detail");
    if (!root) return;
    var params = new URLSearchParams(location.search);
    var id = params.get("id");
    var p = D.projects.filter(function (x) { return x.id === id; })[0] || D.projects[0];
    if (!p) { root.innerHTML = '<div class="container"><p>Проект не найден.</p></div>'; return; }

    document.title = p.title + " — Портфолио";

    var gallery = (p.gallery && p.gallery.length)
      ? p.gallery.map(function (g) { return '<div class="shot" data-src="' + esc(g) + '"><img src="' + esc(g) + '" alt="" loading="lazy"></div>'; }).join("")
      : [0, 1].map(function () { return '<div class="shot ph-shot">' + ICON.img + '</div>'; }).join("");

    var others = D.projects.filter(function (x) { return x.id !== p.id; }).slice(0, 3);
    var back = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';

    root.innerHTML = '' +
      '<section class="project-hero"><div class="container">' +
        '<div class="crumbs"><a href="projects.html" class="crumb-back">' + back + ' Проекты</a> <span class="crumb-sep">/</span> ' + esc(p.title) + '</div>' +
        '<div class="project-head">' +
          '<div><h1>' + esc(p.title) + '</h1><p class="project-tagline">' + esc(p.tagline) + '</p></div>' +
          '<div class="project-badges">' +
            '<span class="chip">' + esc(p.category) + '</span>' +
            '<span class="chip chip-status" data-s="' + esc(p.status) + '">' + esc(p.status) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="project-cover">' + (p.cover ? '<img src="' + esc(p.cover) + '" alt="">' : '<div class="ph">Презентационная обложка</div>') + '</div>' +
      '</div></section>' +

      '<section class="project-content"><div class="container">' +
        '<div class="project-grid">' +
          '<div class="prose">' +
            '<h3>О проекте</h3><p>' + esc(p.description) + '</p>' +
            '<div class="project-cols">' +
              '<div><h3>Какие задачи решает</h3><ul class="task-list">' + (p.tasks || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul></div>' +
              '<div><h3>Возможности и модули</h3><ul class="feature-list">' + (p.features || []).map(function (f) { return "<li>" + ICON.check + "<span>" + esc(f) + "</span></li>"; }).join("") + '</ul></div>' +
            '</div>' +
            '<h3>Галерея интерфейсов</h3>' +
            '<div class="gallery">' + gallery + '</div>' +
          '</div>' +
          '<aside>' +
            '<div class="side-card">' +
              '<div><h4>Статус</h4><div style="margin-top:8px"><span class="chip chip-status" data-s="' + esc(p.status) + '">' + esc(p.status) + '</span></div></div>' +
              '<div><h4>Технологии</h4><div class="tech-mini" style="margin-top:10px">' + (p.technologies || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + '</div></div>' +
              (p.demoUrl ? '<a class="btn btn-accent btn-full" href="' + esc(p.demoUrl) + '" target="_blank" rel="noopener">Открыть демо ' + ICON.ext + '</a>' : '') +
              '<a class="btn btn-primary btn-full" href="index.html?project=' + esc(p.id) + '#contact">Обсудить похожий проект</a>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div></section>' +

      '<section class="next-projects"><div class="container">' +
        '<div class="section-head"><div><div class="section-label">Ещё проекты</div><h2>Другие работы</h2></div>' +
        '<a class="link-more" href="projects.html">Все проекты ' + ICON.arrowR + '</a></div>' +
        '<div class="grid-2">' + others.map(projectCard).join("") + '</div>' +
      '</div></section>';

    initLightbox();
    observeReveal();
  }

  /* ---------- Лайтбокс для галереи ---------- */
  function initLightbox() {
    var lb = document.querySelector(".lightbox");
    if (!lb) {
      lb = document.createElement("div");
      lb.className = "lightbox";
      lb.innerHTML = '<button class="lb-close" type="button" aria-label="Закрыть">&times;</button><img alt="">';
      document.body.appendChild(lb);
      lb.addEventListener("click", function (e) {
        if (e.target === lb || e.target.closest(".lb-close")) lb.classList.remove("open");
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.classList.remove("open"); });
    }
    var imgEl = lb.querySelector("img");
    document.querySelectorAll(".gallery .shot[data-src]").forEach(function (s) {
      s.addEventListener("click", function () { imgEl.src = s.getAttribute("data-src"); lb.classList.add("open"); });
    });
  }

  /* ---------- Контакты: ссылки + префилл примера ---------- */
  function initContacts() {
    var c = D.contacts || {};
    document.querySelectorAll("[data-wa]").forEach(function (a) { if (c.whatsapp) a.href = c.whatsapp; });
    document.querySelectorAll("[data-tg]").forEach(function (a) { if (c.telegram) a.href = c.telegram; });
    document.querySelectorAll("[data-email]").forEach(function (a) { if (c.email) { a.href = c.email; if (c.emailText) a.textContent = "Email"; } });

    // префилл сообщения, если пришли с «Заказать похожий» / «Обсудить похожий»
    var params = new URLSearchParams(location.search);
    var msg = el("f-message");
    if (msg) {
      var ex = params.get("example"), pr = params.get("project");
      if (ex) {
        var s = (D.sites.filter(function (x) { return x.id === ex; })[0] || {}).title;
        if (s) msg.value = "Здравствуйте! Интересует сайт по примеру: «" + s + "». ";
      } else if (pr) {
        var pp = (D.projects.filter(function (x) { return x.id === pr; })[0] || {}).title;
        if (pp) msg.value = "Здравствуйте! Хочу обсудить проект, похожий на «" + pp + "». ";
      }
    }
  }

  /* ---------- Валидация формы ---------- */
  function initForm() {
    var form = el("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = el("f-name"), contact = el("f-contact"), ok = el("form-ok");
      var valid = true;
      [name, contact].forEach(function (f) {
        f.classList.remove("field-error");
        if (!f.value.trim()) { f.classList.add("field-error"); valid = false; }
      });
      // honeypot (анти-спам)
      var hp = el("f-website");
      if (hp && hp.value) return;
      if (!valid) return;

      // Формируем сообщение-шаблон и открываем WhatsApp
      var message = el("f-message");
      var WHATSAPP_NUMBER = "77474711659";
      var text = "Здравствуйте! Заявка с сайта-портфолио.\n"
        + "Имя: " + name.value.trim() + "\n"
        + "Контакт: " + contact.value.trim()
        + (message && message.value.trim() ? "\nО проекте: " + message.value.trim() : "");
      window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text), "_blank");

      if (ok) { ok.classList.add("show"); }
      form.reset();
      setTimeout(function () { if (ok) ok.classList.remove("show"); }, 6000);
    });
  }

  /* ---------- Анимация появления ---------- */
  var io;
  function observeReveal() {
    var items = document.querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) { items.forEach(function (n) { n.classList.add("in"); }); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    }
    items.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Мобильное меню ---------- */
  function initNav() {
    var t = el("nav-toggle"), links = el("nav-links");
    if (t && links) t.addEventListener("click", function () { links.classList.toggle("open"); });
  }

  /* ---------- Год в футере ---------- */
  function initYear() { var y = el("year"); if (y) y.textContent = new Date().getFullYear(); }

  /* ---------- Старт ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initYear();
    initScrollNav();
    initFeatured();
    initAllSites();
    initProjects();
    initProjectDetail();
    initContacts();
    initForm();
    observeReveal();
  });
})();
