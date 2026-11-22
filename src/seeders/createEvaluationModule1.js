require('dotenv').config();

const {
  sequelize,
  Course,
  Module,
  Evaluation,
  EvaluationActivity,
} = require('../models');

const COURSE_ID = 1;
const MODULE_ID = 1;

const TITLE =
  'Evaluación integradora del módulo 1: Fundamentos de las Ciudades Inteligentes';

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
            'Una ciudad es inteligente únicamente por instalar sensores y ofrecer conexión a internet.',
        },
        {
          id: 'vf2',
          text:
            'La transparencia, la participación y la colaboración contribuyen a una gobernanza inteligente.',
        },
        {
          id: 'vf3',
          text:
            'Pasar los formularios del papel a internet garantiza, por sí solo, que el servicio municipal mejore.',
        },
        {
          id: 'vf4',
          text:
            'Una plataforma urbana puede organizar datos y presentarlos mediante mapas, gráficos e indicadores.',
        },
      ],
    },

    solution: {
      answers: {
        vf1: false,
        vf2: true,
        vf3: false,
        vf4: true,
      },
    },
  },

  {
    activity_key: 'completar',
    type: 'fill_blanks',
    title: 'Completa las ideas',
    instructions:
      'Completa cada frase seleccionando una palabra del banco. Cada acierto vale 1 punto.',
    score: 2,
    order_number: 2,

    public_config: {
      word_bank: [
        {
          id: 'participacion',
          text: 'participación',
        },
        {
          id: 'indicadores',
          text: 'indicadores',
        },
        {
          id: 'publicidad',
          text: 'publicidad',
        },
        {
          id: 'estacionamientos',
          text: 'estacionamientos',
        },
      ],

      sentences: [
        {
          id: 'completar1',
          before:
            'Para escuchar a la población e incluirla en las decisiones, el municipio debe promover la',
          after: 'ciudadana.',
        },
        {
          id: 'completar2',
          before:
            'Para comprobar si una mejora municipal está dando resultados, es necesario utilizar',
          after: 'de desempeño.',
        },
      ],
    },

    solution: {
      answers: {
        completar1: 'participacion',
        completar2: 'indicadores',
      },
    },
  },

  {
    activity_key: 'relacionar',
    type: 'matching',
    title: 'Relaciona los conceptos',
    instructions:
      'Selecciona un concepto y después su definición. Cada relación correcta vale 0,5 puntos.',
    score: 2,
    order_number: 3,

    public_config: {
      left_items: [
        {
          id: 'concepto1',
          text: 'Ciudad inteligente',
        },
        {
          id: 'concepto2',
          text: 'Gobernanza inteligente',
        },
        {
          id: 'concepto3',
          text: 'Transformación urbana',
        },
        {
          id: 'concepto4',
          text: 'Plataforma web urbana',
        },
      ],

      right_items: [
        {
          id: 'definicion1',
          text:
            'Herramienta que organiza y permite consultar información del territorio mediante mapas, gráficos e indicadores.',
        },
        {
          id: 'definicion2',
          text:
            'Mejora gradual de la ciudad que requiere cambios en la gestión y los servicios, además del uso de tecnología.',
        },
        {
          id: 'definicion3',
          text:
            'Combina información, tecnología, planificación y participación para mejorar la calidad de vida.',
        },
        {
          id: 'definicion4',
          text:
            'Gestión pública que incorpora transparencia, participación y colaboración para tomar mejores decisiones.',
        },
      ],
    },

    solution: {
      answers: {
        concepto1: 'definicion3',
        concepto2: 'definicion4',
        concepto3: 'definicion2',
        concepto4: 'definicion1',
      },
    },
  },

  {
    activity_key: 'ordenar',
    type: 'ordering',
    title: 'Ordena el proceso',
    instructions:
      'Ordena los pasos desde la recopilación de información hasta la comprobación de resultados. Cada paso ubicado en su posición correcta vale 0,5 puntos.',
    score: 2,
    order_number: 4,

    public_config: {
      items: [
        {
          id: 'paso_decidir',
          text:
            'Analizar la información y decidir qué problema atender primero.',
        },
        {
          id: 'paso_comprobar',
          text:
            'Comprobar los resultados mediante indicadores y la experiencia de la ciudadanía.',
        },
        {
          id: 'paso_recopilar',
          text:
            'Recopilar reportes ciudadanos y datos del servicio.',
        },
        {
          id: 'paso_validar',
          text:
            'Validar y organizar la información recopilada.',
        },
      ],
    },

    solution: {
      ordered_ids: [
        'paso_recopilar',
        'paso_validar',
        'paso_decidir',
        'paso_comprobar',
      ],
    },
  },

  {
    activity_key: 'caso_practico',
    type: 'case_study',
    title: 'Decide cómo mejorar el servicio',
    instructions:
      'Lee el caso y selecciona una respuesta para cada pregunta. Cada acierto vale 1 punto.',
    score: 2,
    order_number: 5,

    public_config: {
      scenario:
        'Un municipio recibe reportes por teléfono, redes sociales y documentos en papel. La información está dispersa, las respuestas tardan y las personas no pueden consultar el estado de sus solicitudes. El municipio quiere crear una plataforma web para mejorar el servicio.',

      questions: [
        {
          id: 'caso1',
          text:
            '¿Qué acción permitiría mejorar el servicio más allá de digitalizar los formularios?',

          options: [
            {
              id: 'caso1_a',
              text:
                'Publicar los formularios en internet y conservar la misma organización del trabajo.',
            },
            {
              id: 'caso1_b',
              text:
                'Centralizar los reportes, asignar responsables y permitir consultar el estado de cada solicitud.',
            },
            {
              id: 'caso1_c',
              text:
                'Recibir reportes únicamente por redes sociales.',
            },
            {
              id: 'caso1_d',
              text:
                'Cambiar la apariencia de la página sin revisar los tiempos de atención.',
            },
          ],
        },

        {
          id: 'caso2',
          text:
            '¿Qué medida combinaría participación ciudadana e inclusión digital?',

          options: [
            {
              id: 'caso2_a',
              text:
                'Cerrar la atención presencial para que toda la población utilice internet.',
            },
            {
              id: 'caso2_b',
              text:
                'Solicitar opiniones únicamente al personal que desarrolla la plataforma.',
            },
            {
              id: 'caso2_c',
              text:
                'Consultar a diferentes grupos de ciudadanos y mantener canales de atención asistida.',
            },
            {
              id: 'caso2_d',
              text:
                'Publicar información sin permitir consultas ni sugerencias.',
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
        'No se encontró el módulo 1 asociado al curso 1.'
      );
    }

    // Crea solamente la tabla nueva si todavía no existe.
    // No modifica ni elimina las tablas existentes.
    await EvaluationActivity.sync();

    const result = await sequelize.transaction(
      async (transaction) => {
        // Evita que dos ejecuciones simultáneas de este
        // seeder creen la misma evaluación.
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

            // Es una evaluación de módulo.
            // No debe finalizar el curso ni emitir certificado.
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
        ? 'Evaluación integradora del módulo 1 creada correctamente.'
        : 'La evaluación integradora del módulo 1 ya estaba registrada.'
    );

    console.log(`ID: ${result.evaluation.id}`);
    console.log(`Título: ${result.evaluation.title}`);
    console.log('Curso: 1. Módulo: 1.');
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