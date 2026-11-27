require('dotenv').config();

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

async function main() {
  try {
    await sequelize.authenticate();

    const queryInterface = sequelize.getQueryInterface();

    await sequelize.transaction(async (transaction) => {
      const columns = await queryInterface.describeTable(
        'certificates',
        { transaction }
      );

      if (!columns.issued_snapshot) {
        await queryInterface.addColumn(
          'certificates',
          'issued_snapshot',
          {
            type: DataTypes.JSONB,
            allowNull: true,
          },
          { transaction }
        );

        console.log(
          'Columna de emisión agregada correctamente.'
        );
      } else {
        console.log('La columna de emisión ya existe.');
      }
    });
  } catch (error) {
    console.error(
      'No se pudo preparar la emisión:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();