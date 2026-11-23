const { Op } = require('sequelize');
const { User } = require('../models');

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const publicUser = (user) => ({
  id: user.id,
  _id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/*
 * Consulta y bloquea las cuentas durante el cambio.
 * También vuelve a comprobar los permisos del actor.
 */
const getAccountsForUpdate = async (
  actorId,
  targetId,
  transaction
) => {
  const accounts = await User.findAll({
    where: {
      id: {
        [Op.in]: [actorId, targetId],
      },
    },
    order: [['id', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const actor = accounts.find(
    (account) => Number(account.id) === actorId
  );

  const target = accounts.find(
    (account) => Number(account.id) === targetId
  );

  if (!actor || actor.status !== true) {
    throw createHttpError(
      401,
      'Tu cuenta no tiene una sesión autorizada.'
    );
  }

  if (!target) {
    throw createHttpError(
      404,
      'Usuario no encontrado.'
    );
  }

  return { actor, target };
};

const getTargetId = (value) => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw createHttpError(
      400,
      'El identificador de usuario no es válido.'
    );
  }

  return id;
};

const handleError = (res, error, fallback) => {
  if (error.status) {
    return res.status(error.status).json({
      message: error.message,
    });
  }

  console.error(fallback, error);

  return res.status(500).json({
    message: fallback,
  });
};

// PUT /api/users/:id/role
// Exclusivo de SUPERADMIN.
const updateUserRole = async (req, res) => {
  try {
    const targetId = getTargetId(req.params.id);
    const actorId = Number(req.user.id);
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        message:
          'Solo puedes asignar los roles USER o ADMIN.',
      });
    }

    if (targetId === actorId) {
      return res.status(403).json({
        message:
          'No puedes modificar tu propio rol.',
      });
    }

    const updatedUser = await User.sequelize.transaction(
      async (transaction) => {
        const { actor, target } =
          await getAccountsForUpdate(
            actorId,
            targetId,
            transaction
          );

        if (actor.role !== 'SUPERADMIN') {
          throw createHttpError(
            403,
            'Solo el superadministrador puede cambiar roles.'
          );
        }

        if (
          !['USER', 'ADMIN'].includes(target.role)
        ) {
          throw createHttpError(
            403,
            'No puedes modificar el rol de esta cuenta.'
          );
        }

        if (
          role === 'ADMIN' &&
          target.status !== true
        ) {
          throw createHttpError(
            400,
            'Activa la cuenta antes de asignarle el rol de administrador.'
          );
        }

        await target.update(
          { role },
          { transaction }
        );

        return publicUser(target);
      }
    );

    return res.status(200).json({
      message:
        role === 'ADMIN'
          ? 'La cuenta ahora tiene permisos de administrador.'
          : 'La cuenta ahora tiene permisos de participante.',
      user: updatedUser,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudo actualizar el rol del usuario.'
    );
  }
};

// PUT /api/users/:id/status
// ADMIN: solo participantes.
// SUPERADMIN: participantes y administradores.
const updateManagedUserStatus = async (req, res) => {
  try {
    const targetId = getTargetId(req.params.id);
    const actorId = Number(req.user.id);
    const { status } = req.body;

    if (typeof status !== 'boolean') {
      return res.status(400).json({
        message:
          'El estado debe ser true o false.',
      });
    }

    if (targetId === actorId) {
      return res.status(403).json({
        message:
          'No puedes cambiar el estado de tu propia cuenta.',
      });
    }

    const updatedUser = await User.sequelize.transaction(
      async (transaction) => {
        const { actor, target } =
          await getAccountsForUpdate(
            actorId,
            targetId,
            transaction
          );

        if (
          !['ADMIN', 'SUPERADMIN'].includes(actor.role)
        ) {
          throw createHttpError(
            403,
            'No tienes permisos administrativos.'
          );
        }

        if (
          !['USER', 'ADMIN'].includes(target.role)
        ) {
          throw createHttpError(
            403,
            'No puedes cambiar el estado de esta cuenta.'
          );
        }

        if (
          actor.role === 'ADMIN' &&
          target.role !== 'USER'
        ) {
          throw createHttpError(
            403,
            'El director solo puede activar o desactivar cuentas de participantes.'
          );
        }

        await target.update(
          { status },
          { transaction }
        );

        return publicUser(target);
      }
    );

    return res.status(200).json({
      message: status
        ? 'Cuenta activada correctamente.'
        : 'Cuenta desactivada correctamente.',
      user: updatedUser,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudo actualizar el estado de la cuenta.'
    );
  }
};
// GET /api/users/:id/progress
// Consulta administrativa del avance de un participante.
const getManagedUserProgress = async (req, res) => {
  try {
    if (
      !['ADMIN', 'SUPERADMIN'].includes(req.user?.role)
    ) {
      return res.status(403).json({
        message: 'No tienes permisos administrativos.',
      });
    }

    const targetId = getTargetId(req.params.id);

    const target = await User.findByPk(targetId, {
      attributes: {
        exclude: ['password'],
      },
    });

    if (!target) {
      return res.status(404).json({
        message: 'Usuario no encontrado.',
      });
    }

    if (target.role !== 'USER') {
      return res.status(400).json({
        message:
          'El seguimiento académico corresponde a cuentas de participantes.',
      });
    }

    const {
      getMyProgress,
    } = require('./userController');

    const {
      Evaluation,
      EvaluationAttempt,
    } = require('../models');

    // Reutiliza el cálculo existente sin modificar
    // la identidad de quien realiza la consulta.
    let progressStatus = 200;
    let progressData;

    const progressResponse = {
      status(code) {
        progressStatus = code;
        return this;
      },

      json(data) {
        progressData = data;
        return this;
      },
    };

    await getMyProgress(
      {
        user: {
          id: target.id,
          role: req.user.role,
        },
      },
      progressResponse
    );

    if (progressStatus !== 200 || !progressData) {
      return res.status(progressStatus || 500).json(
        progressData || {
          message:
            'No se pudo consultar el avance del participante.',
        }
      );
    }

    const attempts = await EvaluationAttempt.findAll({
      where: {
        userId: target.id,
      },
      attributes: [
        'id',
        'evaluationId',
        'score',
        'passed',
        'attempted_at',
      ],
      include: [
        {
          model: Evaluation,
          attributes: [
            'id',
            'title',
            'moduleId',
            'courseId',
            'is_final',
          ],
        },
      ],
      order: [
        ['attempted_at', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return res.status(200).json({
      ...progressData,
      participant: publicUser(target),
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        evaluationId: attempt.evaluationId,
        title:
          attempt.Evaluation?.title || 'Evaluación',
        moduleId:
          attempt.Evaluation?.moduleId ?? null,
        courseId:
          attempt.Evaluation?.courseId ?? null,
        score: Number(attempt.score),
        passed: attempt.passed === true,
        attemptedAt: attempt.attempted_at,
      })),
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudo consultar el seguimiento académico.'
    );
  }
};
module.exports = {
  updateUserRole,
  updateManagedUserStatus,
  getManagedUserProgress,
};