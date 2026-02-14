import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { getActiveUserId } from "../utils/activeUser";
import "./profile.css";

export default function Profile() {
  const userId = getActiveUserId();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const dash = await api.getDashboard(userId); // ✅ reuse existing
      setData(dash);
    } catch (e) {
      setErr(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const ui = useMemo(() => {
    const user = data?.user || {};
    const course = data?.course || {};
    const progress = data?.progress || { total: 0, completed: 0, percent: 0 };
    const recentAttempts = data?.recentAttempts || [];

    const pref = (user?.learning_style_preference || "mixed").replace("_first", "");
    const preferredFormatLabel =
      pref === "video" ? "Videos" : pref === "doc" ? "Docs" : pref === "lab" ? "Labs" : "Mixed";

    const avgScore =
      recentAttempts.length > 0
        ? Math.round(
            recentAttempts.reduce((s, a) => s + (Number(a.score) || 0), 0) / recentAttempts.length
          )
        : 0;

    return {
      name: user?.name || "User",
      role: user?.role || "employee",
      userId: user?.userId || userId,
      courseTitle: course?.title || "No active course",
      progress,
      preferredFormatLabel,
      timeEfficiency: data?.timeEfficiency || "On Track",
      avgScore,
      recentAttempts: recentAttempts.slice(0, 4),
    };
  }, [data, userId]);

  if (loading) return <div className="ss-page ss-center">Loading…</div>;
  if (err) return <div className="ss-page ss-center ss-error">{err}</div>;
  if (!data) return null;

  return (
    <div className="pf-wrap">
      <div className="pf-header">
        <div className="pf-avatar">{ui.name.slice(0, 1).toUpperCase()}</div>
        <div className="pf-headtext">
          <div className="pf-name">{ui.name}</div>
          <div className="pf-sub">
            <span className="pf-chip">{ui.role}</span>
            <span className="pf-chip">ID: {ui.userId}</span>
          </div>
        </div>

        <button className="pf-btn" onClick={load} title="Refresh">↻ Refresh</button>
      </div>

      <div className="pf-grid">
        <section className="pf-card pf-wide">
          <div className="pf-title">Active Learning Track</div>
          <div className="pf-big">{ui.courseTitle}</div>

          <div className="pf-row">
            <div>
              <div className="pf-label">Progress</div>
              <div className="pf-value">{ui.progress.percent}%</div>
            </div>
            <div>
              <div className="pf-label">Completed</div>
              <div className="pf-value">
                {ui.progress.completed}/{ui.progress.total}
              </div>
            </div>
            <div>
              <div className="pf-label">Time Efficiency</div>
              <div className="pf-value">{ui.timeEfficiency}</div>
            </div>
          </div>
        </section>

        <section className="pf-card">
          <div className="pf-title">Learning Preference</div>
          <div className="pf-big">{ui.preferredFormatLabel}</div>
          <div className="pf-muted">
            SkillStream adapts formats dynamically if performance drops.
          </div>
        </section>

        <section className="pf-card">
          <div className="pf-title">Performance</div>
          <div className="pf-row">
            <div>
              <div className="pf-label">Avg Score</div>
              <div className="pf-value">{ui.avgScore}%</div>
            </div>
            <div>
              <div className="pf-label">Last Update</div>
              <div className="pf-value">{data?.lastUpdatedLabel || "Just now"}</div>
            </div>
          </div>
        </section>

        <section className="pf-card pf-wide">
          <div className="pf-title">Recent Attempts</div>
          {ui.recentAttempts.length === 0 ? (
            <div className="pf-muted">No attempts yet.</div>
          ) : (
            <div className="pf-table">
              <div className="pf-tr pf-head">
                <div>Topic</div>
                <div>Score</div>
                <div>Result</div>
              </div>
              {ui.recentAttempts.map((a) => (
                <div key={a.attemptId} className="pf-tr">
                  <div>{prettyTopic(a.topic)}</div>
                  <div>{a.score}%</div>
                  <div>{a.score >= 60 ? "Pass" : "Fail"}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function prettyTopic(t) {
  return (t || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
