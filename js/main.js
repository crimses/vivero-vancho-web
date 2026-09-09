/* Vivero Vancho — site behavior. Classic script, no build step. */
(function () {
  "use strict";

  var DATA = window.__VIVERO__ || {};

  function safe(fn, label) {
    try {
      fn();
    } catch (err) {
      if (window.console && console.error) {
        console.error("[vivero-vancho] " + (label || "error") + ":", err);
      }
    }
  }

  function escHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildWhatsAppUrl(number, message) {
    var digits = String(number || "").replace(/[^0-9]/g, "");
    var base = digits ? "https://wa.me/" + digits : "https://wa.me/";
    var text = message ? "?text=" + encodeURIComponent(message) : "";
    return base + text;
  }

  /* ----- Header: solid background after scrolling past hero ----- */
  function initHeader() {
    var header = document.getElementById("site-header");
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 40) {
        header.classList.add("is-solid");
      } else {
        header.classList.remove("is-solid");
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----- Mobile nav toggle ----- */
  function initNavToggle() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ----- Scroll reveal with IntersectionObserver + safety net ----- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });

    // Safety net: guarantee visibility even if the observer misbehaves.
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add("is-visible"); });
    }, 6000);
  }

  /* ----- Subtle parallax on scroll for [data-parallax] elements ----- */
  function initParallax() {
    var items = document.querySelectorAll("[data-parallax]");
    if (!items.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var ticking = false;

    function update() {
      ticking = false;
      var viewportH = window.innerHeight;

      items.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax-speed")) || 0.15;
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var offsetFromCenter = center - viewportH / 2;
        var translateY = offsetFromCenter * speed * -1;
        el.style.transform = "translateY(" + translateY.toFixed(1) + "px)";
      });
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  /* ----- Populate contact info from config.js ----- */
  function initContactInfo() {
    var contact = DATA.contact || {};
    var waMessage = "Hola " + (DATA.brand ? DATA.brand.name : "Vivero Vancho") + ", quiero hacer una consulta.";
    var waUrl = buildWhatsAppUrl(contact.whatsappNumber, waMessage);

    ["whatsapp-link", "whatsapp-float-link", "footer-whatsapp"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", waUrl);
    });

    var igLink = document.getElementById("instagram-link");
    if (igLink && contact.instagramUrl) igLink.setAttribute("href", contact.instagramUrl);

    var addressEl = document.getElementById("location-address");
    if (addressEl && contact.address) addressEl.textContent = contact.address;

    var hoursList = document.getElementById("hours-list");
    if (hoursList && Array.isArray(contact.hours)) {
      hoursList.innerHTML = contact.hours
        .map(function (h) {
          return "<li><span>" + escHTML(h.day) + "</span><span>" + escHTML(h.time) + "</span></li>";
        })
        .join("");
    }

    var yearEl = document.getElementById("footer-year");
    if (yearEl) yearEl.textContent = DATA.year || new Date().getFullYear();
  }

  /* ----- Contact form -> WhatsApp deep link ----- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (document.getElementById("cf-name") || {}).value || "";
      var message = (document.getElementById("cf-message") || {}).value || "";
      var contact = DATA.contact || {};

      var text = "Hola, soy " + name + ". " + message;
      var url = buildWhatsAppUrl(contact.whatsappNumber, text);
      window.open(url, "_blank", "noopener");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(initHeader, "initHeader");
    safe(initNavToggle, "initNavToggle");
    safe(initReveal, "initReveal");
    safe(initParallax, "initParallax");
    safe(initContactInfo, "initContactInfo");
    safe(initContactForm, "initContactForm");
  });
})();
