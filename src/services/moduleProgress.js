const percent = (value) =>
  Math.max(
    0,
    Math.min(
      100,
      Number(value) || 0
    )
  );

const summarizeEvaluation = (
  evaluation,
  attempts
) => {
  const rows = evaluation
    ? attempts.filter(
        (row) =>
          Number(row.evaluationId) ===
          Number(evaluation.id)
      )
    : [];

  const scores = rows.map(
    (row) => percent(row.score)
  );

  return {
    id: evaluation?.id ?? null,

    title:
      evaluation?.title ??
      'Evaluación pendiente de registrar',

    attempts: rows.length,

    passed: rows.some(
      (row) => row.passed === true
    ),

    bestScore:
      scores.length > 0
        ? Math.max(...scores)
        : null,
  };
};

const buildModuleProgress = ({
  module,
  courseId,
  evaluationAttempts,
  allEvaluations,
  videoProgress,
  readings,
  readingCatalog,
}) => {
  const order = Number(
    module.order_number
  );

  const supported =
    Number(courseId) === 1 &&
    [1, 2, 3].includes(order);

  const topics = supported
    ? Array.from(
        {
          length:
            order === 1 ? 4 : 3,
        },
        (_, index) =>
          `${order}.${index + 1}`
      )
    : [];

  const moduleEvaluations =
    allEvaluations.filter(
      (evaluation) =>
        Number(evaluation.moduleId) ===
          Number(module.id) &&
        Number(evaluation.courseId) ===
          Number(courseId) &&
        !evaluation.is_final
    );

  const themeEvaluations = topics.map(
    (topic) => {
      const escapedTopic =
        topic.replace('.', '\\.');

      const pattern = new RegExp(
        `\\btema\\s*${escapedTopic}\\b`,
        'i'
      );

      const matches =
        moduleEvaluations.filter(
          (evaluation) =>
            pattern.test(
              evaluation.title
            )
        );

      const evaluation =
        matches.length === 1
          ? matches[0]
          : null;

      return {
        topic,

        ...summarizeEvaluation(
          evaluation,
          evaluationAttempts
        ),
      };
    }
  );

  const integrativePattern =
    new RegExp(
      `evaluaci[oó]n integradora del m[oó]dulo\\s+${order}\\b`,
      'i'
    );

  const integrators =
    moduleEvaluations.filter(
      (evaluation) =>
        integrativePattern.test(
          evaluation.title
        )
    );

  const integrative =
    summarizeEvaluation(
      integrators.length === 1
        ? integrators[0]
        : null,

      evaluationAttempts
    );

  const videos =
    module.Videos || [];

  const videoStates = videos.map(
    (video) =>
      videoProgress.find(
        (progress) =>
          Number(progress.videoId) ===
          Number(video.id)
      )
  );

  const completedVideos =
    videoStates.filter(
      (progress) =>
        progress?.is_completed === true
    ).length;

  const videoPercentage =
    videos.length > 0
      ? videoStates.reduce(
          (total, progress) =>
            total +
            (
              progress?.is_completed
                ? 100
                : percent(
                    progress?.percentage
                  )
            ),
          0
        ) / videos.length
      : 0;

  const readingTopics = topics.map(
    (topic) => {
      const urls =
        readingCatalog[topic] || [];

      const seen = new Set(
        readings
          .filter(
            (row) =>
              row.topicNumber === topic
          )
          .map((row) => row.url)
      );

      return {
        topic,

        total: urls.length,

        viewed: urls.filter(
          (url) => seen.has(url)
        ).length,
      };
    }
  );

  const totalReadings =
    readingTopics.reduce(
      (total, topic) =>
        total + topic.total,
      0
    );

  const viewedReadings =
    readingTopics.reduce(
      (total, topic) =>
        total + topic.viewed,
      0
    );

  const passedEvaluations =
    themeEvaluations.filter(
      (evaluation) =>
        evaluation.passed
    ).length;

  const completed =
    supported &&
    videos.length > 0 &&
    completedVideos === videos.length &&
    totalReadings > 0 &&
    viewedReadings === totalReadings &&
    passedEvaluations === topics.length &&
    integrative.passed;

  const readingPercentage =
    totalReadings > 0
      ? (
          viewedReadings /
          totalReadings
        ) * 100
      : 0;

  const evaluationPercentage =
    topics.length > 0
      ? (
          passedEvaluations /
          topics.length
        ) * 100
      : 0;

  const integrativePercentage =
    integrative.passed ? 100 : 0;

  const average = supported
    ? (
        videoPercentage +
        readingPercentage +
        evaluationPercentage +
        integrativePercentage
      ) / 4
    : videoPercentage;

  return {
    id: module.id,

    title: module.title,

    order,

    supported,

    progress: completed
      ? 100
      : Math.min(
          99,
          Math.floor(average)
        ),

    completed,

    totalVideos: videos.length,

    completedVideos,

    evaluations: themeEvaluations,

    passedEvaluations,

    evaluationAttempts:
      themeEvaluations.reduce(
        (total, evaluation) =>
          total + evaluation.attempts,
        0
      ),

    integrative,

    readings: {
      viewed: viewedReadings,
      total: totalReadings,
      topics: readingTopics,
    },
  };
};

module.exports = {
  buildModuleProgress,
};