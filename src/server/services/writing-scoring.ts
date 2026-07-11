export type WritingTaskType = 1 | 2;

export type WritingTaskSpecificStatus = "strong" | "needs_work" | "missing";

export type WritingTaskSpecificItem = {
  label: string;
  status: WritingTaskSpecificStatus;
  feedback?: string;
};

export type WritingTaskSpecificFeedbackForScoring = {
  task_type: "task1" | "task2";
  items: WritingTaskSpecificItem[];
};

export type WritingCriterionScores = {
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
};

export type WritingScoringInput = {
  taskType: WritingTaskType;
  wordCount: number;
  criteria: WritingCriterionScores;
  taskSpecificFeedback?: WritingTaskSpecificFeedbackForScoring | null;
};

export type WritingScoringResult = WritingCriterionScores & {
  overallBand: number;
  appliedCaps: string[];
};

export function calibrateWritingScores({
  taskType,
  wordCount,
  criteria,
  taskSpecificFeedback,
}: WritingScoringInput): WritingScoringResult {
  const minimumWords = getMinimumWordsForWritingTask(taskType);
  const underlengthCap = getUnderlengthCap(wordCount, minimumWords);
  const taskSpecificCaps = getTaskSpecificCaps(taskType, taskSpecificFeedback);
  const appliedCaps: string[] = [];

  let taskResponse = normalizeCriterionBand(criteria.taskResponse);
  let coherenceCohesion = normalizeCriterionBand(criteria.coherenceCohesion);
  let lexicalResource = normalizeCriterionBand(criteria.lexicalResource);
  let grammaticalRangeAccuracy = normalizeCriterionBand(
    criteria.grammaticalRangeAccuracy,
  );

  if (underlengthCap != null) {
    taskResponse = Math.min(taskResponse, underlengthCap);
    appliedCaps.push(
      taskType === 1
        ? "Task Achievement capped for underlength Task 1 response."
        : "Task Response capped for underlength Task 2 response.",
    );
  }

  if (taskSpecificCaps.taskResponseCap != null) {
    taskResponse = Math.min(taskResponse, taskSpecificCaps.taskResponseCap);
    appliedCaps.push(...taskSpecificCaps.reasons);
  }

  if (taskSpecificCaps.coherenceCap != null) {
    coherenceCohesion = Math.min(
      coherenceCohesion,
      taskSpecificCaps.coherenceCap,
    );
    appliedCaps.push(
      taskType === 1
        ? "Coherence capped because feature selection or reporting sequence is weak."
        : "Coherence capped because paragraphing or progression is weak.",
    );
  }

  if (taskSpecificCaps.lexicalCap != null) {
    lexicalResource = Math.min(lexicalResource, taskSpecificCaps.lexicalCap);
    appliedCaps.push(
      "Lexical Resource capped because precision, repetition, or word-choice accuracy is not supported by the evidence.",
    );
  }

  if (taskSpecificCaps.grammarCap != null) {
    grammaticalRangeAccuracy = Math.min(
      grammaticalRangeAccuracy,
      taskSpecificCaps.grammarCap,
    );
    appliedCaps.push(
      "Grammar capped because complex structures are not accurate enough to justify a higher band.",
    );
  }

  taskResponse = normalizeCriterionBand(taskResponse);
  coherenceCohesion = normalizeCriterionBand(coherenceCohesion);
  lexicalResource = normalizeCriterionBand(lexicalResource);
  grammaticalRangeAccuracy = normalizeCriterionBand(grammaticalRangeAccuracy);

  let overallBand = calculateOverallWritingBand({
    taskResponse,
    coherenceCohesion,
    lexicalResource,
    grammaticalRangeAccuracy,
  });

  if (taskResponse <= 5) {
    overallBand = Math.min(overallBand, 5.5);
    appliedCaps.push(
      taskType === 1
        ? "Overall band capped because Task Achievement is substantially limited."
        : "Overall band capped because Task Response is substantially limited.",
    );
  } else if (taskResponse <= 5.5) {
    overallBand = Math.min(overallBand, 6);
    appliedCaps.push(
      taskType === 1
        ? "Overall band capped because Task Achievement cannot support a higher overall score."
        : "Overall band capped because Task Response cannot support a higher overall score.",
    );
  }

  if (taskSpecificCaps.overallCap != null) {
    overallBand = Math.min(overallBand, taskSpecificCaps.overallCap);
    appliedCaps.push(...taskSpecificCaps.overallReasons);
  }

  return {
    taskResponse,
    coherenceCohesion,
    lexicalResource,
    grammaticalRangeAccuracy,
    overallBand,
    appliedCaps: Array.from(new Set(appliedCaps)),
  };
}

