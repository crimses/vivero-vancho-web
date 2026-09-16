/*
 * main.js — lógica del sitio. Sin build, sin dependencias.
 * Patrón: cada init* es independiente y está envuelta en safe() para que un
 * error en una no rompa las demás.
 */
(function () {
  "use strict";

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }
  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }
  function safe(fn, label) {
    try {
      fn();
    } catch (err) {
      console.error("[" + label + "]", err);
    }
  }

  /* ---------------------------------------------------------------
   * Año del footer
   * --------------------------------------------------------------- */
  function initFooterYear() {
    var el = $("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------
   * Nav mobile (toggle simple, sin librerías)
   * --------------------------------------------------------------- */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var menu = $("[data-nav-menu]");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    $all("a", menu).forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------------
   * Rubros — carrusel "spotlight" (una tarjeta destacada que rota
   * entre los 9 rubros, con una fila de miniaturas para saltar a
   * cualquiera). El contenido de cada rubro vive en atributos data-*
   * de cada .rubros-thumb en el HTML; este script sólo lee y vuelca
   * esos datos en el panel grande — no duplica contenido.
   * --------------------------------------------------------------- */
  function initRubrosCarousel() {
    var root = $("[data-rubros-carousel]");
    if (!root) return;

    var spotlight = $("[data-rubros-spotlight]", root);
    var img = $("[data-spotlight-img]", root);
    var title = $("[data-spotlight-title]", root);
    var text = $("[data-spotlight-text]", root);
    var thumbs = $all("[data-rubros-thumbs] .rubros-thumb", root);
    var prevBtn = $("[data-rubros-prev]", root);
    var nextBtn = $("[data-rubros-next]", root);
    var announce = $("[data-rubros-announce]", root);
    if (!spotlight || !img || !title || !text || !thumbs.length) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var current = thumbs.findIndex(function (t) {
      return t.classList.contains("is-active");
    });
    if (current < 0) current = 0;

    var AUTOPLAY_MS = 4500;
    var FADE_MS = 400;
    var timer = null;

    function render(index) {
      var thumb = thumbs[index];
      if (!thumb) return;

      img.src = thumb.getAttribute("data-img");
      img.alt = thumb.getAttribute("data-alt") || "";
      title.textContent = thumb.getAttribute("data-title") || "";
      text.textContent = thumb.getAttribute("data-text") || "";

      thumbs.forEach(function (t, i) {
        var active = i === index;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });

      if (announce) {
        announce.textContent = "Mostrando: " + (thumb.getAttribute("data-title") || "");
      }
    }

    function setActive(index, opts) {
      var silent = opts && opts.silent;
      index = ((index % thumbs.length) + thumbs.length) % thumbs.length;
      if (index === current && !silent) return;
      current = index;

      if (reduceMotion) {
        render(index);
        return;
      }

      spotlight.classList.add("is-fading");
      setTimeout(function () {
        render(index);
        spotlight.classList.remove("is-fading");
      }, FADE_MS);
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function startAutoplay() {
      if (reduceMotion || timer) return;
      timer = setInterval(function () {
        setActive(current + 1);
      }, AUTOPLAY_MS);
    }

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener("click", function () {
        setActive(i);
      });
    });
    if (prevBtn) {
      prevBtn.addEventListener("click", function () { setActive(current - 1); });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () { setActive(current + 1); });
    }

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { setActive(current - 1); }
      else if (e.key === "ArrowRight") { setActive(current + 1); }
    });

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    root.addEventListener("focusin", stopAutoplay);
    root.addEventListener("focusout", startAutoplay);

    render(current);
    startAutoplay();
  }

  /* ---------------------------------------------------------------
   * Nuestro mundo — galería con "burbuja" en hover/focus (efecto CSS
   * puro, ver .galeria-item:hover en styles.css) y lightbox al clickear
   * o tocar una foto, para verla más grande. El lightbox es un único
   * nodo (#lightbox en index.html) que se reutiliza para las N fotos;
   * guarda el índice actual para poder navegar con las flechas/teclado
   * sin volver a abrir el modal. Al cerrar, devuelve el foco al botón
   * que lo abrió (accesibilidad con teclado).
   * --------------------------------------------------------------- */
  function initGaleriaLightbox() {
    var items = $all(".galeria-item:not(.galeria-item--placeholder)");
    var lightbox = $("[data-lightbox]");
    if (!items.length || !lightbox) return;

    var img = $("[data-lightbox-img]", lightbox);
    var current = 0;
    var lastFocused = null;

    function render() {
      var source = $("img", items[current]);
      if (!source) return;
      img.src = source.currentSrc || source.src;
      img.alt = source.alt;
    }

    function open(index) {
      current = index;
      lastFocused = document.activeElement;
      render();
      lightbox.hidden = false;
      requestAnimationFrame(function () { lightbox.classList.add("is-open"); });
      document.body.classList.add("has-lightbox");
    }

    function close() {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("has-lightbox");
      setTimeout(function () { lightbox.hidden = true; }, 200);
      if (lastFocused) lastFocused.focus();
    }

    function step(delta) {
      current = (current + delta + items.length) % items.length;
      render();
    }

    items.forEach(function (item, index) {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        open(index);
      });
    });

    $(".lightbox-close", lightbox).addEventListener("click", close);
    $(".lightbox-nav--prev", lightbox).addEventListener("click", function () { step(-1); });
    $(".lightbox-nav--next", lightbox).addEventListener("click", function () { step(1); });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------------------------------------------------------------
   * Boot
   * --------------------------------------------------------------- */
  function boot() {
    safe(initFooterYear, "initFooterYear");
    safe(initNav, "initNav");
    safe(initRubrosCarousel, "initRubrosCarousel");
    safe(initGaleriaLightbox, "initGaleriaLightbox");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
