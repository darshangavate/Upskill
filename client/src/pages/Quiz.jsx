import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./quiz.css";
import { formatTitle } from "../utils/formatTitle";
import { getActiveUserId } from "../utils/activeUser";


export default function Quiz() {
  const nav = useNavigate();
  const location = useLocation();

  // If coming from Dashboard/Path button, these exist:
  const stateUserId = location.state?.userId;
  const stateAssetId = location.state?.assetId;
  const stateTopic = location.state?.topic;
  const stateTimeSpentMin = location.state?.timeSpentMin; // ✅ from Asset page
  const [timeSpentMin, setTimeSpentMin] = useState(stateTimeSpentMin || null);

  // For sidebar access (no state), use active user:
  const [userId, setUserId] = useState(stateUserId || getActiveUserId());
  const [topic, setTopic] = useState(stateTopic || "");
  const [assetId, setAssetId] = useState(stateAssetId || "");

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // {questionId: selectedIndex}

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // backend response
  const [nextUrl, setNextUrl] = useState(null); // resolved from dashboard/assetIndex

  async function hydrateFromDashboardIfMissing() {
    if (topic && assetId) return;

    const dash = await api.getDashboard(userId);
    const next = dash?.nextAsset;
    if (!next) throw new Error("No next asset found. Go to dashboard and refresh.");

    setTopic(next.topic);
    setAssetId(next.assetId);
  }

  async function loadQuiz() {
    try {
      setLoading(true);
      setErr("");
      setResult(null);
      setNextUrl(null);

      await hydrateFromDashboardIfMissing();

      // topic might have just been set, so fetch dash and pick final values
      const dash = await api.getDashboard(userId);
      const next = dash?.nextAsset;

      const finalTopic = stateTopic || topic || next?.topic;
      const finalAssetId = stateAssetId || assetId || next?.assetId;

      if (!finalTopic) throw new Error("Topic missing. Go to dashboard and start from there.");
      if (!finalAssetId) throw new Error("Asset missing. Go to dashboard and start from there.");

      setTopic(finalTopic);
      setAssetId(finalAssetId);

      const quizRes = await api.getQuiz(userId, finalTopic);
      setQuestions(quizRes.questions || []);
      setAnswers({});
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line
  }, [userId]);

  const canSubmit = useMemo(() => {
    if (!questions.length) return false;
    return Object.keys(answers).length > 0;
  }, [questions, answers]);

  function choose(qid, idx) {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  }

  async function resolveNextUrl(nextAssetId) {
    try {
      const dash = await api.getDashboard(userId);
      const a = dash?.assetIndex?.[nextAssetId];
      return a?.url || a?.link || null;
    } catch {
      return null;
    }
  }

  async function submit() {
    try {
      setSubmitting(true);
      setErr("");

      if (!topic || !assetId) throw new Error("Missing topic/asset. Go back to dashboard and retry.");
      if (!Object.keys(answers).length) throw new Error("Answer at least 1 question.");

      const payload = {
  assetId,
  topic,
  timeSpentMin: Number(timeSpentMin || 20),
  answers,
};


      const res = await api.submitQuiz(userId, payload);

      // show correct next asset from backend
      setResult(res);

      // best effort resolve next URL for "Open NEXT"
      if (res?.nextAssetId) {
        const url = await resolveNextUrl(res.nextAssetId);
        setNextUrl(url);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openNext() {
  if (!result?.nextAssetId) return;
  nav(`/asset/${result.nextAssetId}`, { state: { userId } });
}


  if (loading) return <div className="ss-page ss-center">Loading quiz…</div>;

  return (
    <>
      {/* SIDEBAR (self-contained, no AppShell) */}
      {/* <aside className="ss-sidebar">
        <div className="ss-brand" onClick={() => nav("/")} role="button" tabIndex={0}>
          <div className="ss-logo">⚡</div>
          <div className="ss-brand-text">
            <div className="ss-brand-name">SkillStream</div>
          </div>
        </div>

        <div className="ss-subtitle">Dynamic Upskilling Engine</div>

        <nav className="ss-nav">
          <button className="ss-navitem" onClick={() => nav("/")}>
            <span className="ss-ico">●</span> Dashboard
          </button>
          <button className="ss-navitem" onClick={() => nav("/catalog")}>
            <span className="ss-ico">▦</span> Catalog
          </button>
          <button className="ss-navitem" onClick={() => nav("/path")}>
            <span className="ss-ico">⧉</span> My Path
          </button>
          <button className="ss-navitem active" onClick={() => nav("/quiz")}>
            <span className="ss-ico">☑</span> Quiz
          </button>
          <button className="ss-navitem" onClick={() => nav("/debug")}>
            <span className="ss-ico">≡</span> Debug (Admin)
          </button>
        </nav>

        <div className="ss-sidebottom">
          <div className="ss-user">
            <div className="ss-useravatar">{(userId === "u-emp-02" ? "N" : "A")}</div>
            <div className="ss-usertext">
              <div className="ss-username">{userId === "u-emp-02" ? "Neha Patil" : "Aarav Sharma"}</div>
              <div className="ss-userrole">Learner</div>
            </div>
            <div className="ss-usercaret">▾</div>
          </div>
        </div>
      </aside> */}

      {/* TOPBAR */}
      <div className="ss-topbar">
          <button className="ss-course">
            <span className="ss-course-name">Quiz</span>
            <span className="ss-course-caret">▾</span>
          </button>

          <div className="ss-topright">
            <span className="ss-dot" />
            <span className="ss-toptext">Connected</span>
            <span className="ss-sep">|</span>
            <span className="ss-toptext">Updated just now</span>

            <button className="ss-iconbtn" onClick={loadQuiz} title="Refresh Quiz">
              ↻
            </button>

            <div className="ss-miniavatar">{userId === "u-emp-02" ? "N" : "A"}</div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="quiz-wrap">
          <div className="quiz-header">
            <div>
              <div className="quiz-h1">Quiz</div>
              <div className="quiz-sub">
                Topic: <span className="pill muted">{topic || "—"}</span>{" "}
                <span className="sep">•</span> Asset: <span className="pill muted">{assetId || "—"}</span>
              </div>
            </div>

            <div className="quiz-controls">
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className="select">
                <option value="u-emp-01">Aarav Sharma</option>
                <option value="u-emp-02">Neha Patil</option>
              </select>
              <button className="btn" onClick={() => nav(-1)}>← Back</button>
            </div>
          </div>

          {err ? <div className="err">{err}</div> : null}

          {/* RESULT */}
          {result ? (
            <section className="ss-card">
              <div className="ss-cardtitle">Result</div>

              <div className="result-grid">
                <div className="result-row">
                  <div className="result-label">Score</div>
                  <div className="result-val">
                    {result.score} <span className="result-muted">(Correct {result.correctCount}/{result.total})</span>
                  </div>
                </div>

                <div className="result-row">
                  <div className="result-label">Time ratio</div>
                  <div className="result-val">{result.timeRatio}</div>
                </div>

                <div className="result-row">
                  <div className="result-label">Next asset</div>
                  <div className="result-val">{result.nextAssetId || "—"}</div>
                </div>

                {result.reason ? <div className="reason">{result.reason}</div> : null}
              </div>

              <div className="actions">
                <button className="btn primary" onClick={openNext} disabled={!result?.nextAssetId}>
                  Open NEXT asset
                </button>
                <button className="btn" onClick={loadQuiz}>Try Again</button>
                <button className="btn ghost" onClick={() => nav("/")}>Go to Dashboard</button>
              </div>
            </section>
          ) : (
            /* QUESTIONS */
            <section className="ss-card">
              <div className="ss-cardtitle">Questions</div>

              {!questions.length ? (
                <div className="muted">No questions found for this topic. Seed questions for “{topic}”.</div>
              ) : (
                <div className="q-list">
                  {questions.map((q, idx) => (
                    <div key={q.questionId} className="q-card">
                      <div className="q-title">
                        {idx + 1}. {q.prompt}
                      </div>

                      <div className="opt-list">
                        {(q.options || []).map((opt, optIdx) => {
                          const active = answers[q.questionId] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => choose(q.questionId, optIdx)}
                              className={`opt ${active ? "active" : ""}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="actions">
                <button
                  className={`btn primary ${canSubmit && !submitting ? "" : "disabled"}`}
                  disabled={!canSubmit || submitting}
                  onClick={submit}
                >
                  {submitting ? "Submitting…" : "Submit Quiz"}
                </button>

                <button className="btn" onClick={loadQuiz}>Refresh Quiz</button>
                <button className="btn ghost" onClick={() => nav("/")}>Back to Dashboard</button>
              </div>
            </section>
          )}
        </div>
      </>
  );
}
