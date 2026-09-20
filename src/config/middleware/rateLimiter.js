const rateLimit = require('express-rate-limit');

// Limite global para evitar abusos en los endpoints de la API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Ventana de 1 minuto
  max: 120, // Máximo 120 peticiones por minuto por IP (suficiente para la afluencia de la app)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP. Intente de nuevo en un minuto.' }
});

module.exports = { apiLimiter };
