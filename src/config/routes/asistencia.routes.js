const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const router = express.Router();

// -------------------------------------------------------------
// 1. IDENTIFICACIÓN FACIAL MEDIANTE VECTOR (512 FLOATS)
// -------------------------------------------------------------
router.post(
  '/identificar',
  [
    body('embedding')
      .isArray({ min: 512, max: 512 })
      .withMessage('El vector embedding debe ser un array exacto de 512 valores numéricos.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'ERROR_VALIDACION', errors: errors.array() });
    }

    try {
      const { embedding } = req.body;
      const vectorString = JSON.stringify(embedding);

      // Distancia Coseno (<=>). Umbral seguro: < 0.38
      const query = `
        SELECT id, codigo_empleado, nombre, apellido, 
               (face_embedding <=> $1) AS distancia
        FROM usuarios
        WHERE (face_embedding <=> $1) < 0.38
        ORDER BY distancia ASC
        LIMIT 1;
      `;

      const result = await pool.query(query, [vectorString]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Rostro no reconocido o sin nivel de coincidencia seguro.' });
      }

      const usuario = result.rows[0];
      const areas = await pool.query('SELECT id, nombre FROM areas_trabajo ORDER BY nombre ASC');

      return res.json({
        empleado: {
          id: usuario.id,
          codigo: usuario.codigo_empleado,
          nombre: `${usuario.nombre} ${usuario.apellido}`
        },
        areas: areas.rows
      });
    } catch (err) {
      console.error('Error procesando el vector de rostros:', err);
      return res.status(500).json({ error: 'Error procesando la identificación' });
    }
  }
);

// -------------------------------------------------------------
// 2. MARCAR ASISTENCIA Y ASIGNAR PUESTO
// -------------------------------------------------------------
router.post(
  '/marcar',
  [
    body('usuario_id').isInt().withMessage('El id de usuario debe ser entero.'),
    body('area_id').isInt().withMessage('El id de área debe ser entero.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'ERROR_VALIDACION', errors: errors.array() });
    }

    try {
      const { usuario_id, area_id } = req.body;

      const query = `
        INSERT INTO asistencias (usuario_id, area_id, fecha, hora_entrada, estado)
        VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, 'PRESENTE')
        ON CONFLICT (usuario_id, fecha) 
        DO UPDATE SET area_id = EXCLUDED.area_id, hora_entrada = EXCLUDED.hora_entrada, estado = 'PRESENTE'
        RETURNING id, usuario_id, area_id, fecha, hora_entrada, estado;
      `;

      const result = await pool.query(query, [usuario_id, area_id]);
      return res.json({ status: 'OK', registro: result.rows[0] });
    } catch (err) {
      console.error('Error registrando asistencia:', err);
      return res.status(500).json({ error: 'Error al registrar la asistencia en la base de datos' });
    }
  }
);

module.exports = router;
