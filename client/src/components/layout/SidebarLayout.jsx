// SidebarLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./SidebarLayout.css";
import { api } from "../../services/api";
import { displayName } from "../../utils/displayName";
import { getActiveUserId, setActiveUserId } from "../../utils/activeUser";

export default function SidebarLayout() {
  const nav = useNavigate();
  const location = useLocation();

  const userId = getActiveUserId();

  const [dashboard, setDashboard] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.getDashboard(userId);
        setDashboard(d);

        const all = await api.getEnrollments(userId);
        setEnrollments(all || []);
      } catch (e) {
        console.error("Sidebar load failed:", e);
      }
    })();
  }, [userId]);

  const isActive = (path) => location.pathname === path;

  const currentCourseTitle = displayName(
    { title: dashboard?.course?.title, courseId: dashboard?.course?.courseId },
    { fallback: "Select Course", maxLen: 30 }
  );

  async function switchCourse(courseId) {
    await api.enroll(userId, courseId);
    setOpen(false);
    window.location.reload();
  }

  return (
    <div className="ss-shell">
      <aside className="ss-sidebar">
        <div className="ss-brand" onClick={() => nav("/")}>
          <div className="ss-logo">⚡</div>
          <div className="ss-brand-name">SkillStream</div>
        </div>

        <div className="ss-subtitle">Dynamic Upskilling Engine</div>

        {/* ✅ NAV */}
        <nav className="ss-nav">
          <button
            className={`ss-navitem ${isActive("/") ? "active" : ""}`}
            onClick={() => nav("/")}
          >
            <span className="ss-ico">●</span> Dashboard
          </button>

          <button
            className={`ss-navitem ${isActive("/courses") ? "active" : ""}`}
            onClick={() => nav("/courses")}
          >
            <span className="ss-ico">▦</span> Courses
          </button>

          <button
            className={`ss-navitem ${isActive("/path") ? "active" : ""}`}
            onClick={() => nav("/path")}
          >
            <span className="ss-ico">⧉</span> My Path
          </button>

          <button
            className={`ss-navitem ${isActive("/quiz") ? "active" : ""}`}
            onClick={() => nav("/quiz")}
          >
            <span className="ss-ico">☑</span> Quiz
          </button>

          {/* ✅ NEW: Profile */}
          <button
            className={`ss-navitem ${isActive("/profile") ? "active" : ""}`}
            onClick={() => nav("/profile")}
          >
            <span className="ss-ico">👤</span> Profile
          </button>
        </nav>

        <div className="ss-sidebottom">
          {/* ✅ Click user block to go Profile */}
          <div className="ss-user" onClick={() => nav("/profile")} style={{ cursor: "pointer" }}>
            <div className="ss-useravatar">
              {(dashboard?.user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="ss-usertext">
              <div className="ss-username">{dashboard?.user?.name || "User"}</div>
              <div className="ss-userrole">
                {displayName(dashboard?.user?.role || "employee", { maxLen: 14 })}
              </div>
            </div>
            <div className="ss-usercaret">▾</div>
          </div>

          {/* demo user switch */}
          <div className="ss-sideactions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ss-linkbtn" onClick={() => setActiveUserId("u-emp-01")}>
              u-emp-01
            </button>
            <button type="button" className="ss-linkbtn" onClick={() => setActiveUserId("u-emp-02")}>
              u-emp-02
            </button>
            <button type="button" className="ss-linkbtn" onClick={() => setActiveUserId("u-emp-03")}>
              u-emp-03
            </button>
          </div>
        </div>
      </aside>

      <main className="ss-main">
        <div className="ss-topbar">
          <div
            className="ss-course"
            onClick={() => setOpen((v) => !v)}
            role="button"
            tabIndex={0}
          >
            <div className="ss-course-name">{currentCourseTitle}</div>
            <div className="ss-course-caret">▾</div>
          </div>

          {open && (
            <div className="ss-dropdown">
              {enrollments.length === 0 ? (
                <div className="ss-dropdown-item" style={{ opacity: 0.7 }}>
                  No enrollments yet
                </div>
              ) : (
                enrollments.map((e) => {
                  const active = e.status === "active";
                  return (
                    <div
                      key={e.enrollmentId || `${e.userId}-${e.courseId}`}
                      className={`ss-dropdown-item ${active ? "active" : ""}`}
                      onClick={() => switchCourse(e.courseId)}
                    >
                      {displayName(e.courseId, { maxLen: 32 })}
                      <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 12 }}>
                        {active ? "• Active" : ""}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="ss-topright">
            <span className="ss-dot" />
            <span>Connected</span>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