export function calculateOverallWritingBand(
  criteria: WritingCriterionScores,
) {
  const normalizedCriteria = [
    normalizeCriterionBand(criteria.taskResponse),
    normalizeCriterionBand(criteria.coherenceCohesion),
    normalizeCriterionBand(criteria.lexicalResource),
    normalizeCriterionBand(criteria.grammaticalRangeAccuracy),
  ];
  const rawAverage =
    normalizedCriteria.reduce((total, criterion) => total + criterion, 0) /
    normalizedCriteria.length;
  const minimumCriterion = Math.min(...normalizedCriteria);
  let overallBand = roundToNearestHalf(rawAverage);

  overallBand = Math.min(overallBand, minimumCriterion + 1);

  if (
    overallBand >= 8 &&
    (normalizedCriteria.some((criterion) => criterion < 7.5) ||
      normalizedCriteria.filter((criterion) => criterion >= 8).length < 3)
  ) {
    overallBand = 7.5;
  }

  return normalizeCriterionBand(overallBand);
}

export function normalizeCriterionBand(score: number) {
  return Math.min(9, Math.max(0, roundToNearestHalf(score)));
}

export function roundToNearestHalf(score: number) {
  return Math.round(score * 2) / 2;
}

export function getMinimumWordsForWritingTask(taskType: WritingTaskType) {
  return taskType === 1 ? 150 : 250;
}

export function getUnderlengthCap(
  wordCount: number,
  minimumWords: number,
) {
  if (wordCount >= minimumWords) {
    return null;
  }

  const ratio = wordCount / minimumWords;

  if (ratio < 0.4) {
    return 4.5;
  }

  if (ratio < 0.7) {
    return 5;
  }

  if (ratio < 0.9) {
    return 5.5;
  }

  return 6;
}

function getTaskSpecificCaps(
  taskType: WritingTaskType,
  taskSpecificFeedback?: WritingTaskSpecificFeedbackForScoring | null,
) {
  const result: {
    taskResponseCap: number | null;
    coherenceCap: number | null;
    lexicalCap: number | null;
    grammarCap: number | null;
    overallCap: number | null;
    reasons: string[];
    overallReasons: string[];
  } = {
    taskResponseCap: null,
    coherenceCap: null,
    lexicalCap: null,
    grammarCap: null,
    overallCap: null,
    reasons: [],
    overallReasons: [],
  };

  if (!taskSpecificFeedback?.items?.length) {
    return result;
  }

  const items = taskSpecificFeedback.items.map((item) => ({
    ...item,
    normalizedLabel: normalizeFeedbackLabel(item.label),
    normalizedFeedback: normalizeFeedbackLabel(item.feedback ?? ""),
  }));
  const missingCount = items.filter((item) => item.status === "missing").length;
  const severeNeedsWorkCount = items.filter(
    (item) =>
      item.status === "needs_work" &&
      isSevereTaskSpecificIssue(item, taskType),
  ).length;

  if (missingCount >= 2) {
    result.taskResponseCap = minCap(result.taskResponseCap, 5.5);
    result.reasons.push(
      taskType === 1
        ? "Task Achievement capped because multiple Task 1 requirements are missing."
        : "Task Response capped because multiple Task 2 requirements are missing.",
    );
  } else if (missingCount >= 1 && severeNeedsWorkCount >= 2) {
    result.taskResponseCap = minCap(result.taskResponseCap, 6);
    result.reasons.push(
      taskType === 1
        ? "Task Achievement capped because key Task 1 requirements are incomplete."
        : "Task Response capped because key Task 2 requirements are incomplete.",
    );
  }

  if (taskType === 1) {
    applyTask1Caps(items, result);
  } else {
    applyTask2Caps(items, result);
  }

  applyCrossCriterionCaps(items, result);

  return result;
}

