const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization;

  const match =
    typeof authorization === 'string'
      ? authorization.match(/^Bearer\s+(\S+)$/i)
      : null;

  if (!match) {
    return res.status(401).json({
      message:
        'Debes iniciar sesión para acceder a esta sección.',
    });
  }

  try {
    const decoded = verifyToken(match[1]);

    // Los permisos se consultan en la base de datos.
    // No se confía en el rol guardado en el token.
    const user = await User.findByPk(decoded.id, {
      attributes: {
        exclude: ['password'],
      },
    });

    if (!user) {
      return res.status(401).json({
        message: 'La cuenta no está disponible.',
      });
    }

    if (!user.status) {
      return res.status(401).json({
        message:
          'Tu cuenta está desactivada. Comunícate con la administración.',
      });
    }

    req.user = user;
  } catch (error) {
    console.error(
      'Error verificando la sesión:',
      error.message
    );

    return res.status(401).json({
      message:
        'Tu sesión no es válida o ha caducado. Inicia sesión nuevamente.',
    });
  }

  return next();
};

module.exports = {
  protect,
};