import type {
  GenerateListeningInput,
  GeneratedListeningSet,
} from "@/features/ai-listening/schemas";

const scripts: Record<GenerateListeningInput["section"], string> = {
  1: "Receptionist: Good morning, Greenford Student Housing. How can I help you?\nStudent: Hello. I am calling about a room for September. I need somewhere quiet because I will be preparing for exams.\nReceptionist: Of course. We have a single room in Maple House. It is close to the library and the rent is one hundred and eighty pounds per week.\nStudent: Does that include electricity and internet?\nReceptionist: Electricity is included, but internet costs eight pounds per month. The room is available from the twelfth of September.\nStudent: Great. Could you spell the street name for me?\nReceptionist: Certainly. It is B-R-A-C-K-E-N Road. The nearest bus stop is outside the medical centre.",
  2: "Guide: Welcome to the Riverside Community Museum. Today I will explain the new layout. When you enter the main hall, the information desk is directly opposite the entrance. To your left is the temporary exhibition about local transport. The cafe is behind that exhibition, near the garden doors. If you continue straight ahead, you will reach the children's workshop room. Please note that the history gallery is closed this week because we are installing new lighting. Visitors who booked the architecture tour should meet beside the model bridge at eleven fifteen.",
  3: "Tutor: So, Maya and Daniel, tell me how your presentation on urban trees is developing.\nMaya: We first wanted to focus on air quality, but there is too much data, so we narrowed the topic to shade and public comfort.\nDaniel: Yes, and we found that people stay longer in squares where trees are placed near seating areas.\nTutor: That sounds promising. Be careful not to claim that trees alone improve mental health unless your evidence supports it.\nMaya: We can present that as a possible benefit, not a proven result.\nTutor: Good. Also, compare two case studies rather than describing five briefly.",
  4: "Lecturer: Today's lecture examines how sleep supports memory. For many years, researchers believed sleep was mainly a period of rest. More recent studies suggest that the brain remains highly active during certain stages of sleep. One important process is consolidation, in which recent experiences are reorganised and connected with older knowledge. This does not mean that studying while tired is effective. In fact, lack of sleep can reduce attention and make it harder to store information in the first place. The practical implication is clear: learners should treat sleep as part of study, not as time taken away from it.",
};

const baseQuestions: GeneratedListeningSet["questions"] = [
  {
    type: "form_completion",
    number: 1,
    prompt: "The room is in ______ House.",
    correctAnswer: "Maple",
    explanationZh: "接待员说 We have a single room in Maple House。",
    explanationEn: "The receptionist identifies the building as Maple House.",
  },
  {
    type: "form_completion",
    number: 2,
    prompt: "The rent is £______ per week.",
    correctAnswer: "180",
    explanationZh: "录音中说 the rent is one hundred and eighty pounds per week。",
    explanationEn: "The weekly rent is stated as one hundred and eighty pounds.",
  },
  {
    type: "sentence_completion",
    number: 3,
    prompt: "Internet costs £8 per ______.",
    correctAnswer: "month",
    explanationZh: "录音中说 internet costs eight pounds per month。",
    explanationEn: "The missing word is month.",
  },
  {
    type: "multiple_choice",
    number: 4,
    prompt: "When is the room available?",
    options: [
      "2 September",
      "12 September",
      "20 September",
      "22 September",
    ],
    correctAnswer: "12 September",
    explanationZh: "接待员说房间从 9 月 12 日可用。",
    explanationEn: "The room is available from the twelfth of September.",
  },
  {
    type: "form_completion",
    number: 5,
    prompt: "The street name is ______ Road.",
    correctAnswer: "Bracken",
    explanationZh: "街道拼写为 B-R-A-C-K-E-N。",
    explanationEn: "The spelled street name is Bracken.",
  },
  {
    type: "sentence_completion",
    number: 6,
    prompt: "The nearest bus stop is outside the ______ centre.",
    correctAnswer: "medical",
    explanationZh: "录音最后说 bus stop is outside the medical centre。",
    explanationEn: "The bus stop is outside the medical centre.",
  },
];

export function createMockListeningSet(
  input: GenerateListeningInput,
): GeneratedListeningSet {
  const questions = baseQuestions
    .filter((question) => input.questionTypes.includes(question.type))
    .slice(0, 6);

  return {
    title: `Section ${input.section}: Student services conversation`,
    section: input.section,
    topic: input.topic,
    script: scripts[input.section],
    questions: (questions.length >= 3 ? questions : baseQuestions).map(
      (question, index) => ({
        ...question,
        number: index + 1,
      }),
    ),
    vocabulary: [
      {
        word: "available",
        meaningZh: "可用的；可获得的",
        meaningEn: "ready for use or able to be obtained",
      },
      {
        word: "include",
        meaningZh: "包括",
        meaningEn: "to contain something as part of a whole",
      },
      {
        word: "nearest",
        meaningZh: "最近的",
        meaningEn: "closest in distance",
      },
    ],
  };
}
