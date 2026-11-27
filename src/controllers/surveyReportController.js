const PDFDocument = require('pdfkit');
const fs = require('node:fs');
const path = require('node:path');

const {
  sequelize,
  Course,
  User,
} = require('../models');

const CourseSurvey = require('../models/CourseSurvey');

const LOGO_PATH = path.join(
  __dirname,
  '../assets/logo-smartcity-transparente.png'
);

const COLORS = {
  green: '#08715e',
  navy: '#17364c',
  muted: '#607385',
  border: '#dce7ed',
  soft: '#f3f8fb',
  mint: '#eaf6ef',
  white: '#ffffff',
};

const CURRENT_QUESTIONS = [
  {
    key: 'clarity',
    text: '¿Los contenidos del curso fueron claros y fáciles de comprender?',
  },
  {
    key: 'activities',
    text: '¿Las actividades y evaluaciones estuvieron relacionadas con los contenidos del curso?',
  },
  {
    key: 'usability',
    text: '¿La plataforma fue fácil de utilizar?',
  },
  {
    key: 'satisfaction',
    text: '¿Qué tan satisfecho/a estás con el curso?',
  },
];

const LEGACY_QUESTIONS = [
  {
    key: 'clarity',
    text: 'Los contenidos del curso fueron claros y fáciles de comprender.',
  },
  {
    key: 'resources',
    text: 'Los videos y las lecturas me ayudaron a aprender.',
  },
  {
    key: 'activities',
    text: 'Las actividades y evaluaciones estuvieron relacionadas con los contenidos.',
  },
  {
    key: 'usability',
    text: 'La plataforma fue fácil de utilizar.',
  },
  {
    key: 'usefulness',
    text: 'Lo aprendido será útil en mis estudios, trabajo o comunidad.',
  },
  {
    key: 'satisfaction',
    text: 'En general, estoy satisfecho/a con el curso.',
  },
];

const FREQUENCY = [
  'Nada',
  'Poco',
  'Moderadamente',
  'Bastante',
  'Mucho',
];

const SATISFACTION = [
  'Muy insatisfecho/a',
  'Insatisfecho/a',
  'Ni satisfecho/a ni insatisfecho/a',
  'Satisfecho/a',
  'Muy satisfecho/a',
];

const AGREEMENT = [
  'Totalmente en desacuerdo',
  'En desacuerdo',
  'Ni de acuerdo ni en desacuerdo',
  'De acuerdo',
  'Totalmente de acuerdo',
];

const RECOMMENDATIONS = {
  YES: 'Sí',
  MAYBE: 'Tal vez',
  NO: 'No',
};

const dateLabel = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return date.toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const positiveId = (value) => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    fail(400, 'El identificador no es válido.');
  }

  return id;
};

const isCurrent = (row) =>
  row.answers?._version === 2;

const labelsFor = (key, current) => {
  if (!current) {
    return AGREEMENT;
  }

  return key === 'satisfaction'
    ? SATISFACTION
    : FREQUENCY;
};

const validRating = (value) =>
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 5;

const contentWidth = (doc) =>
  doc.page.width -
  doc.page.margins.left -
  doc.page.margins.right;

const bottomLimit = (doc) =>
  doc.page.height -
  doc.page.margins.bottom -
  12;

function ensureSpace(doc, height) {
  if (doc.y + height > bottomLimit(doc)) {
    doc.addPage();
  }
}

function measureText(
  doc,
  text,
  {
    width = contentWidth(doc),
    font = 'Helvetica',
    size = 10,
    lineGap = 4,
  } = {}
) {
  doc.font(font).fontSize(size);

  return doc.heightOfString(
    String(text),
    {
      width,
      lineGap,
    }
  );
}

function heading(doc, text) {
  const width = contentWidth(doc);

  const height = measureText(doc, text, {
    width,
    font: 'Helvetica-Bold',
    size: 14,
    lineGap: 3,
  });

  ensureSpace(doc, height + 45);

  const x = doc.page.margins.left;
  const y = doc.y + 12;

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLORS.green)
    .text(text, x, y, {
      width,
      lineGap: 3,
    });

  doc.y += 14;
  doc.x = x;
}

