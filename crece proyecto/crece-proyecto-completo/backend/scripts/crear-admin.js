import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { pool } from '../src/config/db.js';

function preguntarOculto(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      reject(new Error('Ejecuta este comando desde una terminal interactiva.'));
      return;
    }

    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    let valor = '';

    const alRecibirDato = (dato) => {
      const caracter = dato.toString('utf8');
      if (caracter === '\u0003') {
        stdin.setRawMode(false);
        stdin.removeListener('data', alRecibirDato);
        stdout.write('\n');
        reject(new Error('Operación cancelada.'));
      } else if (caracter === '\r' || caracter === '\n') {
        stdin.setRawMode(false);
        stdin.removeListener('data', alRecibirDato);
        stdout.write('\n');
        resolve(valor);
      } else if (caracter === '\u007f' || caracter === '\b') {
        valor = valor.slice(0, -1);
      } else {
        valor += caracter;
      }
    };

    stdin.on('data', alRecibirDato);
  });
}

let interfaz;
try {
  interfaz = readline.createInterface({ input: stdin, output: stdout });
  const nombre = (await interfaz.question('Nombre del administrador: ')).trim();
  const email = (await interfaz.question('Correo del administrador: ')).trim().toLowerCase();
  interfaz.close();
  interfaz = undefined;

  if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Debes ingresar un nombre y un correo válido.');
  }

  const password = await preguntarOculto('Contraseña (mínimo 8 caracteres, no se mostrará): ');
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existentes.length) {
    throw new Error('Ese correo ya está registrado. Usa un correo diferente para el administrador.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO usuarios (nombre_completo, email, password_hash, rol, estado)
     VALUES (?, ?, ?, 'admin', 'activo')`,
    [nombre, email, passwordHash]
  );
  console.log(`Administrador ${email} creado correctamente.`);
} catch (error) {
  console.error(`No se pudo crear el administrador: ${error.message}`);
  process.exitCode = 1;
} finally {
  interfaz?.close();
  await pool.end();
}
