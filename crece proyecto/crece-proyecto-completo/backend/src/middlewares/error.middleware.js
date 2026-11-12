export function noEncontrado(_req, res) {
  res.status(404).json({ mensaje: 'Recurso no encontrado' });
}

export function manejadorErrores(error, _req, res, _next) {
  console.error(error);
  const codigo = error.status || 500;
  res.status(codigo).json({
    mensaje: error.message || 'Error interno del servidor'
  });
}
