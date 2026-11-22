const {
  createHash,
} = require('crypto');

const ReadingProgress = require(
  '../models/ReadingProgress'
);

const catalog = require(
  '../data/readingCatalog.json'
);

const getMyReadings = async (req, res) => {
  const topic = req.params.topicNumber;

  if (!Object.hasOwn(catalog, topic)) {
    return res.status(404).json({
      message: 'Tema no encontrado.',
    });
  }

  try {
    const rows =
      await ReadingProgress.findAll({
        where: {
          userId: req.user.id,
          topicNumber: topic,
        },

        attributes: ['url'],

        raw: true,
      });

    const urls = rows
      .map((row) => row.url)
      .filter((url) =>
        catalog[topic].includes(url)
      );

    return res.json({
      urls,
    });
  } catch (error) {
    console.error(
      'Error al consultar lecturas:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudo consultar el registro de lecturas.',
    });
  }
};

const saveMyReadings = async (req, res) => {
  const topic = req.params.topicNumber;

  if (!Object.hasOwn(catalog, topic)) {
    return res.status(404).json({
      message: 'Tema no encontrado.',
    });
  }

  const urls = req.body?.urls;

  const invalidUrls =
    !Array.isArray(urls) ||
    urls.length > 100 ||
    urls.some(
      (url) =>
        typeof url !== 'string' ||
        !catalog[topic].includes(url)
    );

  if (invalidUrls) {
    return res.status(400).json({
      message:
        'Los enlaces no corresponden a las lecturas de este tema.',
    });
  }

  try {
    const records = [
      ...new Set(urls),
    ].map((url) => ({
      userId: req.user.id,

      topicNumber: topic,

      url,

      urlHash: createHash('sha256')
        .update(url)
        .digest('hex'),
    }));

    if (records.length > 0) {
      await ReadingProgress.bulkCreate(
        records,
        {
          ignoreDuplicates: true,
          validate: true,
        }
      );
    }

    return getMyReadings(req, res);
  } catch (error) {
    console.error(
      'Error al guardar lecturas:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudo guardar el registro de lecturas.',
    });
  }
};

module.exports = {
  getMyReadings,
  saveMyReadings,
};