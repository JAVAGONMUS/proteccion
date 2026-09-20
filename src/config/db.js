const { Pool } = require('pg');
const pgvector = require('pgvector/pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('FATAL: La variable DATABASE_URL no está configurada.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Obliga a cifrar el tráfico SSL hacia TigerData
  },
  max: 20,                   // Máximo número de clientes en el pool para evitar saturación
  idleTimeoutMillis: 30000,  // Cierra conexiones inactivas
  connectionTimeoutMillis: 5000 // Error si la BD no responde en 5 segundos
});

pool.on('connect', async (client) => {
  // Registra el tipo de dato vectorial de pgvector
  await pgvector.registerType(client);
});

pool.on('error', (err) => {
  console.error('Error crítico e inesperado en el Pool de PostgreSQL:', err);
});

module.exports = pool;
