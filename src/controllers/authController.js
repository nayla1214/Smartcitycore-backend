const bcrypt = require('bcryptjs');
const { resolveMx } = require('node:dns').promises;

const { User } = require('../models');
const { generateToken } = require('../utils/jwt');

const NAME_PATTERN =
  /^[\p{L}\p{M}]+(?:[ '’\-][\p{L}\p{M}]+)*$/u;

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

const normalizeName = (value) =>
  value.normalize('NFC').trim().replace(/\s+/gu, ' ');

const normalizeEmail = (value) =>
  value.trim().toLowerCase();

const isValidEmail = (email) => {
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return false;
  }

  const [local, domain] = email.split('@');

  return (
    local.length <= 64 &&
    !local.startsWith('.') &&
    !local.endsWith('.') &&
    !local.includes('..') &&
    domain.split('.').every((label) => label.length <= 63)
  );
};

// Comprueba el dominio, no la existencia del buzón.
const domainReceivesEmail = async (domain) => {
  let timeout;

  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          const error = new Error('DNS timeout');
          error.code = 'EMAIL_DNS_TIMEOUT';
          reject(error);
        }, 5000);
      }),
    ]);

    return records.some(
      (record) =>
        record.exchange && record.exchange !== '.'
    );
  } finally {
    clearTimeout(timeout);
  }
};

// POST /api/auth/register
// Público
const registerUser = async (req, res) => {
  try {
    const body = req.body || {};

    if (
      typeof body.name !== 'string' ||
      typeof body.email !== 'string' ||
      typeof body.password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Completa todos los campos correctamente.',
      });
    }

    const name = normalizeName(body.name);
    const email = normalizeEmail(body.email);
    const password = body.password;

    if (
      name.length < 2 ||
      name.length > 120 ||
      !NAME_PATTERN.test(name)
    ) {
      return res.status(400).json({
        message:
          'El nombre debe contener entre 2 y 120 caracteres. Usa letras, espacios, apóstrofos o guiones; no números.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Ingresa un correo electrónico válido.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          'La contraseña debe tener al menos 6 caracteres.',
      });
    }

    // bcrypt admite como máximo 72 bytes.
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        message:
          'La contraseña es demasiado larga. Usa una más corta.',
      });
    }

    const userExists = await User.findOne({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({
        message:
          'Ya existe una cuenta con este correo electrónico.',
      });
    }

    const domain = email.split('@')[1];

    try {
      const receivesEmail =
        await domainReceivesEmail(domain);

      if (!receivesEmail) {
        return res.status(400).json({
          message:
            'El dominio de este correo no tiene un servidor de correo disponible. Revisa la dirección.',
        });
      }
    } catch (error) {
      if (
        ['ENOTFOUND', 'ENODATA'].includes(error.code)
      ) {
        return res.status(400).json({
          message:
            'No se encontró un servidor de correo para ese dominio. Revisa la dirección.',
        });
      }

      console.error(
        'Error comprobando el dominio del correo:',
        error.code
      );

      return res.status(503).json({
        message:
          'No se pudo comprobar el dominio del correo en este momento. Intenta nuevamente.',
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword,

      // El registro público solo crea participantes.
      role: 'USER',
    });

    return res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    console.error('Error registrando usuario:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message:
          'Ya existe una cuenta con este correo electrónico.',
      });
    }

    return res.status(500).json({
      message: 'No se pudo registrar la cuenta.',
    });
  }
};

// POST /api/auth/login
// Público
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Ingresa tu correo y contraseña.',
      });
    }

    const user = await User.findOne({
      where: {
        email: normalizeEmail(email),
      },
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        message: 'Correo o contraseña incorrectos.',
      });
    }

    if (!user.status) {
      return res.status(401).json({
        message:
          'Tu cuenta está desactivada. Comunícate con la administración.',
      });
    }

    return res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    console.error('Error iniciando sesión:', error);

    return res.status(500).json({
      message: 'No se pudo iniciar sesión.',
    });
  }
};

// GET /api/auth/me
// Usuario autenticado
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    });
  } catch (error) {
    console.error('Error consultando cuenta:', error);

    return res.status(500).json({
      message: 'No se pudo consultar la cuenta.',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};