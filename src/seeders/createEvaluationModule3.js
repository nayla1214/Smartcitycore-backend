require('dotenv').config();

const {
  sequelize,
  Course,
  Module,
  Evaluation,
  EvaluationActivity,
} = require('../models');

const COURSE_ID = 1;
const MODULE_ID = 3;

const TITLE =
  'Evaluación integradora del módulo 3: Inteligencia Artificial y Aprendizaje';

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
            'La inteligencia artificial puede apoyar decisiones municipales, pero sus recomendaciones deben revisarse con datos confiables y responsabilidad humana.',
        },
        {
          id: 'vf2',
          text:
            'Una plataforma educativa es inteligente únicamente por reunir muchos videos, aunque no organice el aprendizaje ni permita consultar el avance.',
        },
        {
          id: 'vf3',
          text:
            'Un gemelo digital permite comparar escenarios antes de realizar cambios en la ciudad real.',
        },
        {
          id: 'vf4',
          text:
            'Una simulación siempre representa exactamente lo que ocurrirá, aunque utilice información incompleta o desactualizada.',
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
          id: 'confiables',
          text: 'confiables',
        },
        {
          id: 'seguimiento',
          text: 'seguimiento',
        },
        {
          id: 'decorativos',
          text: 'decorativos',
        },
        {
          id: 'publicidad',
          text: 'publicidad',
        },
      ],

      sentences: [
        {
          id: 'completar1',
          before:
            'Para que la IA apoye una decisión municipal, es necesario utilizar datos',
          after:
            'y comprobar que correspondan al problema.',
        },
        {
          id: 'completar2',
          before:
            'Una plataforma educativa que permite consultar las actividades completadas y los resultados facilita el',
          after: 'del aprendizaje.',
        },
      ],
    },

    solution: {
      answers: {
        completar1: 'confiables',
        completar2: 'seguimiento',
      },
    },
  },

  {
    activity_key: 'ia_responsable',
    type: 'case_study',
    title: 'Decide cómo utilizar la inteligencia artificial',
    instructions:
      'Lee el caso y selecciona una respuesta para cada pregunta. Cada acierto vale 1 punto.',
    score: 2,
    order_number: 3,

    public_config: {
      scenario:
        'Un municipio utiliza IA para priorizar el mantenimiento de calles. Algunos sectores tienen pocos reportes digitales porque sus habitantes encuentran dificultades para acceder a internet.',

      questions: [
        {
          id: 'ia1',
          text:
            '¿Qué debe revisar el municipio antes de utilizar la recomendación?',

          options: [
            {
              id: 'ia1_a',
              text:
                'Solo que la aplicación tenga una apariencia moderna.',
            },
            {
              id: 'ia1_b',
              text:
                'La cobertura, actualización y calidad de los datos, incluyendo información de sectores con pocos reportes digitales.',
            },
            {
              id: 'ia1_c',
              text:
                'Únicamente la cantidad total de reportes, sin revisar su origen.',
            },
            {
              id: 'ia1_d',
              text:
                'Solo las preferencias del proveedor tecnológico.',
            },
          ],
        },

        {
          id: 'ia2',
          text:
            'Si la recomendación no coincide con la experiencia de los vecinos, ¿qué corresponde hacer?',

          options: [
            {
              id: 'ia2_a',
              text:
                'Aplicarla sin revisión porque fue generada por IA.',
            },
            {
              id: 'ia2_b',
              text:
                'Dejar toda la responsabilidad al sistema.',
            },
            {
              id: 'ia2_c',
              text:
                'Eliminar los testimonios que contradigan la recomendación.',
            },
            {
              id: 'ia2_d',
              text:
                'Contrastar los datos con la realidad y la ciudadanía, y mantener la decisión bajo responsabilidad del personal competente.',
            },
          ],
        },
      ],
    },

    solution: {
      answers: {
        ia1: 'ia1_b',
        ia2: 'ia2_d',
      },
    },
  },

  {
    activity_key: 'educacion_inteligente',
    type: 'case_study',
    title: 'Mejora una plataforma de aprendizaje',
    instructions:
      'Lee el caso y selecciona una respuesta para cada pregunta. Cada acierto vale 1 punto.',
    score: 2,
    order_number: 4,

    public_config: {
      scenario:
        'Una plataforma municipal reúne recursos educativos, pero los participantes no saben qué estudiar después y tienen dificultades para reconocer su progreso. Algunos necesitan apoyo para usar las herramientas digitales.',

      questions: [
        {
          id: 'edu1',
          text:
            '¿Qué cambio atiende mejor la dificultad para continuar aprendiendo?',

          options: [
            {
              id: 'edu1_a',
              text:
                'Organizar una secuencia clara de contenidos y actividades, con indicaciones para avanzar.',
            },
            {
              id: 'edu1_b',
              text:
                'Agregar más archivos sin clasificarlos.',
            },
            {
              id: 'edu1_c',
              text:
                'Cambiar solamente los colores de la página.',
            },
            {
              id: 'edu1_d',
              text:
                'Ocultar las actividades pendientes.',
            },
          ],
        },

        {
          id: 'edu2',
          text:
            '¿Qué combinación favorece el seguimiento y la inclusión?',

          options: [
            {
              id: 'edu2_a',
              text:
                'Mostrar únicamente el número de visitas a la página.',
            },
            {
              id: 'edu2_b',
              text:
                'Ofrecer recursos solo para quienes ya dominan las herramientas digitales.',
            },
            {
              id: 'edu2_c',
              text:
                'Permitir consultar actividades y resultados, ofrecer retroalimentación y brindar acompañamiento a quienes lo necesitan.',
            },
            {
              id: 'edu2_d',
              text:
                'Publicar las notas sin explicar el resultado ni ofrecer apoyo.',
            },
          ],
        },
      ],
    },

    solution: {
      answers: {
        edu1: 'edu1_a',
        edu2: 'edu2_c',
      },
    },
  },

  {
    activity_key: 'caso_integrador',
    type: 'case_study',
    title: 'Compara alternativas antes de cambiar la ciudad',
    instructions:
      'Lee el caso y selecciona una respuesta para cada pregunta. Cada acierto vale 1 punto.',
    score: 2,
    order_number: 5,

    public_config: {
      scenario:
        'El municipio quiere modificar una ruta de autobús para atender nuevos barrios. Planea analizar datos con IA, comparar alternativas mediante un gemelo digital y capacitar al personal con una plataforma educativa. El cambio puede mejorar la cobertura, pero también aumentar los tiempos de viaje de pasajeros actuales.',

      questions: [
        {
          id: 'caso1',
          text:
            '¿Qué comparación permite evaluar mejor las alternativas de ruta?',

          options: [
            {
              id: 'caso1_a',
              text:
                'Comparar únicamente el color de los mapas de cada alternativa.',
            },
            {
              id: 'caso1_b',
              text:
                'Elegir la ruta con mayor presencia en redes sociales.',
            },
            {
              id: 'caso1_c',
              text:
                'Simular solo la alternativa propuesta sin revisar la ruta actual.',
            },
            {
              id: 'caso1_d',
              text:
                'Comparar la ruta actual y las alternativas con datos validados de demanda, horarios, tráfico, cobertura y tiempos de viaje.',
            },
          ],
        },

        {
          id: 'caso2',
          text:
            '¿Cómo conviene utilizar los resultados y preparar al personal?',

          options: [
            {
              id: 'caso2_a',
              text:
                'Ejecutar automáticamente la alternativa recomendada y omitir la capacitación.',
            },
            {
              id: 'caso2_b',
              text:
                'Revisar los resultados y sus límites con el personal y la comunidad, y ofrecer formación organizada con seguimiento del aprendizaje.',
            },
            {
              id: 'caso2_c',
              text:
                'Considerar que la simulación garantiza el resultado y cerrar los canales de consulta.',
            },
            {
              id: 'caso2_d',
              text:
                'Capacitar únicamente en el aspecto visual de la plataforma sin relacionarla con las decisiones municipales.',
            },
          ],
        },
      ],
    },

    solution: {
      answers: {
        caso1: 'caso1_d',
        caso2: 'caso2_b',
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
        'No se encontró el módulo 3 asociado al curso 1.'
      );
    }

    // Crea la tabla si todavía no existe.
    // No utiliza alter ni force.
    await EvaluationActivity.sync();

    const result = await sequelize.transaction(
      async (transaction) => {
        // Evita duplicados por ejecuciones simultáneas.
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

            // Evaluación de módulo, no final del curso.
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
        ? 'Evaluación integradora del módulo 3 creada correctamente.'
        : 'La evaluación integradora del módulo 3 ya estaba registrada.'
    );

    console.log(`ID: ${result.evaluation.id}`);
    console.log(`Título: ${result.evaluation.title}`);
    console.log('Curso: 1. Módulo: 3.');
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