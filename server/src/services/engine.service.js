// server/src/services/engine.service.js
// FULL UPDATED CODE — Seed-aligned + FAIL logic + PASS promotion/skip
//
// YOUR RULES (implemented):
// ✅ Fail Video  -> switch to Doc (same level)  [NOW becomes doc]
// ✅ Fail Doc    -> drop level (Advanced -> Intermediate -> Beginner) (prefer Video, else Doc) [NOW becomes lower level]
// ✅ Pass        -> continue forward
// ✅ Pass GOOD   -> go to NEXT LEVEL (Beginner->Intermediate->Advanced)
// ✅ Pass GREAT  -> skip the rest of CURRENT LEVEL for that topic, jump to NEXT LEVEL
//
// IMPORTANT: Uses asset.topic (DB) + freshPath.courseId (DB) to build exact IDs:
//   asset-<courseId>-<topic>-<level>-<format>
// and your Path.nodes already contains all these IDs from seed. So we MOVE nodes, not insert duplicates.

import User from "../models/User.js";
import Path from "../models/Path.js";
import Asset from "../models/Asset.js";
import Attempt from "../models/Attempt.js";

// --------- config ----------
const PASS_SCORE = 60;

// Promotion thresholds (tune freely)
const GOOD_SCORE = 80;  // "good" -> go next level
const GREAT_SCORE = 90; // "great" -> skip remaining of current level and jump
const GREAT_MAX_TIME_RATIO = 1.2;

const LEVELS = ["beginner", "intermediate", "advanced"];
function normLevel(lvl) {
  const s = String(lvl || "").trim().toLowerCase();
  const found = LEVELS.find((x) => x === s);
  return found || "beginner";
}
function lowerLevel(level) {
  const i = LEVELS.indexOf(normLevel(level));
  return i <= 0 ? "beginner" : LEVELS[i - 1];
}
function nextLevel(level) {
  const i = LEVELS.indexOf(normLevel(level));
  return i < 0 || i >= LEVELS.length - 1 ? normLevel(level) : LEVELS[i + 1];
}

// ---------- helpers ----------
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function normalizeFormatKey(format) {
  const f = (format || "").toLowerCase();
  if (f.includes("video")) return "video";
  if (f.includes("doc")) return "doc";
  if (f.includes("info")) return "infographic";
  if (f.includes("lab")) return "lab";
  return "doc";
}

// status helpers
const isCompleted = (s) => s === "completed" || s === "done";
const isSkipped = (s) => s === "skipped";
const isActionable = (s) => !isCompleted(s) && !isSkipped(s);

function normalizePathStatuses(path) {
  if (!path?.nodes) return;
  for (const n of path.nodes) {
    if (!n) continue;
    if (n.status === "unlocked" || n.status === "locked") n.status = "pending";
    if (!n.status) n.status = "pending";
  }
}

function getPreferredFormat(user) {
  const entries = Object.entries(user.format_stats || {});
  const withEnough = entries.filter(([_, v]) => (v?.attempts || 0) >= 2);
  const pool = withEnough.length ? withEnough : entries;
  pool.sort((a, b) => (b[1]?.avgScore || 0) - (a[1]?.avgScore || 0));
  return pool[0]?.[0] || "doc";
}

async function computeAvgTimeRatio(userId) {
  const attempts = await Attempt.find({ userId }).sort({ createdAt: -1 }).limit(10);
  const ratios = attempts
    .map((a) => Number(a.timeRatio))
    .filter((x) => Number.isFinite(x) && x > 0);

  if (!ratios.length) return 1;

  const avg = ratios.reduce((s, x) => s + x, 0) / ratios.length;
  return Math.max(0.7, Math.min(2.0, avg));
}

async function computeBaseETA(path) {
  const idx = Number(path.currentIndex ?? 0);

  const remainingIds = (path.nodes || [])
    .slice(idx)
    .filter((n) => n && isActionable(n.status))
    .map((n) => n.assetId);

  if (!remainingIds.length) return 0;

  const assets = await Asset.find({ assetId: { $in: remainingIds } });
  const map = new Map(assets.map((a) => [a.assetId, a]));

  return remainingIds.reduce((acc, id) => acc + (map.get(id)?.expectedTimeMin || 10), 0);
}

