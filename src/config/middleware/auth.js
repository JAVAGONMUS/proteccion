module.exports = function verifyApiKey(req, res, next) {
  const apiKeyHeader = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY_APP;

  if (!apiKeyHeader || apiKeyHeader !== validApiKey) {
    return res.status(401).json({ 
      error: 'Acceso no autorizado: Identificador de aplicación inválido o ausente.' 
    });
  }

  next();
};