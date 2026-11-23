const bcrypt = require('bcryptjs');

const { User } = require('../models');

const {
  generateToken,
} = require('../utils/jwt');

// POST /api/auth/register
// Público
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Completa todos los campos.',
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

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword,

      // El registro público nunca asigna
      // privilegios administrativos.
      role: 'USER',
    });

    if (!user) {
      return res.status(400).json({
        message: 'Los datos de la cuenta no son válidos.',
      });
    }

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Ingresa tu correo y contraseña.',
      });
    }

    const user = await User.findOne({
      where: { email },
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