function paragraph(doc, text) {
  const x = doc.page.margins.left;

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.navy)
    .text(String(text), x, doc.y, {
      width: contentWidth(doc),
      lineGap: 4,
    });

  doc.y += 10;
  doc.x = x;
}

function reportTitle(doc, title, courseName) {
  ensureSpace(doc, 115);

  doc
    .font('Helvetica-Bold')
    .fontSize(21)
    .fillColor(COLORS.navy)
    .text(
      title,
      doc.page.margins.left,
      doc.y,
      {
        width: contentWidth(doc),
        lineGap: 4,
      }
    );

  doc.y += 14;

  paragraph(doc, `Curso: ${courseName}`);
}

function questionBlock(
  doc,
  number,
  question,
  answer
) {
  const x = doc.page.margins.left;
  const width = contentWidth(doc);

  const textX = x + 44;
  const textWidth = width - 60;

  const questionHeight = measureText(
    doc,
    question,
    {
      width: textWidth,
      font: 'Helvetica-Bold',
      size: 10.5,
      lineGap: 3,
    }
  );

  const answerHeight = measureText(
    doc,
    answer,
    {
      width: textWidth,
      size: 10,
      lineGap: 4,
    }
  );

  const blockHeight =
    18 +
    questionHeight +
    12 +
    answerHeight +
    18;

  const pageCapacity =
    bottomLimit(doc) -
    doc.page.margins.top;

  // Los comentarios extensos continúan en otra página.
  if (blockHeight + 12 > pageCapacity) {
    ensureSpace(doc, 100);

    heading(doc, `${number}. ${question}`);
    paragraph(doc, answer);

    doc.y += 8;
    return;
  }

  ensureSpace(doc, blockHeight + 12);

  const y = doc.y;

  doc
    .roundedRect(
      x,
      y,
      width,
      blockHeight,
      9
    )
    .fillAndStroke(
      COLORS.soft,
      COLORS.border
    );

  doc
    .circle(
      x + 22,
      y + 25,
      12
    )
    .fill(COLORS.green);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.white)
    .text(
      String(number),
      x + 10,
      y + 19,
      {
        width: 24,
        align: 'center',
        lineBreak: false,
      }
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor(COLORS.navy)
    .text(
      question,
      textX,
      y + 18,
      {
        width: textWidth,
        lineGap: 3,
      }
    );

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.green)
    .text(
      answer,
      textX,
      y + 18 + questionHeight + 12,
      {
        width: textWidth,
        lineGap: 4,
      }
    );

  doc.x = x;
  doc.y = y + blockHeight + 12;
}

function informationCard(doc, entries) {
  const x = doc.page.margins.left;
  const width = contentWidth(doc);
  const innerWidth = width - 32;

  const measured = entries.map(
    ([label, value]) => {
      const text = `${label}: ${value}`;

      return {
        text,
        height: measureText(
          doc,
          text,
          {
            width: innerWidth,
            size: 10,
            lineGap: 4,
          }
        ),
      };
    }
  );

  const height =
    32 +
    measured.reduce(
      (sum, entry) =>
        sum + entry.height + 9,
      0
    );

  const pageCapacity =
    bottomLimit(doc) -
    doc.page.margins.top;

  if (height > pageCapacity) {
    entries.forEach(([label, value]) => {
      paragraph(doc, `${label}: ${value}`);
    });

    return;
  }

  ensureSpace(doc, height + 16);

  const y = doc.y;

  doc
    .roundedRect(x, y, width, height, 10)
    .fillAndStroke(
      COLORS.mint,
      COLORS.border
    );

  let cursor = y + 16;

  measured.forEach((entry) => {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.navy)
      .text(
        entry.text,
        x + 16,
        cursor,
        {
          width: innerWidth,
          lineGap: 4,
        }
      );

    cursor += entry.height + 9;
  });

  doc.x = x;
  doc.y = y + height + 16;
}

