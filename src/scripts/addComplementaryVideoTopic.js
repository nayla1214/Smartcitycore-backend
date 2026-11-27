require('dotenv').config();

const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const ComplementaryVideo =
  require('../models/ComplementaryVideo');

const run = async () => {
  try {
    await sequelize.authenticate();

    // También permite ejecutar el script si
    // todavía no existe la tabla.
    await ComplementaryVideo.sync();

    const queryInterface =
      sequelize.getQueryInterface();

    const columns =
      await queryInterface.describeTable(
        'complementary_videos'
      );

    if (!columns.topicNumber) {
      await queryInterface.addColumn(
        'complementary_videos',
        'topicNumber',
        {
          type: DataTypes.STRING(30),
          allowNull: true,
        }
      );
    }

    console.log(
      'Relación de videos complementarios con temas preparada.'
    );
  } catch (error) {
    console.error(
      'No se pudo actualizar la tabla:',
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();