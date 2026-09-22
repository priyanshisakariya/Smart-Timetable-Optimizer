import { useEffect, useState } from "react";
import FacultyLayout from "../FacultyLayout";
import { FaBook, FaClock, FaLayerGroup, FaGraduationCap } from "react-icons/fa";
import "./MySubjects.css";

function MySubjects() {
  const [subjects, setSubjects] = useState([]);
  const [scheduledCounts, setScheduledCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const facultyId = user?.id || user?._id || localStorage.getItem("facultyId") || localStorage.getItem("userId");

        const [subjRes, ttRes] = await Promise.all([
          fetch("http://localhost:5000/api/auth/subjects"),
          fetch(`http://localhost:5000/api/auth/timetable?facultyId=${encodeURIComponent(facultyId || "")}`)
        ]);

        const data = await subjRes.json();
        const ttData = await ttRes.json();
        const ttList = Array.isArray(ttData) ? ttData : [];

        // Count actual weekly lectures scheduled in the timetable
        const counts = {};
        ttList.forEach((item) => {
          const subName = (item.subject || "").trim().toLowerCase();
          if (subName) {
            counts[subName] = (counts[subName] || 0) + 1;
          }
        });
        setScheduledCounts(counts);

        if (subjRes.ok && Array.isArray(data)) {
          // Strictly filter ONLY subjects specifically assigned to this faculty
          const assigned = data.filter((s) => {
            const matchId = s.facultyId && String(s.facultyId) === String(facultyId);
            const facName = (s.facultyName || s.faculty || "").trim().toLowerCase();
            const uName = (user?.name || "").trim().toLowerCase();
            const matchName = facName && uName && (facName.includes(uName) || uName.includes(facName));
            const matchAssignedArr = Array.isArray(user?.assignedSubjects) && (
              user.assignedSubjects.some((as) => (as || "").trim().toLowerCase() === (s.name || "").trim().toLowerCase())
            );
            const inTimetable = counts[(s.name || "").trim().toLowerCase()] > 0;

            return matchId || matchName || matchAssignedArr || inTimetable;
          });

          setSubjects(assigned);
        } else {
          console.error(data.message || "Failed to fetch subjects");
        }
      } catch (error) {
        console.error("Fetch Subjects Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <FacultyLayout>
      <div className="my-subjects">
        <div className="subjects-header">
          <div>
            <h1>My Assigned Subjects</h1>
            <p>Courses and curriculum assigned to you for teaching and scheduling.</p>
          </div>
        </div>

        {/* LOADING */}
        {loading && <p>Loading subjects...</p>}

        {/* NO SUBJECTS */}
        {!loading && subjects.length === 0 && <p>No subjects assigned yet.</p>}

        {/* SUBJECT CARDS */}
        {!loading && subjects.length > 0 && (
          <div className="subjects-grid">
            {subjects.map((subject) => {
              const subKey = (subject.name || "").trim().toLowerCase();
              const weeklyLecturesCount = scheduledCounts[subKey] || subject.weeklyLectures || 4;

              return (
                <div className="subject-card" key={subject._id}>
                  <div className="subject-icon">
                    <FaBook />
                  </div>

                  <div className="subject-info">
                    <h2>{subject.name}</h2>
                    <p><strong>Code:</strong> {subject.code}</p>
                    <p><FaGraduationCap style={{ marginRight: 6 }} /><strong>Dept:</strong> {subject.department || "General"}</p>
                    <p><FaLayerGroup style={{ marginRight: 6 }} /><strong>Semester:</strong> {subject.semester}</p>
                    {subject.className && (
                      <p><strong>Class/Div:</strong> {subject.className}</p>
                    )}
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ background: "#e0e7ff", color: "#4338ca", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                        {subject.credits || 4} Credits
                      </span>
                      <span style={{ background: "#ecfdf5", color: "#065f46", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                        <FaClock style={{ marginRight: 4 }} />
                        {subject.weeklyLectures || (weeklyLecturesCount > 0 ? weeklyLecturesCount / 2 : 6)} Lect/wk
                      </span>
                      {weeklyLecturesCount > 0 && (
                        <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                          {weeklyLecturesCount} Total (Div A + B)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}

export default MySubjects;
