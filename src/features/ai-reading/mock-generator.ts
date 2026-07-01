import type {
  GenerateReadingInput,
  GeneratedReadingSet,
} from "@/features/ai-reading/schemas";

const topicTitles: Record<GenerateReadingInput["topic"], string> = {
  education: "How feedback is changing modern classrooms",
  technology: "The quiet redesign of urban learning",
  environment: "Measuring the value of restored wetlands",
  science: "Why small discoveries alter large systems",
  business: "The hidden cost of instant decisions",
  health: "Rethinking prevention in public health",
  medicine: "How diagnostic habits shape patient care",
  history: "What archives reveal about ordinary cities",
  psychology: "The science of attention in busy places",
  culture: "How local museums rebuild civic memory",
  travel: "Why slower journeys can change destination choices",
  random: "The quiet redesign of urban learning",
};

const paragraphMap = {
  A: "For much of the twentieth century, progress in education was measured by visible inputs: the size of a school, the number of books in a library, or the amount of time a teacher spent at the front of a classroom. Those measures were convenient, but they often missed the less obvious conditions that help learners improve. In recent years, a different model has begun to appear in large cities. It treats learning as a network of short feedback loops rather than a single event that happens inside one institution.",
  B: "The first shift was caused by the spread of affordable digital tools. Students could record lectures, compare explanations, and revisit difficult ideas without waiting for the next lesson. Yet the most important effect was not speed. Digital tools made mistakes easier to notice. A learner who repeatedly selected the same wrong answer could see a pattern, and a teacher could respond to that pattern before it became a permanent weakness.",
  C: "This change has also affected public spaces. Libraries, community centres, and even transport hubs have started to host small learning programmes. These programmes rarely replace formal classes, but they extend them. A teenager preparing for an examination may use a library workshop to practise academic reading, then use an online platform to receive comments on writing. The boundary between school and independent study becomes less rigid.",
  D: "Critics argue that the new model can exaggerate independence. They point out that not every student has the confidence to choose useful materials, and not every family can evaluate the quality of online advice. Without careful guidance, flexible learning may simply give more advantages to students who are already well supported. For this reason, several cities now train mentors to help learners interpret data rather than merely collect it.",
  E: "The most promising systems combine automation with human judgement. Software can identify that a student struggles with inference questions, but a mentor can ask why the student misread the passage. Perhaps the problem is vocabulary, or perhaps it is a habit of relying on background knowledge instead of textual evidence. The distinction matters because each weakness requires a different response.",
  F: "Urban learning networks are still developing, and their long-term impact remains uncertain. However, they have already changed the language of improvement. Instead of asking whether a student has completed a course, educators increasingly ask what the student has learned from recent errors. That question is smaller, but it may be more useful. It encourages learners to treat progress as a sequence of adjustments rather than a final score.",
};

const defaultQuestions: GeneratedReadingSet["questions"] = [
  {
    type: "matching_headings",
    number: 1,
    prompt: "Choose the correct heading for paragraph B.",
    options: [
      "i. A debate about public funding",
      "ii. Technology that made errors more visible",
      "iii. The decline of traditional schools",
      "iv. A method for training city planners",
    ],
    correctAnswer: "ii",
    explanationZh:
      "B 段重点说数字工具让学生和老师更容易发现错误模式，所以答案是 ii。",
    explanationEn:
      "Paragraph B focuses on digital tools making repeated mistakes easier to detect.",
    synonyms: ["shift = change", "notice = detect", "pattern = repeated behaviour"],
  },
  {
    type: "true_false_not_given",
    number: 2,
    prompt:
      "Digital tools completely removed the need for teachers in large cities.",
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    correctAnswer: "FALSE",
    explanationZh:
      "文章说工具帮助老师更早回应错误，并没有说老师不再需要。",
    explanationEn:
      "The passage says teachers can respond earlier; it does not say teachers are unnecessary.",
    synonyms: ["removed = eliminated", "need = requirement"],
  },
  {
    type: "multiple_choice",
    number: 3,
    prompt:
      "According to paragraph C, what role do libraries and community centres often play?",
    options: [
      "They replace formal classes.",
      "They extend formal learning opportunities.",
      "They examine students for official qualifications.",
      "They prevent students from using online platforms.",
    ],
    correctAnswer: "They extend formal learning opportunities.",
    explanationZh:
      "C 段明确说这些项目 rarely replace formal classes, but they extend them。",
    explanationEn:
      "Paragraph C states that these programmes rarely replace formal classes but extend them.",
    synonyms: ["extend = broaden", "formal classes = school-based lessons"],
  },
  {
    type: "sentence_completion",
    number: 4,
    prompt:
      "Some cities train mentors to help learners interpret ______ rather than merely collect it.",
    correctAnswer: "data",
    explanationZh:
      "D 段最后一句提到 mentors help learners interpret data rather than merely collect it。",
    explanationEn:
      "The answer is taken directly from the final sentence of paragraph D.",
    synonyms: ["interpret = make sense of", "merely = only"],
  },
  {
    type: "short_answer",
    number: 5,
    prompt:
      "What type of questions might software identify as a weakness for a student?",
    correctAnswer: "inference questions",
    explanationZh:
      "E 段举例说软件可以识别学生在 inference questions 上有困难。",
    explanationEn:
      "Paragraph E gives inference questions as the example weakness software can identify.",
    synonyms: ["struggles with = has difficulty with"],
  },
  {
    type: "gap_filling",
    number: 6,
    prompt:
      "Educators increasingly ask what a student has learned from recent ______.",
    correctAnswer: "errors",
    explanationZh:
      "F 段倒数第二句说 educators increasingly ask what the student has learned from recent errors。",
    explanationEn:
      "The missing word is found in paragraph F: recent errors.",
    synonyms: ["errors = mistakes", "increasingly = more and more"],
  },
];

export function createMockReadingSet(
  input: GenerateReadingInput,
): GeneratedReadingSet {
  const title = topicTitles[input.topic];
  const passage = Object.entries(paragraphMap)
    .map(([label, text]) => `${label}. ${text}`)
    .join("\n\n");
  const selectedQuestions = defaultQuestions
    .filter((question) => input.questionTypes.includes(question.type))
    .slice(0, 6);
  const questions =
    selectedQuestions.length >= 3 ? selectedQuestions : defaultQuestions.slice(0, 6);

  return {
    title,
    topic: input.topic,
    band: input.band,
    lengthWords: input.lengthWords,
    passage,
    questions: questions.map((question, index) => ({
      ...question,
      number: index + 1,
    })),
    vocabulary: [
      {
        word: "feedback loop",
        meaningZh: "反馈循环",
        meaningEn: "a process in which results are used to improve later actions",
        example:
          "Short feedback loops helped students correct mistakes before the final exam.",
      },
      {
        word: "inference",
        meaningZh: "推断",
        meaningEn: "a conclusion based on evidence rather than a direct statement",
        example:
          "Many IELTS reading questions test inference rather than simple word matching.",
      },
      {
        word: "rigid",
        meaningZh: "僵化的；不灵活的",
        meaningEn: "not flexible or easy to change",
        example:
          "The boundary between school and independent study became less rigid.",
      },
    ],
  };
}
