import Question from "../models/Question.js";

// pick 5 questions from the topic
export async function pickQuizQuestions(userId, topic, mode = "normal") {
  const all = await Question.find({ topic });

  if (!all.length) return [];

  // shuffle
  const shuffled = [...all].sort(() => Math.random() - 0.5);

  // for MVP: always 5 questions (or less)
  const selected = shuffled.slice(0, 5);

  // remove correctIndex in response? (optional)
  return selected.map((q) => ({
    questionId: q.questionId,
    topic: q.topic,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: q.options,
    explanation: q.explanation, // you can keep or remove
  }));
}

// ✅ calculate score based on correctIndex in DB
export async function calculateScore(topic, answers) {
  const qIds = Object.keys(answers || {});
  if (!qIds.length) return { score: 0, wrongQuestionIds: [], total: 0, correctCount: 0 };

  const questions = await Question.find({ topic, questionId: { $in: qIds } });

  let correct = 0;
  const wrong = [];

  for (const q of questions) {
    const selectedIndex = Number(answers[q.questionId]);

    if (selectedIndex === q.correctIndex) {
      correct++;
    } else {
      wrong.push(q.questionId);
    }
  }

  const total = questions.length || qIds.length;
  const score = total ? Math.round((correct / total) * 100) : 0;

  return { score, wrongQuestionIds: wrong, total, correctCount: correct };
}
