// client/src/pages/Path.jsx
// FULL UPDATED FILE (drop-in) — clearer realtime resequencing UI
// Changes:
// ✅ NOW = first actionable (not needs_review / not completed) from currentIndex
// ✅ NEXT = exact nextAssetId (fallback: next actionable after NOW)
// ✅ Separate lane: Needs Review (deferred)
// ✅ Upcoming excludes needs_review + completed
// ✅ Engine label now means "engine moved/added" (no more “insert only” assumption)

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { formatTitle } from "../utils/formatTitle";
import { getActiveUserId } from "../utils/activeUser";
import "./path.css";

const norm = (s) => String(s || "").toLowerCase().trim();
const isDone = (s) => ["completed", "done"].includes(norm(s));
const isReview = (s) => norm(s) === "needs_review";

export default function Path() {
  const nav = useNavigate();
  const userId = getActiveUserId();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const dash = await api.getDashboard(userId);
      setData(dash);
    } catch (e) {
      setErr(e.message || "Failed to load path");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const ui = useMemo(() => {
    const user = data?.user || {};
    const path = data?.path || {};
    const nodes = path?.nodes || [];
    const assetIndex = data?.assetIndex || {};

    const items = nodes.map((n, idx) => {
      const asset = assetIndex?.[n.assetId] || {};
      const title = formatTitle(asset.title || n.title || n.assetId);
      const topic = asset.topic || n.topic || "";
      const format = asset.format || n.format || guessFormatFromId(n.assetId);
      const level = asset.level || n.level || "";
      const difficulty = asset.difficulty ?? n.difficulty;

      const status = n.status || "pending";
      const done = isDone(status);
      const review = isReview(status);
      const addedBy = n.addedBy || "course";

      const url = asset.url || n.url || asset.link || null;

      return {
        idx,
        assetId: n.assetId,
        title,
        topic,
        format,
        level,
        difficulty,
        status,
        done,
        review,
        addedBy,
        url,
      };
    });

    const start = Math.max(0, Number(path.currentIndex ?? 0));

    // NOW = first actionable (not done, not needs_review) starting from currentIndex
    // fallback to anywhere if currentIndex points into completed/review zones
    const nowItem =
      items.slice(start).find((x) => !x.done && !x.review) ||
      items.find((x) => !x.done && !x.review) ||
      null;

    // NEXT = exact nextAssetId if present & not done, else next actionable after NOW
    const nextById = path.nextAssetId
      ? items.find((x) => x.assetId === path.nextAssetId) || null
      : null;

    const nextItem =
      (nextById && !nextById.done ? nextById : null) ||
      (nowItem ? items.slice(nowItem.idx + 1).find((x) => !x.done && !x.review) : null) ||
      null;

    const upcoming = nowItem
      ? items.filter((x) => x.idx > nowItem.idx && !x.done && !x.review)
      : items.filter((x) => !x.done && !x.review);

    const needsReview = items.filter((x) => x.review);
    const done = items.filter((x) => x.done);

    return {
      user,
      courseTitle: data?.course?.title || "Foundations",
      lastUpdatedLabel: data?.lastUpdatedLabel || "Last updated just now",
      lastReason: path.lastUpdatedReason || "",
      total: items.length,
      completed: done.length,
      nowItem,
      nextItem,
      upcoming,
      needsReview,
      done,
    };
  }, [data]);

  function openAsset(item) {
    if (!item?.assetId) return;
    nav(`/asset/${item.assetId}`, { state: { userId } });
  }

  if (loading) return <div className="ss-page ss-center">Loading path…</div>;
  if (err) return <div className="ss-page ss-center ss-error">{err}</div>;
  if (!data) return <div className="ss-page ss-center">No data</div>;

  const nowKind = ui.nowItem?.review ? "review" : "now";

  return (
    <>
      {/* SIDEBAR - COMMENTED OUT */}
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
          <button className="ss-navitem active" onClick={() => nav("/path")}>
            <span className="ss-ico">⧉</span> My Path
          </button>
          <button className="ss-navitem" onClick={() => nav("/quiz")}>
            <span className="ss-ico">☑</span> Quiz
          </button>
          <button className="ss-navitem" onClick={() => nav("/debug")}>
            <span className="ss-ico">≡</span> Debug (Admin)
          </button>
        </nav>

        <div className="ss-sidebottom">
          <div className="ss-user">
            <div className="ss-useravatar">{(ui.user?.name || "J").slice(0, 1).toUpperCase()}</div>
            <div className="ss-usertext">
              <div className="ss-username">{ui.user?.name || "John Doe"}</div>
              <div className="ss-userrole">{ui.user?.role || "Learner"}</div>
            </div>
            <div className="ss-usercaret">▾</div>
          </div>
        </div>
      </aside> */}

      {/* TOPBAR
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

            <div className="ss-miniavatar">{(ui.user?.name || "U").slice(0, 1).toUpperCase()}</div>
          </div>
        </div> */}

        {/* PAGE */}
        <div className="path-wrap">
          <div className="path-header">
            <div>
              <div className="path-h1">My Path</div>
              <div className="path-sub">
                NOW, NEXT, and lanes update instantly when the engine switches format or drops a level.
              </div>
              {ui.lastReason ? <div className="path-reason">Reason: {ui.lastReason}</div> : null}
            </div>

            <div className="path-header-actions">
              <button className="path-cta" onClick={() => openAsset(ui.nextItem)} disabled={!ui.nextItem}>
                Go to NEXT
              </button>
              <button className="path-refresh" onClick={load}>
                ↻ Refresh
              </button>
            </div>
          </div>

          <div className="path-grid">
            {/* LEFT */}
            <section className="ss-card path-wide">
              <div className="ss-cardtitle">Learning Sequence</div>

              {/* NOW */}
              <div className="lane">
                <div className="lane-title">
                  <span className={`lane-dot ${nowKind}`} />
                  Now Learning
                </div>

                {ui.nowItem ? (
                  <SequenceCard item={ui.nowItem} kind="now" onOpen={() => openAsset(ui.nowItem)} />
                ) : (
                  <div className="empty">No current item.</div>
                )}
              </div>

              {/* NEXT */}
              <div className="lane">
                <div className="lane-title">
                  <span className="lane-dot next" />
                  Next Up (engine recommended)
                </div>

                {ui.nextItem ? (
                  <SequenceCard item={ui.nextItem} kind="next" onOpen={() => openAsset(ui.nextItem)} />
                ) : (
                  <div className="empty">No next item found.</div>
                )}
              </div>

              {/* NEEDS REVIEW */}
              <div className="lane">
                <div className="lane-title">
                  <span className="lane-dot review" />
                  Needs Review (deferred)
                </div>

                {ui.needsReview.length ? (
                  <div className="up-grid">
                    {ui.needsReview.slice(0, 6).map((it) => (
                      <MiniCard key={it.assetId + it.idx} item={it} onOpen={() => openAsset(it)} />
                    ))}
                  </div>
                ) : (
                  <div className="empty">Nothing pending for review 🎉</div>
                )}

                {ui.needsReview.length > 6 ? (
                  <div className="hint">Showing 6 of {ui.needsReview.length} in review.</div>
                ) : null}
              </div>

              {/* UPCOMING */}
              <div className="lane">
                <div className="lane-title">
                  <span className="lane-dot up" />
                  Upcoming (dynamic)
                </div>

                <div className="up-grid">
                  {ui.upcoming.slice(0, 10).map((it) => (
                    <MiniCard key={it.assetId + it.idx} item={it} onOpen={() => openAsset(it)} />
                  ))}
                </div>

                {ui.upcoming.length > 10 ? (
                  <div className="hint">Showing 10 of {ui.upcoming.length} upcoming.</div>
                ) : null}
              </div>

              {/* DONE */}
              <div className="lane">
                <div className="lane-title row">
                  <div className="row-left">
                    <span className="lane-dot done" />
                    Completed
                  </div>

                  <button className="toggle" onClick={() => setShowDone((v) => !v)}>
                    {showDone ? "Hide" : "Show"} ({ui.done.length})
                  </button>
                </div>

                {showDone ? (
                  <div className="done-grid">
                    {ui.done.slice(0, 10).map((it) => (
                      <MiniCard key={it.assetId + it.idx} item={it} onOpen={() => openAsset(it)} />
                    ))}
                    {ui.done.length > 10 ? (
                      <div className="hint">Showing 10 of {ui.done.length} completed.</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            {/* RIGHT */}
            <section className="ss-card">
              <div className="ss-cardtitle">Resequencing Summary</div>

              <div className="path-summary">
                <div className="sum-row">
                  <div className="sum-label">Total assets</div>
                  <div className="sum-val">{ui.total}</div>
                </div>
                <div className="sum-row">
                  <div className="sum-label">Completed</div>
                  <div className="sum-val">{ui.completed}</div>
                </div>

                <div className="sum-divider" />

                <div className="explain">
                  <div className="explain-title">Flow</div>
                  <div className="explain-text">
                    <b>Fail Video</b> → switch to <b>Doc</b> at the same level. <br />
                    <b>Fail Doc</b> → drop a level (Advanced → Intermediate → Beginner). <br />
                    <b>Pass</b> → continue forward.
                  </div>
                </div>

                {ui.nextItem ? (
                  <div className="next-box">
                    <div className="next-label">Engine picked NEXT</div>
                    <div className="next-title">{ui.nextItem.title}</div>
                    <div className="next-meta">
                      <span className="pill next">NEXT</span>
                      <span className="pill fmt">{prettyFormat(ui.nextItem.format)}</span>
                      {ui.nextItem.level ? <span className="pill muted">{ui.nextItem.level}</span> : null}
                      <span className={`pill ${ui.nextItem.addedBy === "engine" ? "engine" : "course"}`}>
                        {ui.nextItem.addedBy === "engine" ? "engine" : "course"}
                      </span>
                    </div>
                    <button className="go-next" onClick={() => openAsset(ui.nextItem)}>
                      Open NEXT asset
                    </button>
                  </div>
                ) : (
                  <div className="empty">No NEXT item yet.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </>
  );
}

/* ---------- UI pieces ---------- */

function SequenceCard({ item, kind, onOpen }) {
  const sourceLabel = item.addedBy === "engine" ? "Engine" : "Course";
  return (
    <div className={`seq-card ${kind}`} onClick={onOpen} role="button" tabIndex={0}>
      <div className="seq-left">
        <div className="seq-title">{item.title}</div>
        <div className="seq-meta">
          <span className={`pill ${kind}`}>{kind.toUpperCase()}</span>
          <span className="pill fmt">{prettyFormat(item.format)}</span>
          {item.level ? <span className="pill muted">{item.level}</span> : null}
          {item.topic ? <span className="pill muted">{prettyTopic(item.topic)}</span> : null}
          <span className={`pill ${item.addedBy === "engine" ? "engine" : "course"}`}>{sourceLabel}</span>
        </div>
      </div>
      <div className="seq-right">
        <span className="open">Open</span>
      </div>
    </div>
  );
}

function MiniCard({ item, onOpen }) {
  const phase = item.review ? "review" : "up";
  return (
    <div className={`mini-card ${phase}`} onClick={onOpen} role="button" tabIndex={0}>
      <div className="mini-title">{shortTitle(item.title)}</div>
      <div className="mini-meta">
        <span className={`pill ${phase}`}>{phase === "review" ? "REVIEW" : "UPCOMING"}</span>
        <span className="pill fmt">{prettyFormat(item.format)}</span>
        {item.level ? <span className="pill muted">{item.level}</span> : null}
        {item.addedBy === "engine" ? <span className="pill engine">engine</span> : null}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function guessFormatFromId(assetId) {
  const s = norm(assetId);
  if (s.includes("video")) return "video";
  if (s.includes("doc")) return "doc";
  if (s.includes("lab")) return "lab";
  return "other";
}

function prettyTopic(t) {
  return (t || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyFormat(f) {
  const s = norm(f);
  if (s.includes("video")) return "Video";
  if (s.includes("doc")) return "Doc";
  if (s.includes("lab")) return "Lab";
  return "Other";
}

function shortTitle(title) {
  const s = String(title || "");
  return s.length > 56 ? s.slice(0, 53) + "…" : s;
}
