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
      // 1) dashboard (active course)
      const d = await api.getDashboard(userId);
      setDashboard(d);

      // 2) all enrollments (dropdown list)
      const all = await api.getEnrollments(userId);
      setEnrollments(all || []);
    })();
  }, [userId]);

  const isActive = (path) => location.pathname === path;

  const currentCourseTitle = displayName(
    { title: dashboard?.course?.title, courseId: dashboard?.course?.courseId },
    { fallback: "Select Course", maxLen: 30 }
  );

  async function switchCourse(courseId) {
    // enroll() also sets selected as active + pauses others (based on your backend change)
    await api.enroll(userId, courseId);

    setOpen(false);

    // Reload page so all pages (Dashboard, Path, etc.) refetch with new course
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

        <nav className="ss-nav">
          <button className={`ss-navitem ${isActive("/") ? "active" : ""}`} onClick={() => nav("/")}>
            <span className="ss-ico">●</span> Dashboard
          </button>

          <button className={`ss-navitem ${isActive("/courses") ? "active" : ""}`} onClick={() => nav("/courses")}>
            <span className="ss-ico">▦</span> Courses
          </button>

          <button className={`ss-navitem ${isActive("/path") ? "active" : ""}`} onClick={() => nav("/path")}>
            <span className="ss-ico">⧉</span> My Path
          </button>

          <button className={`ss-navitem ${isActive("/quiz") ? "active" : ""}`} onClick={() => nav("/quiz")}>
            <span className="ss-ico">☑</span> Quiz
          </button>
        </nav>

        <div className="ss-sidebottom">
          <div className="ss-user">
            <div className="ss-useravatar">
              {(dashboard?.user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="ss-usertext">
              <div className="ss-username">{dashboard?.user?.name || "User"}</div>
              <div className="ss-userrole">{displayName(dashboard?.user?.role || "employee", { maxLen: 14 })}</div>
            </div>
            <div className="ss-usercaret">▾</div>
          </div>

          <div className="ss-sideactions">
            <button type="button" className="ss-linkbtn" onClick={() => setActiveUserId("u-emp-01")}>u-emp-01</button>
            <button type="button" className="ss-linkbtn" onClick={() => setActiveUserId("u-emp-02")}>u-emp-02</button>
            <button type="button" className="ss-linkbtn" onClick={() => setActiveUserId("u-emp-03")}>u-emp-03</button>
          </div>
        </div>
      </aside>

      <main className="ss-main">
        <div className="ss-topbar">
          {/* Dropdown trigger */}
          <div className="ss-course" onClick={() => setOpen((v) => !v)} role="button" tabIndex={0}>
            <div className="ss-course-name">{currentCourseTitle}</div>
            <div className="ss-course-caret">▾</div>
          </div>

          {/* Dropdown */}
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
