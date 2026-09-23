// src/config/routes/usuarios.routes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../../config/db');
const router = express.Router();

// -------------------------------------------------------------
// REGISTRAR NUEVO EMPLEADO CON VECTOR EMBEDDING
// -------------------------------------------------------------
router.post(
  '/registrar',
  [
    body('codigo_empleado').notEmpty().withMessage('El código de empleado es requerido.'),
    body('nombre').notEmpty().withMessage('El nombre es requerido.'),
    body('apellido').notEmpty().withMessage('El apellido es requerido.'),
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
      const { codigo_empleado, nombre, apellido, embedding } = req.body;
      const vectorString = JSON.stringify(embedding);

      const query = `
        INSERT INTO "USUARIOS" (codigo_empleado, nombre, apellido, face_embedding, creado_en)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, codigo_empleado, nombre, apellido;
      `;

      const result = await pool.query(query, [
        codigo_empleado,
        nombre,
        apellido,
        vectorString
      ]);

      return res.status(201).json({
        ok: true,
        mensaje: 'Empleado registrado exitosamente',
        usuario: result.rows[0]
      });
    } catch (err) {
      console.error('Error registrando nuevo usuario:', err);
      if (err.code === '23505') { // Violación de restricción UNIQUE (ej. código duplicado)
        return res.status(400).json({ error: 'El código de empleado ya se encuentra registrado.' });
      }
      return res.status(500).json({ error: 'Error al registrar el empleado en la base de datos' });
    }
  }
);

module.exports = router;