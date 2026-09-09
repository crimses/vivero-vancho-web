/* Vivero Vancho — brand & content configuration. Edit this file to update
   contact details, hours, and links without touching markup or logic. */
(function () {
  "use strict";

  window.__VIVERO__ = {
    brand: {
      name: "Vivero Vancho",
      tagline: "Naturaleza premium para tu hogar",
    },
    contact: {
      whatsappNumber: "[COMPLETAR]", // formato internacional sin '+' ni espacios, ej: 5491122334455
      address: "[COMPLETAR]",
      addressMapQuery: "[COMPLETAR]", // texto de dirección para el iframe de Google Maps
      email: "[COMPLETAR]",
      instagramHandle: "viverovancho",
      instagramUrl: "https://instagram.com/viverovancho",
      hours: [
        { day: "Lunes a Viernes", time: "9:00 – 18:00" },
        { day: "Sábados", time: "9:00 – 13:00" },
        { day: "Domingos", time: "Cerrado" },
      ],
    },
    catalogPdf: "assets/catalogo.pdf",
    year: new Date().getFullYear(),
  };
})();
