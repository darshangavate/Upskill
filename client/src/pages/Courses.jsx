import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // MVP: pick active user from localStorage (Dashboard should set this)
  const userId = useMemo(
    () => localStorage.getItem("activeUserId") || "u-emp-02",
    []
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMsg("");

        // Load courses + current user's enrollments
        const [coursesData, enrollmentsData] = await Promise.all([
          api.getCourses(),
          api.getEnrollments(userId),
        ]);

        setCourses(coursesData || []);

        /**
         * enrollmentsData can be either:
         * 1) ["courseId1", "courseId2"]
         * or
         * 2) [{ courseId: "..." }, ...]
         *
         * We'll support both safely:
         */
        const enrolledIds = Array.isArray(enrollmentsData)
          ? enrollmentsData.map((e) => (typeof e === "string" ? e : e.courseId)).filter(Boolean)
          : [];

        setEnrolled(new Set(enrolledIds));
      } catch (e) {
        setMsg(`❌ ${e.message || "Failed to load courses"}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  async function onEnroll(courseId) {
    try {
      setMsg("");

      await api.enroll(userId, courseId);

      // Update UI immediately so button becomes "Enrolled"
      setEnrolled((prev) => {
        const next = new Set(prev);
        next.add(courseId);
        return next;
      });

      setMsg(`✅ Enrolled in ${courseId}. Go to Dashboard.`);
    } catch (e) {
      setMsg(`❌ ${e.message || "Enroll failed"}`);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Courses</h2>
      <p style={{ marginTop: 6, opacity: 0.75 }}>
        Pick a course to enroll. User: <b>{userId}</b>
      </p>

      {msg && (
        <div
          style={{
            background: "white",
            padding: 12,
            borderRadius: 12,
            margin: "12px 0",
          }}
        >
          {msg}
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          {courses.map((c) => {
            const isEnrolled = enrolled.has(c.courseId);

            return (
              <div
                key={c.courseId}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontWeight: 800 }}>{c.title}</div>
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
                  {c.description}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {(c.skillTags || []).map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 12,
                        padding: "4px 8px",
                        borderRadius: 999,
                        background: "#EEF2FF",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onEnroll(c.courseId)}
                  disabled={isEnrolled}
                  style={{
                    marginTop: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "none",
                    cursor: isEnrolled ? "not-allowed" : "pointer",
                    background: isEnrolled ? "#9CA3AF" : "#111827",
                    color: "white",
                    fontWeight: 700,
                    opacity: isEnrolled ? 0.95 : 1,
                  }}
                >
                  {isEnrolled ? "Enrolled" : "Enroll"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
