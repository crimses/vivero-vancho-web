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
   * Formulario de contacto — arranca simulado.
   * Cuando exista el endpoint de Formspree y el mail de destino real del
   * cliente (ver skill, Fase 4), reemplazar el bloque marcado
   * "TODO backend" por un fetch() real.
   * --------------------------------------------------------------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    var status = $("[data-form-status]", form);
    var btn = $('button[type="submit"]', form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      if (btn) btn.disabled = true;
      if (status) {
        status.textContent = "Enviando…";
        status.classList.remove("is-success");
      }

      // TODO backend: reemplazar este setTimeout por un fetch() real a
      // Formspree (u otro servicio) cuando exista el endpoint y el mail
      // de destino real del cliente.
      setTimeout(function () {
        var emailValue = form.querySelector('[type="email"]');
        if (status) {
          status.textContent = "¡Listo! Te vamos a responder a la brevedad" +
            (emailValue && emailValue.value ? " a " + emailValue.value : "") + ".";
          status.classList.add("is-success");
        }
        if (btn) btn.disabled = false;
        form.reset();
      }, 900);
    });
  }

  /* ---------------------------------------------------------------
   * Boot
   * --------------------------------------------------------------- */
  function boot() {
    safe(initFooterYear, "initFooterYear");
    safe(initNav, "initNav");
    safe(initRubrosCarousel, "initRubrosCarousel");
    safe(initContactForm, "initContactForm");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
