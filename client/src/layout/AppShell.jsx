import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./appShell.css";

export default function AppShell({ user }) {
  const nav = useNavigate();
  const loc = useLocation();

  const active = (path) => (loc.pathname === path ? "active" : "");

  return (
    <div className="ss-shell">
      {/* LEFT SIDEBAR */}
      <aside className="ss-sidebar">
        <div className="ss-brand" onClick={() => nav("/")} role="button" tabIndex={0}>
          <div className="ss-logo">⚡</div>
          <div className="ss-brand-text">
            <div className="ss-brand-name">SkillStream</div>
          </div>
        </div>

        <div className="ss-subtitle">Dynamic Upskilling Engine</div>

        <nav className="ss-nav">
          <button className={`ss-navitem ${active("/")}`} onClick={() => nav("/")}>
            <span className="ss-ico">●</span>
            Dashboard
          </button>
          <button className={`ss-navitem ${active("/catalog")}`} onClick={() => nav("/catalog")}>
            <span className="ss-ico">▦</span>
            Catalog
          </button>
          <button className={`ss-navitem ${active("/path")}`} onClick={() => nav("/path")}>
            <span className="ss-ico">⧉</span>
            My Path
          </button>
          <button className={`ss-navitem ${active("/quiz")}`} onClick={() => nav("/quiz")}>
            <span className="ss-ico">☑</span>
            Quiz
          </button>
          <button className={`ss-navitem ${active("/debug")}`} onClick={() => nav("/debug")}>
            <span className="ss-ico">≡</span>
            Debug (Admin)
          </button>
        </nav>

        <div className="ss-sidebottom">
          <div className="ss-user">
            <div className="ss-useravatar">
              {(user?.name || "J").slice(0, 1).toUpperCase()}
            </div>
            <div className="ss-usertext">
              <div className="ss-username">{user?.name || "John Doe"}</div>
              <div className="ss-userrole">{user?.role || "Learner"}</div>
            </div>
            <div className="ss-usercaret">▾</div>
          </div>

          <div className="ss-sideactions">
            <button className="ss-linkbtn" onClick={() => nav("/switch")}>
              ⟲ Switch User
            </button>
            <button className="ss-linkbtn" onClick={() => nav("/logout")}>
              ⇥ Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ss-main">
        <div className="ss-topbar">
          <button className="ss-course" onClick={() => nav("/")}>
            <span className="ss-course-name">Python Foundations</span>
            <span className="ss-course-caret">▾</span>
          </button>

          <div className="ss-topright">
            <span className="ss-dot" />
            <span className="ss-toptext">Connected</span>
            <span className="ss-sep">|</span>
            <span className="ss-toptext">Last updated 5 mins ago</span>

            <button className="ss-iconbtn" title="Notifications">🔔</button>
            <button className="ss-iconbtn" title="Settings">⚙</button>

            <div className="ss-miniavatar">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
