require('dotenv').config();

const {
  sequelize,
  Course,
  Module,
  Evaluation,
  EvaluationActivity,
} = require('../models');

const COURSE_ID = 1;
const MODULE_ID = 2;

const TITLE =
  'Evaluación integradora del módulo 2: Infraestructura Sostenible y Movilidad';

const activities = [
  {
    activity_key: 'verdadero_falso',
    type: 'true_false',
    title: 'Verdadero o falso',
    instructions:
      'Indica si cada afirmación es verdadera o falsa. Cada acierto vale 0,5 puntos.',
    score: 2,
    order_number: 1,

    public_config: {
      statements: [
        {
          id: 'vf1',
          text:
            'La infraestructura verde puede contribuir a reducir el calor y manejar el agua de lluvia en la ciudad.',
        },
        {
          id: 'vf2',
          text:
            'El transporte sostenible consiste únicamente en incorporar aplicaciones digitales para los automóviles.',
        },
        {
          id: 'vf3',
          text:
            'Un espacio público debe considerar la accesibilidad y las necesidades de diferentes grupos de personas.',
        },
        {
          id: 'vf4',
          text:
            'Una vez construido un espacio verde, ya no es necesario mantenerlo ni comprobar sus resultados.',
        },
      ],
    },

    solution: {
      answers: {
        vf1: true,
        vf2: false,
        vf3: true,
        vf4: false,
      },
    },
  },

  {
    activity_key: 'completar',
    type: 'fill_blanks',
    title: 'Completa las ideas',
    instructions:
      'Selecciona una palabra del banco para cada frase. Cada acierto vale 1 punto.',
    score: 2,
    order_number: 2,

    public_config: {
      word_bank: [
        {
          id: 'monitoreo',
          text: 'monitoreo',
        },
        {
          id: 'accesibilidad',
          text: 'accesibilidad',
        },
        {
          id: 'publicidad',
          text: 'publicidad',
        },
        {
          id: 'estacionamiento',
          text: 'estacionamiento',
        },
      ],

      sentences: [
        {
          id: 'completar1',
          before:
            'Para comprobar si una intervención de infraestructura verde mejora las condiciones del lugar, se debe realizar un',
          after: 'de sus resultados.',
        },
        {
          id: 'completar2',
          before:
            'Los recorridos que permiten utilizar un espacio a personas con diferentes condiciones de movilidad favorecen la',
          after: 'del lugar.',
        },
      ],
    },

    solution: {
      answers: {
        completar1: 'monitoreo',
        completar2: 'accesibilidad',
      },
    },
  },

  {
    activity_key: 'infraestructura_verde',
    type: 'case_study',
    title: 'Elige una solución de infraestructura verde',
    instructions:
      'Lee cada situación y selecciona una respuesta. Cada acierto vale 1 punto.',
    score: 2,
    order_number: 3,

    public_config: {
      scenario:
        'Un municipio busca aprovechar la naturaleza para atender problemas ambientales en sus espacios públicos.',

      questions: [
        {
          id: 'verde1',
          text:
            'Una plaza presenta mucho calor durante el día y escasa sombra. ¿Qué medida responde mejor a esa necesidad?',

          options: [
            {
              id: 'verde1_a',
              text:
                'Cubrir toda la plaza con pavimento oscuro.',
            },
            {
              id: 'verde1_b',
              text:
                'Retirar los árboles para ampliar la superficie libre.',
            },
            {
              id: 'verde1_c',
              text:
                'Incorporar árboles adecuados al lugar y planificar su cuidado.',
            },
            {
              id: 'verde1_d',
              text:
                'Instalar una aplicación sin modificar las condiciones del espacio.',
            },
          ],
        },
        {
          id: 'verde2',
          text:
            'Un terreno acumula agua cuando llueve. ¿Qué propuesta de infraestructura verde conviene estudiar según las condiciones del suelo y del sitio?',

          options: [
            {
              id: 'verde2_a',
              text:
                'Pavimentar por completo el terreno sin revisar el drenaje.',
            },
            {
              id: 'verde2_b',
              text:
                'Incorporar jardines de lluvia y superficies permeables con mantenimiento previsto.',
            },
            {
              id: 'verde2_c',
              text:
                'Aumentar los estacionamientos sin analizar la acumulación de agua.',
            },
            {
              id: 'verde2_d',
              text:
                'Plantar vegetación únicamente decorativa sin evaluar el problema.',
            },
          ],
        },
      ],
    },

    solution: {
      answers: {
        verde1: 'verde1_c',
        verde2: 'verde2_b',
      },
    },
  },

  {
    activity_key: 'movilidad_accesibilidad',
    type: 'case_study',
    title: 'Decide cómo mejorar la movilidad',
    instructions:
      'Selecciona una respuesta para cada situación. Cada acierto vale 1 punto.',
    score: 2,
    order_number: 4,

    public_config: {
      scenario:
        'El municipio quiere facilitar los desplazamientos cotidianos y el acceso a los servicios para toda la población.',

      questions: [
        {
          id: 'movilidad1',
          text:
            'El autobús llega con poca frecuencia y sus horarios son poco confiables. ¿Qué medida atiende de forma más directa el problema?',

          options: [
            {
              id: 'movilidad1_a',
              text:
                'Mejorar la frecuencia y la regularidad del servicio a partir de las necesidades de viaje.',
            },
            {
              id: 'movilidad1_b',
              text:
                'Cambiar solamente el color de los autobuses.',
            },
            {
              id: 'movilidad1_c',
              text:
                'Publicar una aplicación y mantener los mismos tiempos de espera.',
            },
            {
              id: 'movilidad1_d',
              text:
                'Ampliar únicamente los estacionamientos para vehículos particulares.',
            },
          ],
        },
        {
          id: 'movilidad2',
          text:
            'El recorrido entre una parada y un parque tiene obstáculos y cruces inseguros. ¿Qué intervención favorece la movilidad sostenible y la inclusión?',

          options: [
            {
              id: 'movilidad2_a',
              text:
                'Alejar la parada para reducir las personas que llegan al parque.',
            },
            {
              id: 'movilidad2_b',
              text:
                'Cerrar el acceso a quienes necesitan ayuda para desplazarse.',
            },
            {
              id: 'movilidad2_c',
              text:
                'Colocar información digital sin cambiar el recorrido.',
            },
            {
              id: 'movilidad2_d',
              text:
                'Mejorar los recorridos peatonales accesibles y los cruces seguros.',
            },
          ],
        },
      ],
    },

    solution: {
      answers: {
        movilidad1: 'movilidad1_a',
        movilidad2: 'movilidad2_d',
      },
    },
  },

  {
    activity_key: 'caso_integrador',
    type: 'case_study',
    title: 'Mejora un espacio de tu municipio',
    instructions:
      'Lee el caso y selecciona una respuesta para cada pregunta. Cada acierto vale 1 punto.',
    score: 2,
    order_number: 5,

    public_config: {
      scenario:
        'Un barrio tiene una plaza con poca sombra, acumulación de agua después de la lluvia y accesos difíciles para personas con movilidad reducida. La parada de autobús cercana tiene conexiones peatonales inseguras. El municipio dispone de recursos limitados y quiere realizar una intervención útil para la comunidad.',

      questions: [
        {
          id: 'caso1',
          text:
            '¿Qué propuesta integra mejor los tres temas del módulo?',

          options: [
            {
              id: 'caso1_a',
              text:
                'Renovar solo la apariencia de la plaza y conservar los problemas de acceso.',
            },
            {
              id: 'caso1_b',
              text:
                'Consultar a los vecinos y planificar vegetación y manejo del agua, recorridos accesibles y conexión segura con la parada.',
            },
            {
              id: 'caso1_c',
              text:
                'Instalar cámaras y considerar resueltos todos los problemas.',
            },
            {
              id: 'caso1_d',
              text:
                'Destinar toda la plaza a estacionamientos sin analizar las necesidades de la comunidad.',
            },
          ],
        },
        {
          id: 'caso2',
          text:
            '¿Cómo conviene comprobar si la intervención funcionó?',

          options: [
            {
              id: 'caso2_a',
              text:
                'Contar únicamente las publicaciones sobre la inauguración.',
            },
            {
              id: 'caso2_b',
              text:
                'Dar por terminado el proyecto sin consultar a quienes utilizan el lugar.',
            },
            {
              id: 'caso2_c',
              text:
                'Comparar antes y después la sombra, la acumulación de agua y la facilidad de acceso, junto con la experiencia de los usuarios.',
            },
            {
              id: 'caso2_d',
              text:
                'Medir solamente cuánto se gastó, sin revisar los resultados.',
            },
          ],
        },
      ],
    },

    solution: {
      answers: {
        caso1: 'caso1_b',
        caso2: 'caso2_c',
      },
    },
  },
];

