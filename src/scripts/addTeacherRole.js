require('dotenv').config();

const {
  sequelize,
  CourseTeacher,
} = require('../models');

const addTeacherRole = async () => {
  try {
    await sequelize.authenticate();

    // Obtiene el nombre real del ENUM de users.role.
    const [columns] = await sequelize.query(`
      SELECT
        enum_namespace.nspname AS enum_schema,
        enum_type.typname AS enum_name
      FROM pg_attribute AS attribute
      JOIN pg_type AS enum_type
        ON enum_type.oid = attribute.atttypid
      JOIN pg_namespace AS enum_namespace
        ON enum_namespace.oid = enum_type.typnamespace
      WHERE attribute.attrelid = to_regclass('users')
        AND attribute.attname = 'role'
        AND attribute.attnum > 0
        AND NOT attribute.attisdropped
        AND enum_type.typtype = 'e'
    `);

    if (columns.length !== 1) {
      throw new Error(
        'No se encontró el tipo ENUM de users.role.'
      );
    }

    const quoteIdentifier = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const enumSchema = quoteIdentifier(
      columns[0].enum_schema
    );

    const enumName = quoteIdentifier(
      columns[0].enum_name
    );

    await sequelize.query(
      `ALTER TYPE ${enumSchema}.${enumName}
       ADD VALUE IF NOT EXISTS 'DOCENTE'`
    );

    // Crea únicamente la tabla nueva si todavía no existe.
    await CourseTeacher.sync();

    console.log(
      'Rol DOCENTE y tabla de asignaciones preparados correctamente.'
    );
  } catch (error) {
    console.error(
      'No se pudo preparar el rol docente:',
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

addTeacherRole();