function writeResponse(doc, row, users) {
  const current = isCurrent(row);

  const questions = current
    ? CURRENT_QUESTIONS
    : LEGACY_QUESTIONS;

  const user = users.get(
    Number(row.userId)
  );

  heading(doc, 'Datos del participante');

  informationCard(doc, [
    [
      'Nombre',
      user?.name ||
        'Participante no disponible',
    ],
    [
      'Correo',
      user?.email || 'No disponible',
    ],
    [
      'Fecha de respuesta',
      dateLabel(row.createdAt),
    ],
    [
      'Formulario',
      current
        ? 'Encuesta actual de seis preguntas'
        : 'Versión anterior',
    ],
  ]);

  heading(doc, 'Respuestas de la encuesta');

  questions.forEach((question, index) => {
    const value =
      row.answers?.[question.key];

    const answer = validRating(value)
      ? `${
          labelsFor(
            question.key,
            current
          )[value - 1]
        } · ${value} de 5`
      : 'Sin respuesta';

    questionBlock(
      doc,
      index + 1,
      question.text,
      answer
    );
  });

  questionBlock(
    doc,
    questions.length + 1,
    '¿Recomendarías este curso a otras personas?',
    RECOMMENDATIONS[
      row.recommendation
    ] || 'Sin respuesta'
  );

  questionBlock(
    doc,
    questions.length + 2,
    '¿Qué fue lo que más te gustó del curso?',
    row.liked ||
      'No escribió un comentario.'
  );

  if (!current) {
    questionBlock(
      doc,
      questions.length + 3,
      '¿Qué aspectos del curso consideras que deberían mejorarse?',
      row.improvements ||
        'No escribió una sugerencia.'
    );
  }
}

function distributionRow(
  doc,
  label,
  count,
  total
) {
  const x = doc.page.margins.left;
  const width = contentWidth(doc);

  const labelWidth = 190;
  const countWidth = 95;
  const gap = 12;

  const barX = x + labelWidth + gap;
  const barWidth =
    width -
    labelWidth -
    countWidth -
    gap * 2;

  const percentage =
    total > 0
      ? (count / total) * 100
      : 0;

  const textHeight = measureText(
    doc,
    label,
    {
      width: labelWidth,
      size: 9,
      lineGap: 2,
    }
  );

  const rowHeight =
    Math.max(14, textHeight) + 12;

  ensureSpace(doc, rowHeight);

  const y = doc.y;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.navy)
    .text(label, x, y, {
      width: labelWidth,
      lineGap: 2,
    });

  doc
    .roundedRect(
      barX,
      y + 3,
      barWidth,
      8,
      4
    )
    .fill(COLORS.border);

  if (percentage > 0) {
    doc
      .rect(
        barX,
        y + 3,
        barWidth * (percentage / 100),
        8
      )
      .fill(COLORS.green);
  }

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.navy)
    .text(
      `${count} · ${percentage.toFixed(1)} %`,
      x + width - countWidth,
      y,
      {
        width: countWidth,
        align: 'right',
        lineBreak: false,
      }
    );

  doc.x = x;
  doc.y = y + rowHeight;
}

