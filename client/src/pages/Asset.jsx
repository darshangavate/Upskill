import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import "./asset.css";

export default function Asset() {
  const nav = useNavigate();
  const { assetId } = useParams();
  const location = useLocation();

  const userId = location.state?.userId || "u-emp-02";

  const [asset, setAsset] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // timer
  const [running, setRunning] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const tickRef = useRef(null);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const a = await api.getAssetById(assetId);
      setAsset(a);
    } catch (e) {
      setErr(e.message || "Failed to load asset");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [assetId]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, [running]);

  const timeSpentMin = useMemo(() => Math.max(1, Math.ceil(elapsedSec / 60)), [elapsedSec]);

  const url = asset?.url || "";
  const format = String(asset?.format || "").toLowerCase();

  const isVideo = format.includes("video") || looksLikeVideo(url);
  const isDoc = format.includes("doc") || (!isVideo && !!url);

  function takeQuiz() {
    if (!asset?.topic || !asset?.assetId) return;
    nav("/quiz", {
      state: {
        userId,
        assetId: asset.assetId,
        topic: asset.topic,
        timeSpentMin, // ✅ real time spent
      },
    });
  }

  function openOriginal() {
    if (!url) return;
    window.open(url, "_blank", "noreferrer");
  }

  if (loading) return <div className="ss-page ss-center">Loading asset…</div>;
  if (err) return <div className="ss-page ss-center ss-error">{err}</div>;
  if (!asset) return <div className="ss-page ss-center">No asset found.</div>;

  return (
    <div className="ss-shell">
      {/* SIDEBAR */}
      <aside className="ss-sidebar">
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
          <button className="ss-navitem" onClick={() => nav("/quiz")}>
            <span className="ss-ico">☑</span> Quiz
          </button>
        </nav>

        <div className="ss-sidebottom">
          <div className="ss-user">
            <div className="ss-useravatar">{userId === "u-emp-02" ? "N" : "A"}</div>
            <div className="ss-usertext">
              <div className="ss-username">{userId === "u-emp-02" ? "Neha Patil" : "Aarav Sharma"}</div>
              <div className="ss-userrole">Learner</div>
            </div>
            <div className="ss-usercaret">▾</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ss-main">
        <div className="ss-topbar">
          <button className="ss-course" onClick={() => nav("/path")}>
            <span className="ss-course-name">Learning</span>
            <span className="ss-course-caret">▾</span>
          </button>

          <div className="ss-topright">
            <span className="ss-dot" />
            <span className="ss-toptext">Timer</span>
            <span className="ss-sep">|</span>
            <span className="ss-toptext">{running ? "Running" : "Paused"}</span>

            <div className="ss-miniavatar">{userId === "u-emp-02" ? "N" : "A"}</div>
          </div>
        </div>

        <div className="asset-wrap">
          <div className="asset-header">
            <div>
              <div className="asset-title">{asset.title || asset.assetId}</div>
              <div className="asset-sub">
                <span className="pill muted">{asset.topic || "—"}</span>
                <span className="sep">•</span>
                <span className="pill muted">{asset.format || "—"}</span>
                {asset.expectedTimeMin ? (
                  <>
                    <span className="sep">•</span>
                    <span className="pill muted">Est. {asset.expectedTimeMin}m</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="asset-actions">
              <div className="timerbox">
                <div className="timerlabel">Time spent</div>
                <div className="timervalue">{fmtTime(elapsedSec)}</div>
              </div>

              <button className="btn" onClick={() => setRunning((r) => !r)}>
                {running ? "Pause" : "Resume"}
              </button>

              <button className="btn primary" onClick={takeQuiz}>
                Take Quiz
              </button>

              <button className="btn ghost" onClick={openOriginal} disabled={!url}>
                Open URL
              </button>
            </div>
          </div>

          <section className="ss-card">
            <div className="ss-cardtitle">Content</div>

            {!url ? (
              <div className="muted">This asset has no URL.</div>
            ) : isVideo ? (
              <div className="embed">
                <iframe
                  title="video"
                  src={toEmbedUrl(url)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : isDoc ? (
              <div className="embed">
                <iframe title="doc" src={url} />
              </div>
            ) : (
              <div className="muted">
                Can’t embed this link.{" "}
                <button className="link" onClick={openOriginal}>
                  Open in new tab
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/* ---------- helpers ---------- */
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

function looksLikeVideo(url) {
  const u = String(url || "").toLowerCase();
  return u.includes("youtube.com") || u.includes("youtu.be") || u.includes("vimeo.com") || u.endsWith(".mp4");
}

// simple youtube/vimeo embed support
function toEmbedUrl(url) {
  const u = String(url || "");

  // youtu.be/<id>
  if (u.includes("youtu.be/")) {
    const id = u.split("youtu.be/")[1]?.split(/[?&]/)[0];
    return id ? `https://www.youtube.com/embed/${id}` : u;
  }

  // youtube.com/watch?v=<id>
  if (u.includes("youtube.com/watch")) {
    const qs = new URL(u).searchParams;
    const id = qs.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : u;
  }

  // vimeo.com/<id>
  if (u.includes("vimeo.com/")) {
    const id = u.split("vimeo.com/")[1]?.split(/[?&]/)[0];
    return id ? `https://player.vimeo.com/video/${id}` : u;
  }

  // direct mp4 (browser can play in iframe sometimes, fallback ok)
  return u;
}
