import { validationResult } from 'express-validator';

export function validarCampos(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ mensaje: 'Datos inválidos', errores: errores.array() });
  }
  next();
}
