import jwt from 'jsonwebtoken';

/** Verifica el token JWT y deja el usuario en req.usuario */
export function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

/** Restringe el acceso a ciertos roles: permitirRoles('negocio', 'admin') */
export function permitirRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      return res.status(403).json({ mensaje: 'No tiene permisos para esta acción' });
    }
    next();
  };
}
