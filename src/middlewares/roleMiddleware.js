// Administración general: ADMIN y SUPERADMIN.
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

// Gestión de roles: solo SUPERADMIN.
const superAdmin = (req, res, next) => {
  if (req.user?.role === 'SUPERADMIN') {
    return next();
  }

  return res.status(403).json({
    message:
      'Esta acción requiere permisos de superadministrador.',
  });
};

// Administración de cursos: solo administrador tutor.
const courseAdmin = (req, res, next) => {
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  return res.status(403).json({
    message:
      'La gestión de cursos está disponible únicamente para el administrador tutor.',
  });
};

// Acceso al área docente.
// Cada operación debe comprobar además el curso asignado.
const teacher = (req, res, next) => {
  if (req.user?.role === 'DOCENTE') {
    return next();
  }

  return res.status(403).json({
    message:
      'Esta sección está disponible únicamente para docentes.',
  });
};

module.exports = {
  admin,
  superAdmin,
  courseAdmin,
  teacher,
};