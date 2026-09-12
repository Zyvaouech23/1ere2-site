/* ============================================================
   Scripts communs — Classe de 1ère 2
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Hero : l'image du lycée s'efface vers le haut au scroll ---------- */
  var heroMedia = document.querySelector(".hero-media");
  var hero = document.querySelector(".hero");
  var header = document.querySelector(".site-header");
  var cue = document.querySelector(".scroll-cue");
  var heroInner = document.querySelector(".hero-inner");
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    if (hero && heroMedia && !reduceMotion) {
      var h = hero.offsetHeight || window.innerHeight;
      var p = Math.min(y / h, 1);                 // 0 en haut → 1 en bas du hero
      var eased = p * p * (3 - 2 * p);            // lissage smoothstep
      heroMedia.style.transform = "translate3d(0, " + (-eased * 28) + "%, 0) scale(" + (1 + eased * 0.06) + ")";
      heroMedia.style.opacity = String(Math.max(0, 1 - eased * 1.15));
      if (heroInner) {
        heroInner.style.opacity = String(Math.max(0, 1 - eased * 1.45));
        heroInner.style.transform = "translate3d(0, " + (-eased * 40) + "px, 0)";
      }
      if (cue) cue.style.opacity = String(Math.max(0, 1 - p * 3));
    }

    if (header && header.classList.contains("site-header--over-capable")) {
      var limit = (hero ? hero.offsetHeight : window.innerHeight) * 0.3;
      header.classList.toggle("site-header--over", y < limit);
    }

    ticking = false;
  }

  function requestTick() {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }

  if (hero) {
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    onScroll();
  }

  /* ---------- Apparition progressive des blocs ---------- */
  var revealables = document.querySelectorAll(".reveal");
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
      revealables.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i % 4, 3) * 80 + "ms";
        io.observe(el);
      });
    }
  }

  /* ---------- Année dans le pied de page ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    var now = new Date();
    var start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    yearEl.textContent = start + "–" + (start + 1);
  }
})();
