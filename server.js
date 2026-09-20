const app = require('./src/app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor de Asistencia en producción iniciado en el puerto ${PORT}`);
});