// Administración general:
// ADMIN y SUPERADMIN.
const admin = (req, res, next) => {
  if (
    req.user &&
    ['ADMIN', 'SUPERADMIN'].includes(req.user.role)
  ) {
    return next();
  }

  return res.status(403).json({
    message: 'No tienes permisos administrativos.',
  });
};

// Gestión de roles:
// solo SUPERADMIN.
const superAdmin = (req, res, next) => {
  if (req.user?.role === 'SUPERADMIN') {
    return next();
  }

  return res.status(403).json({
    message:
      'Esta acción requiere permisos de superadministrador.',
  });
};

// Gestión de cursos:
// solo administrador tutor.
const courseAdmin = (req, res, next) => {
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  return res.status(403).json({
    message:
      'La gestión de cursos está disponible únicamente para el administrador tutor.',
  });
};

module.exports = {
  admin,
  superAdmin,
  courseAdmin,
};