function moveNode(nodes, fromIdx, toIdx) {
  if (fromIdx < 0 || fromIdx >= nodes.length) return;
  const [node] = nodes.splice(fromIdx, 1);
  const safeTo = Math.max(0, Math.min(nodes.length, toIdx));
  nodes.splice(safeTo, 0, node);
}

function moveExistingNodeToIndex(freshPath, assetId, toIdx) {
  const nodes = freshPath.nodes || [];
  const i = nodes.findIndex((n) => n?.assetId === assetId);
  if (i === -1) return false;
  moveNode(nodes, i, toIdx);
  if (nodes[toIdx]) {
    nodes[toIdx].status = "pending"; // force actionable
    nodes[toIdx].addedBy = nodes[toIdx].addedBy || "engine";
  }
  return true;
}

function moveFailedAfter(freshPath, failedAssetId, anchorIdx) {
  const nodes = freshPath.nodes || [];
  const failedIdx = nodes.findIndex((n) => n?.assetId === failedAssetId);
  if (failedIdx < 0) return;
  const moveTo = anchorIdx + 1;
  if (failedIdx !== moveTo) moveNode(nodes, failedIdx, moveTo);
}

function computeNextAssetIdFrom(path) {
  const start = Number(path.currentIndex ?? 0);
  const nextNode = (path.nodes || [])
    .slice(start)
    .find((n) => n && isActionable(n.status));
  return nextNode?.assetId || null;
}

// Parse assetId shaped like: asset-<courseId>-<topic...>-<level>-<format>
function parseSeedAssetId(assetId) {
  const parts = String(assetId || "").split("-");
  if (parts.length < 5) return null;

  const format = parts[parts.length - 1];
  const level = parts[parts.length - 2];
  const courseId = parts[1];
  const topic = parts.slice(2, -2).join("-");

  return { courseId, topic, level, format };
}

