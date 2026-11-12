import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

export async function registrar(req, res, next) {
  try {
    const { nombre_completo, email, password, telefono, rol = 'cliente' } = req.body;
    const rolNuevo = rol === 'negocio' ? 'negocio' : 'cliente';

    const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe.length) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [resultado] = await pool.query(
      `INSERT INTO usuarios (nombre_completo, email, password_hash, telefono, rol)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre_completo, email, password_hash, telefono || null, rolNuevo]
    );

    const usuario = { id: resultado.insertId, nombre_completo, email, telefono, rol: rolNuevo };
    res.status(201).json({ usuario, token: generarToken(usuario) });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const [filas] = await pool.query(
      'SELECT id, nombre_completo, email, password_hash, telefono, rol, estado FROM usuarios WHERE email = ?',
      [email]
    );

    if (!filas.length) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const usuario = filas[0];
    if (usuario.estado !== 'activo') {
      return res.status(403).json({ mensaje: 'La cuenta no se encuentra activa' });
    }

    const valida = await bcrypt.compare(password, usuario.password_hash);
    if (!valida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    delete usuario.password_hash;
    res.json({ usuario, token: generarToken(usuario) });
  } catch (error) {
    next(error);
  }
}

export async function perfil(req, res, next) {
  try {
    const [filas] = await pool.query(
      `SELECT id, nombre_completo, email, telefono, rol, estado, fecha_registro
       FROM usuarios WHERE id = ?`,
      [req.usuario.id]
    );
    if (!filas.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(filas[0]);
  } catch (error) {
    next(error);
  }
}

export async function actualizarPerfil(req, res, next) {
  try {
    const { nombre_completo, telefono } = req.body;
    await pool.query(
      'UPDATE usuarios SET nombre_completo = COALESCE(?, nombre_completo), telefono = ? WHERE id = ?',
      [nombre_completo, telefono || null, req.usuario.id]
    );
    res.json({ mensaje: 'Perfil actualizado' });
  } catch (error) {
    next(error);
  }
}