function applyTask1Caps(
  items: Array<
    WritingTaskSpecificItem & {
      normalizedLabel: string;
      normalizedFeedback: string;
    }
  >,
  result: ReturnType<typeof getTaskSpecificCaps>,
) {
  const overview = findFeedbackItem(items, ["overview", "总览"]);
  const keyFeatures = findFeedbackItem(items, ["key features", "主要特征"]);
  const dataComparison = findFeedbackItem(items, [
    "data comparison",
    "数据比较",
  ]);
  const accuracy = findFeedbackItem(items, ["accuracy", "准确性"]);
  const objectiveReporting = findFeedbackItem(items, [
    "objective reporting",
    "客观描述",
  ]);

  if (overview?.status === "missing") {
    result.taskResponseCap = minCap(result.taskResponseCap, 5.5);
    result.reasons.push(
      "Task Achievement capped because the Task 1 overview is missing.",
    );
  } else if (isSevereTaskSpecificIssue(overview, 1)) {
    result.taskResponseCap = minCap(result.taskResponseCap, 6.5);
    result.reasons.push(
      "Task Achievement capped because the Task 1 overview is incomplete.",
    );
  }

  if (keyFeatures?.status === "missing") {
    result.taskResponseCap = minCap(result.taskResponseCap, 5.5);
    result.reasons.push(
      "Task Achievement capped because main features are not selected.",
    );
  }

  if (dataComparison?.status === "missing") {
    result.taskResponseCap = minCap(result.taskResponseCap, 6);
    result.reasons.push(
      "Task Achievement capped because data comparisons are missing.",
    );
  } else if (isSevereTaskSpecificIssue(dataComparison, 1)) {
    result.taskResponseCap = minCap(result.taskResponseCap, 6.5);
    result.overallCap = minCap(result.overallCap, 6.5);
    result.reasons.push(
      "Task Achievement capped because data comparisons are limited.",
    );
    result.overallReasons.push(
      "Overall band capped because Task 1 data comparison is still limited.",
    );
  }

  if (accuracy?.status === "missing") {
    result.taskResponseCap = minCap(result.taskResponseCap, 5.5);
    result.reasons.push(
      "Task Achievement capped because data accuracy is not reliable.",
    );
  } else if (isSevereTaskSpecificIssue(accuracy, 1)) {
    result.taskResponseCap = minCap(result.taskResponseCap, 6.5);
    result.reasons.push(
      "Task Achievement capped because some data descriptions are inaccurate or unclear.",
    );
  }

  if (objectiveReporting?.status === "missing") {
    result.taskResponseCap = minCap(result.taskResponseCap, 6);
    result.reasons.push(
      "Task Achievement capped because Task 1 includes subjective or unsupported information.",
    );
  }
}

function applyTask2Caps(
  items: Array<
    WritingTaskSpecificItem & {
      normalizedLabel: string;
      normalizedFeedback: string;
    }
  >,
  result: ReturnType<typeof getTaskSpecificCaps>,
) {
  const position = findFeedbackItem(items, ["position", "立场"]);
  const ideaDevelopment = findFeedbackItem(items, [
    "idea development",
    "观点展开",
  ]);
  const examples = findFeedbackItem(items, ["examples", "例子"]);
  const paragraphing = findFeedbackItem(items, ["paragraphing", "段落结构"]);
  const taskResponse = findFeedbackItem(items, [
    "task response",
    "任务回应",
  ]);

  if (position?.status === "missing") {
    result.taskResponseCap = minCap(result.taskResponseCap, 5.5);
    result.reasons.push(
      "Task Response capped because the Task 2 position is unclear or missing.",
    );
  } else if (isSevereTaskSpecificIssue(position, 2)) {
    result.taskResponseCap = minCap(result.taskResponseCap, 6.5);
    result.reasons.push(
      "Task Response capped because the Task 2 position is not clear enough for a higher band.",
    );
  }

  if (ideaDevelopment?.status === "missing") {
    result.taskResponseCap = minCap(result.taskResponseCap, 5.5);
    result.overallCap = minCap(result.overallCap, 6.5);
    result.reasons.push(
      "Task Response capped because ideas are not developed.",
    );
    result.overallReasons.push(
      "Overall band capped because Task 2 idea development is not sufficient for a higher score.",
    );
  } else if (isSevereTaskSpecificIssue(ideaDevelopment, 2)) {
    result.taskResponseCap = minCap(result.taskResponseCap, 6.5);
    result.coherenceCap = minCap(result.coherenceCap, 7);
    result.lexicalCap = minCap(result.lexicalCap, 7);
    result.overallCap = minCap(result.overallCap, 6.5);
    result.reasons.push(
      "Task Response capped because idea development is limited.",
    );
    result.overallReasons.push(
      "Overall band capped because Task 2 idea development is not sufficient for a higher score.",
    );
  }

  if (examples?.status === "missing") {
    result.taskResponseCap = minCap(result.taskResponseCap, 6);
    result.overallCap = minCap(result.overallCap, 6.5);
    result.reasons.push(
      "Task Response capped because support or examples are missing.",
    );
    result.overallReasons.push(
      "Overall band capped because Task 2 support or examples are missing.",
    );
  } else if (isSevereTaskSpecificIssue(examples, 2)) {
    result.taskResponseCap = minCap(result.taskResponseCap, 6.5);
    result.coherenceCap = minCap(result.coherenceCap, 7);
    result.lexicalCap = minCap(result.lexicalCap, 7);
    result.overallCap = minCap(result.overallCap, 6.5);
    result.reasons.push(
      "Task Response capped because examples are too general or weakly linked.",
    );
    result.overallReasons.push(
      "Overall band capped because Task 2 examples are too general or weakly linked.",
    );
  }

  if (paragraphing?.status === "missing") {
    result.coherenceCap = minCap(result.coherenceCap, 5.5);
  } else if (isSevereTaskSpecificIssue(paragraphing, 2)) {
    result.coherenceCap = minCap(result.coherenceCap, 6.5);
  }

  if (taskResponse?.status === "missing") {
    result.taskResponseCap = minCap(result.taskResponseCap, 5.5);
    result.reasons.push(
      "Task Response capped because the answer does not adequately answer the prompt.",
    );
  } else if (isSevereTaskSpecificIssue(taskResponse, 2)) {
    result.taskResponseCap = minCap(result.taskResponseCap, 6.5);
    result.overallCap = minCap(result.overallCap, 6.5);
    result.reasons.push(
      "Task Response capped because the answer does not fully address the prompt.",
    );
    result.overallReasons.push(
      "Overall band capped because Task 2 response to the prompt is still limited.",
    );
  }
}