function makeAssetId(courseId, topic, level, fmt) {
  return `asset-${courseId}-${topic}-${level}-${fmt}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
}

// Skip all remaining nodes of same (courseId, topic, level) after a given index
function skipRemainingLevelNodes(freshPath, courseId, topic, level, afterIdx) {
  const nodes = freshPath.nodes || [];
  for (let i = afterIdx + 1; i < nodes.length; i++) {
    const n = nodes[i];
    if (!n?.assetId) continue;
    const p = parseSeedAssetId(n.assetId);
    if (!p) continue;

    if (
      String(p.courseId) === String(courseId) &&
      String(p.topic) === String(topic) &&
      normLevel(p.level) === normLevel(level) &&
      isActionable(n.status)
    ) {
      n.status = "skipped";
      n.addedBy = n.addedBy || "engine";
    }
  }
}

// Find first pending assetId for (courseId, topic, level). Prefer video then doc, but fallback any.
function findFirstAssetIdForLevelInPath(freshPath, courseId, topic, level) {
  const nodes = freshPath.nodes || [];
  const wantedLevel = normLevel(level);

  // Pass 1: prefer video
  for (const n of nodes) {
    if (!n?.assetId || !isActionable(n.status)) continue;
    const p = parseSeedAssetId(n.assetId);
    if (!p) continue;
    if (String(p.courseId) === String(courseId) && String(p.topic) === String(topic) && normLevel(p.level) === wantedLevel && String(p.format) === "video") {
      return n.assetId;
    }
  }
  // Pass 2: doc
  for (const n of nodes) {
    if (!n?.assetId || !isActionable(n.status)) continue;
    const p = parseSeedAssetId(n.assetId);
    if (!p) continue;
    if (String(p.courseId) === String(courseId) && String(p.topic) === String(topic) && normLevel(p.level) === wantedLevel && String(p.format) === "doc") {
      return n.assetId;
    }
  }
  // Pass 3: any
  for (const n of nodes) {
    if (!n?.assetId || !isActionable(n.status)) continue;
    const p = parseSeedAssetId(n.assetId);
    if (!p) continue;
    if (String(p.courseId) === String(courseId) && String(p.topic) === String(topic) && normLevel(p.level) === wantedLevel) {
      return n.assetId;
    }
  }
  return null;
}

// ---------- MAIN ENGINE ----------
export async function updateUserStatsAndPath({
  userId,
  courseId, // not trusted here; we use freshPath.courseId from DB
  path,
  asset,
  topic, // not trusted for routing; we use asset.topic from DB if present
  score,
  wrongQuestionIds = [],
  timeSpentMin,
  timeRatio,
}) {
  // 1) Load user
  const user = await User.findOne({ userId });
  if (!user) throw new Error("User not found");

  // 2) Update format_stats
  const fmtKey = normalizeFormatKey(asset.format);
  if (!user.format_stats) user.format_stats = {};
  if (!user.format_stats[fmtKey]) user.format_stats[fmtKey] = { attempts: 0, avgScore: 0 };

  const stat = user.format_stats[fmtKey];
  const prevAttempts = stat.attempts || 0;
  const prevAvg = stat.avgScore || 0;

  stat.attempts = prevAttempts + 1;
  stat.avgScore = (prevAvg * prevAttempts + score) / stat.attempts;

  // 3) Mastery update (analytics only)
  if (!user.mastery_map) user.mastery_map = new Map();
  const masteryKey = asset?.topic || topic || "unknown";
  const oldM = Number(user.mastery_map.get(masteryKey) ?? 0.5);

  const struggling = score < PASS_SCORE || Number(timeRatio) > 1.8;
  const greatPass = score >= GREAT_SCORE && Number(timeRatio) <= GREAT_MAX_TIME_RATIO;
  const goodPass = score >= GOOD_SCORE;

  let delta = 0;
  if (struggling) delta = -0.2;
  else if (score >= 80 && Number(timeRatio) <= 1.2) delta = +0.15;
  else if (score >= 60) delta = +0.05;
  else delta = -0.05;

  user.mastery_map.set(masteryKey, clamp01(oldM + delta));

  const preferredFormat = getPreferredFormat(user);
  user.learning_style_preference = `${preferredFormat}_first`;
  await user.save();

  // 4) Load fresh path
  const freshPath = await Path.findOne({ pathId: path.pathId });
  if (!freshPath) throw new Error("Path not found");
  normalizePathStatuses(freshPath);

  const nodes = freshPath.nodes || [];
  const currentIndex = Number(freshPath.currentIndex ?? 0);

  // locate attempted node index
  let attemptedIdx = -1;
  if (nodes?.[currentIndex]?.assetId === asset.assetId) attemptedIdx = currentIndex;
  else attemptedIdx = nodes.findIndex((n) => n?.assetId === asset.assetId);
  if (attemptedIdx < 0) attemptedIdx = currentIndex;

  // canonical keys from DB
  const courseKey = String(freshPath.courseId || "").trim();
  const topicKey = String(asset?.topic || topic || "").trim();
  const levelNow = normLevel(asset.level);
  const formatNow = normalizeFormatKey(asset.format);

  // ---------------- PASS FLOW ----------------
  if (!struggling) {
    if (nodes?.[attemptedIdx]) nodes[attemptedIdx].status = "completed";

    // If GOOD/GREAT: jump to next level
    const up = nextLevel(levelNow);

    if ((goodPass || greatPass) && up !== levelNow && courseKey && topicKey) {
      // GREAT: skip remaining nodes of current level for this topic
      if (greatPass) {
        skipRemainingLevelNodes(freshPath, courseKey, topicKey, levelNow, attemptedIdx);
      }

      // Find a next-level node already present in path (prefer video)
      const targetId =
        findFirstAssetIdForLevelInPath(freshPath, courseKey, topicKey, up) ||
        // fallback: directly compute (seed IDs)
        makeAssetId(courseKey, topicKey, up, "video") ||
        makeAssetId(courseKey, topicKey, up, "doc");

      // Move it to NOW (right after attemptedIdx ideally)
      const insertAt = attemptedIdx + 1;
      const ok = moveExistingNodeToIndex(freshPath, targetId, insertAt);

      if (ok) {
        freshPath.currentIndex = insertAt;
        freshPath.nextAssetId = targetId;
        freshPath.lastUpdatedReason = greatPass
          ? `Great pass. Skipped remaining ${levelNow} and promoted to ${up}.`
          : `Good pass. Promoted to ${up}.`;
      } else {
        // If for some reason it isn't in nodes, just advance normally
        let nextIndex = Number(freshPath.currentIndex ?? 0);
        while (
          nextIndex < (nodes.length || 0) &&
          (isCompleted(nodes[nextIndex]?.status) || isSkipped(nodes[nextIndex]?.status))
        ) nextIndex++;
        freshPath.currentIndex = Math.min(nextIndex, nodes.length);
        freshPath.nextAssetId = computeNextAssetIdFrom(freshPath);
        freshPath.lastUpdatedReason = "Pass → continue forward (promotion target missing in path).";
      }
    } else {
      // Normal pass: continue forward
      let nextIndex = Number(freshPath.currentIndex ?? 0);
      while (
        nextIndex < (nodes.length || 0) &&
        (isCompleted(nodes[nextIndex]?.status) || isSkipped(nodes[nextIndex]?.status))
      ) nextIndex++;
      freshPath.currentIndex = Math.min(nextIndex, nodes.length);
      freshPath.nextAssetId = computeNextAssetIdFrom(freshPath);
      freshPath.lastUpdatedReason = "Pass → continue forward.";
    }
  }
  // ---------------- FAIL FLOW ----------------
  else {
    if (nodes?.[attemptedIdx]) nodes[attemptedIdx].status = "needs_review";

    let remediationId = null;
    let reason = "";

    if (!courseKey || !topicKey) {
      remediationId = null;
      reason = `Fail → cannot compute remediation (missing courseId/topic). courseId="${courseKey}" topic="${topicKey}"`;
    } else if (formatNow === "video") {
      // Fail Video → Doc (same level)
      remediationId = makeAssetId(courseKey, topicKey, levelNow, "doc");
      reason = `Fail Video → switch to Doc at ${levelNow}.`;
    } else {
      // Fail Doc → drop level (prefer video)
      const down = lowerLevel(levelNow);
      const candVideo = makeAssetId(courseKey, topicKey, down, "video");
      const candDoc = makeAssetId(courseKey, topicKey, down, "doc");

      // Prefer video; if it's not in path, fallback to doc
      remediationId = candVideo;
      reason = `Fail Doc → drop level (${levelNow} → ${down}).`;

      // If video isn't in nodes, we'll try doc below when move fails
      if (remediationId === asset.assetId) remediationId = candDoc;
    }

    if (remediationId) {
      const insertAt = attemptedIdx; // remediation becomes NOW

      // Try move remediation
      let ok = moveExistingNodeToIndex(freshPath, remediationId, insertAt);

      // If fail-doc drop-level video wasn't found, try doc fallback
      if (!ok && formatNow !== "video") {
        const down = lowerLevel(levelNow);
        const fallbackDoc = makeAssetId(courseKey, topicKey, down, "doc");
        ok = moveExistingNodeToIndex(freshPath, fallbackDoc, insertAt);
        if (ok) remediationId = fallbackDoc;
      }

      if (ok) {
        moveFailedAfter(freshPath, asset.assetId, insertAt);

        freshPath.currentIndex = insertAt;
        freshPath.nextAssetId = remediationId; // show immediately in UI
        freshPath.lastUpdatedReason = reason;
      } else {
        freshPath.currentIndex = attemptedIdx;
        freshPath.nextAssetId = asset.assetId;
        freshPath.lastUpdatedReason =
          `Engine wanted ${remediationId} but it is not present in path nodes. Check path creation (should include full seeded moduleAssetIds).`;
      }
    } else {
      freshPath.currentIndex = attemptedIdx;
      freshPath.nextAssetId = asset.assetId;
      freshPath.lastUpdatedReason = reason || "Fail → retry current module.";
    }
  }

  // If nextAssetId still missing, compute from currentIndex
  if (!freshPath.nextAssetId) {
    freshPath.nextAssetId = computeNextAssetIdFrom(freshPath);
  }

  // ETA
  const baseEta = await computeBaseETA(freshPath);
  const speedFactor = await computeAvgTimeRatio(userId);
  freshPath.etaMinutes = Math.round(baseEta * speedFactor);

  freshPath.updatedAt = new Date();
  await freshPath.save();

  return {
    nextAssetId: freshPath.nextAssetId,
    reason: freshPath.lastUpdatedReason,
    updatedPath: freshPath,
    preferredFormat,
    mastery: Number(user.mastery_map.get(masteryKey) ?? 0.5),
  };
}
