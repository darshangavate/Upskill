// Courses.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { displayName } from "../utils/displayName";
import { formatTitle } from "../utils/formatTitle";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const userId = useMemo(
    () => localStorage.getItem("activeUserId") || "u-emp-01",
    []
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.getCourses();
        setCourses(data);
      } catch (e) {
        setMsg(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onEnroll(courseId) {
    try {
      setMsg("");
      await api.enroll(userId, courseId);
      setMsg(`✅ Enrolled in ${displayName(courseId)}. Go to Dashboard.`);
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Courses</h2>
      <p style={{ marginTop: 6, opacity: 0.75 }}>
        Pick a course to enroll. User: <b>{userId}</b>
      </p>

      {msg && (
        <div style={{ background: "white", padding: 12, borderRadius: 12, margin: "12px 0" }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          {courses.map((c) => (
            <div
              key={c.courseId}
              style={{
                background: "white",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              }}
            >
              {/* Use real title if present, else prettify id */}
              <div style={{ fontWeight: 800 }}>
                {displayName({ title: c.title, courseId: c.courseId }, { maxLen: 34 })}
              </div>

              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
                {c.description}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(c.skillTags || []).map((t) => (
                  <span key={t} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 999, background: "#EEF2FF" }}>
                    {displayName(t, { maxLen: 18 })}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onEnroll(c.courseId)}
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: "#111827",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                Enroll
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