function writeSummary(
  doc,
  rows,
  current
) {
  const questions = current
    ? CURRENT_QUESTIONS
    : LEGACY_QUESTIONS;

  heading(
    doc,
    current
      ? 'Resultados de la versión actual'
      : 'Resultados de la versión anterior'
  );

  paragraph(
    doc,
    `Total de respuestas: ${rows.length}`
  );

  if (!rows.length) {
    paragraph(
      doc,
      'No hay respuestas de esta versión.'
    );

    return;
  }

  questions.forEach(
    (question, index) => {
      const values = rows
        .map(
          (row) =>
            row.answers?.[question.key]
        )
        .filter(validRating);

      const average =
        values.length > 0
          ? (
              values.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) / values.length
            ).toFixed(2)
          : null;

      ensureSpace(doc, 230);

      heading(
        doc,
        `${index + 1}. ${question.text}`
      );

      paragraph(
        doc,
        `Promedio: ${
          average === null
            ? 'Sin respuestas'
            : `${average} de 5`
        }`
      );

      labelsFor(
        question.key,
        current
      ).forEach((label, labelIndex) => {
        const count = values.filter(
          (value) =>
            value === labelIndex + 1
        ).length;

        distributionRow(
          doc,
          `${labelIndex + 1}. ${label}`,
          count,
          values.length
        );
      });

      doc.y += 12;
    }
  );

  ensureSpace(doc, 150);

  heading(
    doc,
    '¿Recomendarían el curso?'
  );

  Object.entries(
    RECOMMENDATIONS
  ).forEach(([value, label]) => {
    const count = rows.filter(
      (row) =>
        row.recommendation === value
    ).length;

    distributionRow(
      doc,
      label,
      count,
      rows.length
    );
  });

  doc.y += 12;
}

function buildPdf(
  title,
  course,
  rows,
  users,
  general
) {
  return new Promise(
    (resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',

        margins: {
          top: 115,
          bottom: 60,
          left: 45,
          right: 45,
        },

        info: {
          Title: title,
          Author: 'SMARTCITYCORE',
        },
      });

      const chunks = [];
      let pageNumber = 0;

      // Se lee una sola vez por reporte.
      const logo = fs.existsSync(LOGO_PATH)
        ? fs.readFileSync(LOGO_PATH)
        : null;

      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(
          Buffer.concat(chunks)
        );
      });

      doc.on('error', reject);

      const drawPage = () => {
        pageNumber += 1;

        const savedX = doc.x;
        const savedY = doc.y;

        const x =
          doc.page.margins.left;

        const width =
          contentWidth(doc);

        doc.save();

        doc
          .rect(
            0,
            0,
            doc.page.width,
            7
          )
          .fill(COLORS.green);

        if (logo) {
          doc.image(
            logo,
            x,
            22,
            {
              fit: [62, 62],
              align: 'center',
              valign: 'center',
            }
          );
        }

        const titleX = logo
          ? x + 78
          : x;

        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .fillColor(COLORS.green)
          .text(
            'SMARTCITYCORE',
            titleX,
            31,
            {
              lineBreak: false,
            }
          );

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(COLORS.muted)
          .text(
            'Gestión de recursos educativos',
            titleX,
            57,
            {
              lineBreak: false,
            }
          );

        doc
          .moveTo(x, 94)
          .lineTo(x + width, 94)
          .lineWidth(1)
          .stroke(COLORS.border);

        const footerY = doc.page.height - 38;

// Permite dibujar el pie sin provocar otra página.
const originalBottomMargin =
  doc.page.margins.bottom;

try {
  doc.page.margins.bottom = 0;

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      'SMARTCITYCORE · Reporte de encuesta',
      x,
      footerY,
      {
        width: width - 90,
        lineBreak: false,
      }
    );

  doc.text(
    `Página ${pageNumber}`,
    doc.page.width - 110,
    footerY,
    {
      width: 65,
      align: 'right',
      lineBreak: false,
    }
  );
} finally {
  doc.page.margins.bottom =
    originalBottomMargin;
}
        doc.restore();

        doc.x = savedX;
        doc.y = savedY;
      };

      doc.on(
        'pageAdded',
        drawPage
      );

      try {
        drawPage();

        reportTitle(
          doc,
          title,
          course.name
        );

        paragraph(
          doc,
          `Fecha de generación: ${
            dateLabel(new Date())
          }`
        );

        if (general) {
          heading(
            doc,
            'Resumen de participación'
          );

          informationCard(doc, [
            [
              'Participantes que respondieron',
              String(rows.length),
            ],
            [
              'Encuestas de la versión actual',
              String(
                rows.filter(
                  isCurrent
                ).length
              ),
            ],
            [
              'Encuestas de versiones anteriores',
              String(
                rows.filter(
                  (row) =>
                    !isCurrent(row)
                ).length
              ),
            ],
          ]);

          paragraph(
            doc,
            'Este reporte incluye todas las respuestas registradas para el curso. Las versiones de la encuesta se presentan por separado.'
          );

          paragraph(
            doc,
            'Los resultados expresan la opinión de quienes respondieron y no equivalen a una calificación del aprendizaje.'
          );

          writeSummary(
            doc,
            rows.filter(isCurrent),
            true
          );

          const legacy =
            rows.filter(
              (row) =>
                !isCurrent(row)
            );

          if (legacy.length > 0) {
            doc.addPage();

            writeSummary(
              doc,
              legacy,
              false
            );
          }

          for (const row of rows) {
            doc.addPage();

            reportTitle(
              doc,
              'Detalle individual de encuesta',
              course.name
            );

            writeResponse(
              doc,
              row,
              users
            );
          }
        } else {
          writeResponse(
            doc,
            rows[0],
            users
          );
        }

        doc.end();
      } catch (error) {
        doc.destroy();
        reject(error);
      }
    }
  );
}

