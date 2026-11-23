require('dotenv').config();

const {
  Op,
  fn,
  col,
  where,
  QueryTypes,
} = require('sequelize');

const sequelize = require('../config/database');
const User = require('../models/User');

const createFirstSuperAdmin = async () => {
  const email = process.argv[2]?.trim();

  if (!email) {
    throw new Error(
      'Debes indicar el correo de tu cuenta. ' +
      'Ejemplo: node src/scripts/createFirstSuperAdmin.js tu-correo@ejemplo.com'
    );
  }

  await sequelize.authenticate();

  // Localiza el tipo ENUM real de users.role.
  const enumTypes = await sequelize.query(
    `
      SELECT
        type_namespace.nspname AS "schemaName",
        role_type.typname AS "typeName"
      FROM pg_attribute AS attribute
      JOIN pg_class AS user_table
        ON user_table.oid = attribute.attrelid
      JOIN pg_namespace AS table_namespace
        ON table_namespace.oid = user_table.relnamespace
      JOIN pg_type AS role_type
        ON role_type.oid = attribute.atttypid
      JOIN pg_namespace AS type_namespace
        ON type_namespace.oid = role_type.typnamespace
      WHERE user_table.relname = 'users'
        AND table_namespace.nspname = current_schema()
        AND attribute.attname = 'role'
        AND attribute.attnum > 0
        AND NOT attribute.attisdropped
        AND role_type.typtype = 'e'
    `,
    {
      type: QueryTypes.SELECT,
    }
  );

  if (enumTypes.length !== 1) {
    throw new Error(
      'No se encontró el tipo ENUM de users.role. ' +
      'No se modificó ninguna cuenta.'
    );
  }

  const queryGenerator =
    sequelize.getQueryInterface().queryGenerator;

  const enumSchema = queryGenerator.quoteIdentifier(
    enumTypes[0].schemaName
  );

  const enumName = queryGenerator.quoteIdentifier(
    enumTypes[0].typeName
  );

  // Se ejecuta fuera de la transacción para que
  // PostgreSQL permita utilizar el nuevo valor.
  await sequelize.query(
    `ALTER TYPE ${enumSchema}.${enumName}
     ADD VALUE IF NOT EXISTS 'SUPERADMIN'`
  );

  await sequelize.transaction(async (transaction) => {
    // Evita que dos ejecuciones simultáneas
    // creen el primer superadministrador.
    await sequelize.query(
      'LOCK TABLE "users" IN SHARE ROW EXCLUSIVE MODE',
      { transaction }
    );

    const existingSuperAdmin = await User.findOne({
      where: {
        role: 'SUPERADMIN',
      },
      transaction,
    });

    if (existingSuperAdmin) {
      throw new Error(
        'Ya existe un superadministrador. ' +
        'Este script solo configura la primera cuenta.'
      );
    }

    const matches = await User.findAll({
      where: {
        [Op.and]: [
          where(
            fn('LOWER', col('email')),
            email.toLowerCase()
          ),
        ],
      },
      transaction,
    });

    if (matches.length === 0) {
      throw new Error(
        'No existe una cuenta con ese correo. ' +
        'Regístrala primero en la plataforma.'
      );
    }

    if (matches.length > 1) {
      throw new Error(
        'Hay varias cuentas que coinciden con ese correo. ' +
        'Revisa las cuentas antes de continuar.'
      );
    }

    const user = matches[0];

    if (!user.status) {
      throw new Error(
        'La cuenta está desactivada. ' +
        'Actívala antes de asignarle este rol.'
      );
    }

    await user.update(
      {
        role: 'SUPERADMIN',
      },
      {
        transaction,
      }
    );

    console.log(
      `La cuenta ${user.email} ahora es SUPERADMIN.`
    );
  });

  console.log(
    'Cierra tu sesión y vuelve a iniciarla para actualizar tus permisos.'
  );
};

const run = async () => {
  try {
    await createFirstSuperAdmin();
  } catch (error) {
    console.error(
      'No se pudo configurar el superadministrador:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();