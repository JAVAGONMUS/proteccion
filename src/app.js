const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cron = require('node-cron');
const pool = require('./config/db');
const verifyApiKey = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiter');
const asistenciaRoutes = require('./routes/asistencia.routes');

const app = express();

// 1. Blindaje de Cabeceras con Helmet
app.use(helmet());

// 2. Protección de Dominios Cruzados (CORS)
app.use(cors({
  origin: '*', // Se ajusta al dominio del dashboard web o se deja abierto si es consumido solo desde Apps nativas
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// 3. Parser de JSON con restricción de tamaño para evitar desbordamiento de memoria
app.use(express.json({ limit: '1mb' }));

// 4. Aplicación global de Rate Limiting
app.use('/api/', apiLimiter);

// 5. Aplicación del Middleware de Autenticación por API Key
app.use('/api/', verifyApiKey);

// 6. Registro de Rutas
app.use('/api/asistencia', asistenciaRoutes);

// -------------------------------------------------------------
// AUTOMATIZACIÓN (CRON JOB): Registro diario de Inasistencias
// Corre automáticamente a las 23:59 todos los días
// -------------------------------------------------------------
cron.schedule('59 23 * * *', async () => {
  console.log('[CRON] Ejecutando marca automática de empleados ausentes...');
  try {
    const query = `
      INSERT INTO asistencias (usuario_id, area_id, fecha, estado)
      SELECT u.id, NULL, CURRENT_DATE, 'AUSENTE'
      FROM usuarios u
      WHERE u.id NOT IN (
        SELECT usuario_id FROM asistencias WHERE fecha = CURRENT_DATE
      );
    `;
    const result = await pool.query(query);
    console.log(`[CRON] Exitoso: ${result.rowCount} marcas de ausencia creadas para el día de hoy.`);
  } catch (err) {
    console.error('[CRON Error]: Fallo al marcar las inasistencias:', err);
  }
});

module.exports = app;