async function sendReport(
  req,
  res,
  individual
) {
  try {
    if (
      req.user?.role !== 'ADMIN'
    ) {
      fail(
        403,
        'Solo el administrador tutor puede descargar estos reportes.'
      );
    }

    const courseId =
      positiveId(
        req.params.courseId
      );

    const surveyId = individual
      ? positiveId(
          req.params.surveyId
        )
      : null;

    const snapshot =
      await sequelize.transaction(
        {
          isolationLevel:
            'REPEATABLE READ',
        },

        async (transaction) => {
          const course =
            await Course.findByPk(
              courseId,
              {
                attributes: [
                  'id',
                  'name',
                ],
                transaction,
              }
            );

          if (!course) {
            fail(
              404,
              'Curso no encontrado.'
            );
          }

          const rows =
            await CourseSurvey.findAll({
              where: {
                courseId,

                ...(individual
                  ? { id: surveyId }
                  : {}),
              },

              order: [
                [
                  'createdAt',
                  'ASC',
                ],
                ['id', 'ASC'],
              ],

              raw: true,
              transaction,
            });

          if (!rows.length) {
            fail(
              404,
              individual
                ? 'Encuesta no encontrada en este curso.'
                : 'Este curso todavía no tiene encuestas respondidas.'
            );
          }

          const userIds = [
            ...new Set(
              rows.map(
                (row) => row.userId
              )
            ),
          ];

          const users =
            await User.findAll({
              where: {
                id: userIds,
              },

              attributes: [
                'id',
                'name',
                'email',
              ],

              raw: true,
              transaction,
            });

          return {
            course: course.get({
              plain: true,
            }),
            rows,
            users,
          };
        }
      );

    const usersById =
      new Map(
        snapshot.users.map(
          (user) => [
            Number(user.id),
            user,
          ]
        )
      );

    const title = individual
      ? 'Reporte individual de encuesta'
      : 'Reporte general de encuestas';

    const buffer =
      await buildPdf(
        title,
        snapshot.course,
        snapshot.rows,
        usersById,
        !individual
      );

    const filename = individual
      ? `encuesta-curso-${courseId}-respuesta-${surveyId}.pdf`
      : `encuestas-curso-${courseId}-general.pdf`;

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    res.setHeader(
      'Cache-Control',
      'no-store'
    );

    return res.send(buffer);
  } catch (error) {
    if (!error.status) {
      console.error(
        'Error generando reporte de encuesta:',
        error
      );
    }

    return res
      .status(error.status || 500)
      .json({
        message: error.status
          ? error.message
          : 'No se pudo generar el reporte.',
      });
  }
}

module.exports = {
  getGeneralSurveyReport:
    (req, res) =>
      sendReport(
        req,
        res,
        false
      ),

  getIndividualSurveyReport:
    (req, res) =>
      sendReport(
        req,
        res,
        true
      ),
};