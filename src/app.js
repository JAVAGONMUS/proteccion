// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cron = require('node-cron');
const pool = require('./config/db');
const verifyApiKey = require('./config/middleware/auth');
const { apiLimiter } = require('./config/middleware/rateLimiter');

// Importar rutas
const asistenciaRoutes = require('./config/routes/asistencia.routes');
const usuariosRoutes = require('./config/routes/usuarios.routes');

const app = express();

// 1. Blindaje de Cabeceras con Helmet
app.use(helmet());

// 2. Protección de Dominios Cruzados (CORS)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// 3. Parser de JSON con restricción de tamaño
app.use(express.json({ limit: '1mb' }));

// 4. Aplicación global de Rate Limiting
app.use('/api/', apiLimiter);

// 5. Aplicación del Middleware de Autenticación por API Key
app.use(verifyApiKey);

// 6. Registro de Rutas
app.use('/asistencia', asistenciaRoutes);
app.use('/usuarios', usuariosRoutes);

// -------------------------------------------------------------
// AUTOMATIZACIÓN (CRON JOB): Registro diario de Inasistencias
// -------------------------------------------------------------
cron.schedule('59 23 * * *', async () => {
  console.log('[CRON] Ejecutando marca automática de empleados ausentes...');
  try {
    const query = `
      INSERT INTO "ASISTENCIAS" (usuario_id, area_id, fecha, estado)
      SELECT u.id, NULL, CURRENT_DATE, 'AUSENTE'
      FROM "USUARIOS" u
      WHERE u.id NOT IN (
        SELECT usuario_id FROM "ASISTENCIAS" WHERE fecha = CURRENT_DATE
      );
    `;
    const result = await pool.query(query);
    console.log(`[CRON] Exitoso: ${result.rowCount} marcas de ausencia creadas.`);
  } catch (err) {
    console.error('[CRON Error]: Fallo al marcar las inasistencias:', err);
  }
});

module.exports = app;
