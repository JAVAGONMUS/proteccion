//     ../src/config/db.js
const { Pool } = require('pg');
const pgvector = require('pgvector/pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('FATAL: La variable DATABASE_URL no está configurada.');
}

// Configuración robusta de SSL para TigerData en Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Permite conectar a TigerData evitando SELF_SIGNED_CERT_IN_CHAIN
  },
  max: 20,                   // Máximo número de clientes en el pool
  idleTimeoutMillis: 30000,  // Cierra conexiones inactivas
  connectionTimeoutMillis: 10000 // Aumentamos a 10s para dar margen a la BD
});

pool.on('connect', async (client) => {
  try {
    // Registra el tipo de dato vectorial de pgvector
    await pgvector.registerType(client);
  } catch (err) {
    console.error('Error registrando pgvector en el cliente de PG:', err);
  }
});

pool.on('error', (err) => {
  console.error('Error crítico e inesperado en el Pool de PostgreSQL:', err);
});

module.exports = pool;
