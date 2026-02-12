import Attempt from "../models/Attempt.js";

import {
  getUserById,
  getAssetById,
  getActiveEnrollmentForUser,
  getPathForUserCourse,
} from "../services/dataStore.js";

import { pickQuizQuestions, calculateScore } from "../services/quiz.service.js";
import { updateUserStatsAndPath } from "../services/engine.service.js";

function ok(res, data) {
  return res.json({ ok: true, data });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ ok: false, message });
}

// ✅ GET QUIZ
export const getQuiz = async (req, res) => {
  try {
    const { userId } = req.params;
    const { topic, mode = "normal" } = req.query;

    if (!topic) return fail(res, "Missing topic in query (?topic=...)", 400);

    const user = await getUserById(userId);
    if (!user) return fail(res, `User not found: ${userId}`, 404);

    const questions = await pickQuizQuestions(userId, topic, mode);
    return ok(res, { topic, questions });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

// ✅ SUBMIT QUIZ (FIXED: saves Attempt + updates engine)
export const submitQuiz = async (req, res) => {
  try {
    const { userId } = req.params;

    const { courseId, assetId, topic, timeSpentMin, answers } = req.body;

    if (!assetId) return fail(res, "assetId missing in request body", 400);
    if (!topic) return fail(res, "topic missing in request body", 400);
    if (!answers || typeof answers !== "object") {
      return fail(res, "answers must be an object like {questionId: selectedIndex}", 400);
    }

    const user = await getUserById(userId);
    if (!user) return fail(res, `User not found: ${userId}`, 404);

    const asset = await getAssetById(assetId);
    if (!asset) {
      return fail(
        res,
        `Invalid assetId="${assetId}". Make sure it exists in Asset collection.`,
        400
      );
    }

    // Enrollment + Path (courseId is optional from frontend; use enrollment if missing)
    const enrollment = await getActiveEnrollmentForUser(userId);
    if (!enrollment) return fail(res, `No active enrollment for user: ${userId}`, 404);

    const realCourseId = courseId || enrollment.courseId;

    const path = await getPathForUserCourse(userId, realCourseId);
    if (!path) return fail(res, `Path not found for user ${userId} course ${realCourseId}`, 404);

    // ✅ score calculation
    const { score, wrongQuestionIds, total, correctCount } = await calculateScore(topic, answers);

    // ✅ time ratio
    const expected = Number(asset.expectedTimeMin || 10);
    const spent = Number(timeSpentMin || expected);
    const ratio = expected > 0 ? spent / expected : 1;

    // ✅ attemptNo (per user + topic)
    const attemptNo = (await Attempt.countDocuments({ userId, topic })) + 1;

    // ✅ store Attempt (this makes profiling real)
    const attemptDoc = await Attempt.create({
      attemptId: `att-${Date.now()}`,
      userId,
      courseId: realCourseId,
      pathId: path.pathId,
      assetId,
      topic,
      format: asset.format,
      assetDifficulty: asset.difficulty,
      timeSpentMin: spent,
      timeRatio: Number(ratio.toFixed(2)),
      askedQuestionIds: Object.keys(answers),
      wrongQuestionIds,
      score,
      attemptNo,
      createdAt: new Date(),
    });

    // ✅ update user stats + path resequencing
    const result = await updateUserStatsAndPath({
      userId,
      courseId: realCourseId,
      path,
      asset,
      topic,
      score,
      wrongQuestionIds,
      timeSpentMin: spent,
      timeRatio: ratio,
    });

    return ok(res, {
      score,
      correctCount,
      total,
      wrongQuestionIds,
      timeRatio: Number(ratio.toFixed(2)),
      attemptId: attemptDoc.attemptId,
      nextAssetId: result.nextAssetId,
      reason: result.reason,
      preferredFormat: result.preferredFormat,
      mastery: result.mastery,
      updatedPath: result.updatedPath,
    });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};