const main = async () => {
  try {
    await sequelize.authenticate();

    const course = await Course.findByPk(COURSE_ID);

    if (!course) {
      throw new Error(
        `No existe el curso con ID ${COURSE_ID}.`
      );
    }

    const moduleData = await Module.findByPk(MODULE_ID);

    if (
      !moduleData ||
      Number(moduleData.courseId) !== COURSE_ID
    ) {
      throw new Error(
        'No se encontró el módulo 2 asociado al curso 1.'
      );
    }

    await EvaluationActivity.sync();

    const result = await sequelize.transaction(
      async (transaction) => {
        await Module.findByPk(MODULE_ID, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        const existing = await Evaluation.findOne({
          where: {
            moduleId: MODULE_ID,
            courseId: COURSE_ID,
            title: TITLE,
          },
          transaction,
        });

        if (existing) {
          const count = await EvaluationActivity.count({
            where: {
              evaluationId: existing.id,
            },
            transaction,
          });

          if (count !== activities.length) {
            throw new Error(
              'La evaluación ya existe, pero no tiene las cinco actividades esperadas. No se realizaron cambios.'
            );
          }

          return {
            evaluation: existing,
            created: false,
          };
        }

        const evaluation = await Evaluation.create(
          {
            moduleId: MODULE_ID,
            courseId: COURSE_ID,
            title: TITLE,
            is_final: false,
          },
          { transaction }
        );

        await EvaluationActivity.bulkCreate(
          activities.map((activity) => ({
            ...activity,
            evaluationId: evaluation.id,
          })),
          {
            transaction,
            validate: true,
          }
        );

        return {
          evaluation,
          created: true,
        };
      }
    );

    console.log(
      result.created
        ? 'Evaluación integradora del módulo 2 creada correctamente.'
        : 'La evaluación integradora del módulo 2 ya estaba registrada.'
    );

    console.log(`ID: ${result.evaluation.id}`);
    console.log(`Título: ${result.evaluation.title}`);
    console.log('Curso: 1. Módulo: 2.');
    console.log('Actividades: 5.');
    console.log('Nota máxima: 10 puntos.');
    console.log('Aprobación: desde 7/10 puntos (70 %).');
    console.log(
      'Esta evaluación no genera el certificado del curso.'
    );
  } catch (error) {
    console.error(
      'No se pudo registrar la evaluación:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

main();