function applyCrossCriterionCaps(
  items: Array<
    WritingTaskSpecificItem & {
      normalizedLabel: string;
      normalizedFeedback: string;
    }
  >,
  result: ReturnType<typeof getTaskSpecificCaps>,
) {
  const combinedFeedback = items
    .map((item) => item.normalizedFeedback)
    .join(" ");

  if (
    /mechanical|unclear progression|weak progression|poor progression|paragraph logic|逻辑混乱|机械/.test(
      combinedFeedback,
    )
  ) {
    result.coherenceCap = minCap(result.coherenceCap, 6.5);
  }

  if (
    /repetitive vocabulary|limited vocabulary|word choice|collocation|spelling|word form|词汇重复|搭配|拼写|词形/.test(
      combinedFeedback,
    )
  ) {
    result.lexicalCap = minCap(result.lexicalCap, 6.5);
  }

  if (
    /grammar errors|frequent errors|complex sentences.*error|sentence fragment|comma splice|subject-verb|articles|plural|tense|语法错误|复杂句|主谓|冠词|单复数|时态|句子残缺/.test(
      combinedFeedback,
    )
  ) {
    result.grammarCap = minCap(result.grammarCap, 6.5);
  }
}

function findFeedbackItem<
  T extends { normalizedLabel: string; normalizedFeedback: string },
>(items: T[], labels: string[]) {
  return items.find((item) =>
    labels.some((label) => item.normalizedLabel.includes(label)),
  );
}

function normalizeFeedbackLabel(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isSevereTaskSpecificIssue(
  item:
    | (WritingTaskSpecificItem & {
        normalizedFeedback: string;
      })
    | undefined,
  taskType: WritingTaskType,
) {
  if (!item) {
    return false;
  }

  if (item.status === "missing") {
    return true;
  }

  if (item.status !== "needs_work") {
    return false;
  }

  return getSevereTaskSpecificPattern(taskType).test(item.normalizedFeedback);
}

function getSevereTaskSpecificPattern(taskType: WritingTaskType) {
  const sharedChinese =
    "缺失|不足|不够|有限|泛泛|缺少|没有明确|没有具体例子|没有比较|主要问题";

  if (taskType === 1) {
    return new RegExp(
      [
        "missing",
        "limited",
        "not enough",
        "insufficient",
        "little comparison",
        "no clear comparison",
        "mostly describes without comparing",
        "does not compare",
        "major issue",
        "lacks",
        sharedChinese,
      ].join("|"),
      "i",
    );
  }

  return new RegExp(
    [
      "missing",
      "limited",
      "not enough",
      "insufficient",
      "underdeveloped",
      "too general",
      "lacks support",
      "no specific example",
      "does not fully address",
      "major issue",
      "unclear position",
      sharedChinese,
    ].join("|"),
    "i",
  );
}

function minCap(current: number | null, next: number) {
  return current == null ? next : Math.min(current, next);
}
