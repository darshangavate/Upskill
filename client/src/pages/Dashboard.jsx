import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./dashboard.css";
import { formatTitle } from "../utils/formatTitle";
import { getActiveUserId } from "../utils/activeUser";


export default function Dashboard() {
  const nav = useNavigate();

  const userId = getActiveUserId();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const dash = await api.getDashboard(userId);
      setData(dash);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ui = useMemo(() => {
    const user = data?.user || {};
    const path = data?.path || {};
    const next = data?.nextAsset || null;

    const progress = data?.progress || { total: 0, completed: 0, percent: 0 };
    const etaMinutes = data?.etaMinutes ?? 0;

    const mastery = user?.mastery_map || {};
    const topicStrengthRows = Object.entries(mastery)
      .map(([topic, v]) => {
        const val = Number(v);
        let label = "Improving";
        let tone = "mid";
        let icon = "↑";
        if (val >= 0.75) (label = "Strong"), (tone = "good"), (icon = "✓");
        else if (val >= 0.45) (label = "Improving"), (tone = "mid"), (icon = "↑");
        else (label = "Needs Review"), (tone = "warn"), (icon = "⚠");
        return { topic, val, label, tone, icon };
      })
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);

    const recentAttempts = data?.recentAttempts || [];

    // Avg score quick calc (from recent attempts)
    const avgScore =
      recentAttempts.length > 0
        ? Math.round(
            recentAttempts.reduce((s, a) => s + (Number(a.score) || 0), 0) / recentAttempts.length
          )
        : Math.round(
            Object.values(user?.format_stats || {}).reduce(
              (s, f) => s + (Number(f.avgScore) || 0),
              0
            ) / Math.max(1, Object.keys(user?.format_stats || {}).length)
          );

    const pref = (user?.learning_style_preference || "mixed").replace("_first", "");
    const preferredFormatLabel =
      pref === "video" ? "Videos" : pref === "doc" ? "Docs" : pref === "lab" ? "Labs" : "Mixed";

    const timeEff = data?.timeEfficiency || "On Track";
    const timeEffTone = timeEff === "On Track" ? "ok" : timeEff === "Slow" ? "warn" : "mid";

    // Certification path display: topics in order
    const topicOrder = [];
    const seen = new Set();
    (path.nodes || []).forEach((n) => {
      const topic = data?.assetIndex?.[n.assetId]?.topic;
      if (!topic) return;
      if (!seen.has(topic)) {
        seen.add(topic);
        topicOrder.push(topic);
      }
    });

    const certificationRows =
      topicOrder.length > 0
        ? topicOrder.slice(0, 6).map((t, idx) => {
            const status =
              idx < Math.max(0, progress.completed)
                ? "Completed"
                : idx === progress.completed
                ? "In Progress"
                : "Upcoming";
            return { label: prettyTopic(t), status };
          })
        : (path.nodes || []).slice(0, 6).map((n, idx) => ({
            label: n.assetId,
            status:
              n.status === "completed"
                ? "Completed"
                : idx === (path.currentIndex || 0)
                ? "In Progress"
                : "Upcoming",
          }));

    const courseTitle = data?.course?.title || "Python Foundations";
    const lastUpdatedLabel = data?.lastUpdatedLabel || "Last updated 5 mins ago";

    return {
      user,
      path,
      next,
      progress,
      etaMinutes,
      avgScore,
      preferredFormatLabel,
      timeEff,
      timeEffTone,
      topicStrengthRows,
      recentAttempts,
      certificationRows,
      courseTitle,
      lastUpdatedLabel,
    };
  }, [data]);

  if (loading) return <div className="ss-page ss-center">Loading…</div>;
  if (err) return <div className="ss-page ss-center ss-error">{err}</div>;
  if (!data) return null;

  return (
    <>
      {/* SIDEBAR - COMMENTED OUT */}
      {/* <aside className="ss-sidebar">
        ...sidebar content...
      </aside> */}

      {/* TOP BAR
      <div className="ss-topbar">
          <button className="ss-course">
            <span className="ss-course-name">{ui.courseTitle}</span>
            <span className="ss-course-caret">▾</span>
          </button>

          <div className="ss-topright">
            <span className="ss-dot" />
            <span className="ss-toptext">Connected</span>
            <span className="ss-sep">|</span>
            <span className="ss-toptext">{ui.lastUpdatedLabel}</span>

            <button className="ss-iconbtn" onClick={load} title="Refresh">
              ↻
            </button>
            <button className="ss-iconbtn" title="Notifications">
              🔔
            </button>
            <button className="ss-iconbtn" title="Settings">
              ⚙
            </button>

            <div className="ss-miniavatar">
              {(ui.user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div> */}

        {/* GRID */}
        <div className="ss-grid">
          {/* Recommended Next Asset */}
          <section className="ss-card ss-card-wide">
            <div className="ss-cardtitle">Recommended Next Asset</div>

            <div className="ss-hero">
              <div className="ss-hero-left">
                <div className="ss-hero-title">{ui.next?.title || ui.next?.assetId || "—"}</div>

                <div className="ss-hero-meta">
                  <span>
                    Format: <b>{ui.next?.format || "—"}</b>
                  </span>
                  <span className="ss-meta-dot">•</span>
                  <span>
                    Difficulty: <b>{ui.next?.difficulty ?? "—"}</b>
                  </span>
                </div>

                <div className="ss-hero-meta">
                  Est. Time: <b>{ui.next?.expectedTimeMin ?? "—"}</b> min
                </div>
              </div>

              <div className="ss-hero-right">
                <div className="ss-hero-icon">💠</div>
              </div>
            </div>

            <div className="ss-actions">
             <button
              className="ss-btn ss-primary"
               onClick={() => ui.next?.assetId && nav(`/asset/${ui.next.assetId}`, { state: { userId } })}
                disabled={!ui.next?.assetId}
                >
                Start Learning
              </button>


              <button
                className="ss-btn ss-secondary"
                onClick={() =>
                  nav("/quiz", {
                    state: { userId, assetId: ui.next?.assetId, topic: ui.next?.topic },
                  })
                }
              >
                Retry Weak Topic
              </button>
            </div>

            <div className="ss-reason">
              Reason:{" "}
              <span>{ui.path?.lastUpdatedReason || "Low score detected, switching to video."}</span>
            </div>
          </section>

          {/* Performance Snapshot */}
          <section className="ss-card">
            <div className="ss-cardtitle">Performance Snapshot</div>

            <div className="ss-kpi-grid">
              <div className="ss-kpi">
                <div className="ss-kpi-label">Avg Score</div>
                <div className="ss-kpi-value">{ui.avgScore}%</div>
              </div>

              <div className="ss-kpi">
                <div className="ss-kpi-label">Preferred Format</div>
                <div className="ss-kpi-value">{ui.preferredFormatLabel}</div>
              </div>

              <div className="ss-kpi ss-kpi-wide">
                <div className="ss-kpi-label">Time Efficiency</div>
                <div className={`ss-status ${ui.timeEffTone}`}>
                  <span className="ss-status-dot">✓</span> {ui.timeEff}
                </div>
              </div>
            </div>
          </section>

          {/* Current Certification Path */}
          <section className="ss-card ss-card-wide">
            <div className="ss-cardtitle">Current Certification Path</div>

            <div className="ss-pathlist">
              {ui.certificationRows.map((r, idx) => (
                <div key={idx} className="ss-pathrow">
                  <div
                    className={`ss-bullet ${
                      r.status === "Completed"
                        ? "done"
                        : r.status === "In Progress"
                        ? "active"
                        : "up"
                    }`}
                  />
                  <div className="ss-pathtext">
                    <div className="ss-pathlabel">{r.label}</div>
                    <div className="ss-pathstatus">{r.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Topic Strength */}
          <section className="ss-card">
            <div className="ss-cardtitle">Topic Strength</div>

            {ui.topicStrengthRows.length === 0 ? (
              <div className="ss-muted">No mastery data yet. Take a quiz.</div>
            ) : (
              <div className="ss-strength">
                {ui.topicStrengthRows.map((t) => (
                  <div key={t.topic} className="ss-strength-row">
                    <div className={`ss-strength-ico ${t.tone}`}>{t.icon}</div>
                    <div className="ss-strength-topic">
                      <b>{prettyTopic(t.topic)}</b>{" "}
                      <span className={`ss-strength-label ${t.tone}`}>{t.label}</span>
                    </div>
                    <div className="ss-strength-right">
                      {t.tone === "good" ? "✓" : t.tone === "warn" ? "◆" : "▲"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Attempts */}
          <section className="ss-card">
            <div className="ss-cardtitle">Recent Attempts</div>

            {ui.recentAttempts.length === 0 ? (
              <div className="ss-muted">No attempts yet.</div>
            ) : (
              <div className="ss-table">
                <div className="ss-tr ss-head">
                  <div>Topic</div>
                  <div>Score</div>
                  <div>Time</div>
                  <div>Result</div>
                </div>

                {ui.recentAttempts.slice(0, 2).map((a) => (
                  <div key={a.attemptId} className="ss-tr">
                    <div>{prettyTopic(a.topic)}</div>
                    <div className="ss-score">{a.score}%</div>
                    <div>{a.timeSpentMin}m</div>
                    <div>
                      <button
                        className="ss-mini-btn"
                        onClick={() =>
                          nav("/quiz", { state: { userId, topic: a.topic, assetId: a.assetId } })
                        }
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </>
  );
}

function prettyTopic(t) {
  return (t || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
