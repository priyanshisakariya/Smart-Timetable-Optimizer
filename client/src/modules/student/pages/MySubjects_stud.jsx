import { useEffect, useState } from "react";
import StudentLayout from "../StudentLayout";
import { FaBook, FaUserTie, FaClock, FaLayerGroup } from "react-icons/fa";
import "./MySubjects.css";

function MySubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;

        const response = await fetch("http://localhost:5000/api/auth/subjects");
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          // If student has department and semester, filter accordingly
          let filtered = data;
          if (user?.department) {
            filtered = filtered.filter(
              (s) => s.department && s.department.toLowerCase() === user.department.toLowerCase()
            );
          }
          if (user?.semester) {
            const semFiltered = filtered.filter(
              (s) => String(s.semester) === String(user.semester)
            );
            if (semFiltered.length > 0) {
              filtered = semFiltered;
            }
          }
          setSubjects(filtered.length > 0 ? filtered : data);
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <StudentLayout>
      <div className="student-subjects">
        {/* Header */}
        <div className="student-subjects-header">
          <div>
            <h1>My Enrolled Subjects</h1>
            <p>Curriculum syllabus and designated faculty for your current semester.</p>
          </div>
          <div className="subjects-header-icon">
            <FaBook />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <p>Loading subjects...</p>
        ) : (
          <>
            {/* Subject Count */}
            <div className="subjects-summary">
              <div className="subjects-summary-icon">
                <FaBook />
              </div>
              <div>
                <span>Total Subjects In Semester</span>
                <strong>{subjects.length}</strong>
              </div>
            </div>

            {/* No Subjects */}
            {subjects.length === 0 ? (
              <div className="no-subjects">
                <FaBook />
                <h2>No Subjects Found</h2>
                <p>No subjects have been registered for your department / semester yet.</p>
              </div>
            ) : (
              /* Subjects Grid */
              <div className="subjects-grid">
                {subjects.map((subject) => (
                  <div className="subject-card" key={subject._id}>
                    <div className="subject-card-top">
                      <div className="subject-icon">
                        <FaBook />
                      </div>
                      <span className="subject-code">{subject.code}</span>
                    </div>

                    <h2>{subject.name}</h2>

                    <div className="subject-details">
                      <div>
                        <FaUserTie />
                        <span>{subject.faculty || "Faculty Assigned"}</span>
                      </div>
                      <div>
                        <FaClock />
                        <span>{subject.credits || 3} Credits</span>
                      </div>
                    </div>

                    <div className="subject-details">
                      <div>
                        <span><strong>Dept:</strong> {subject.department || "General"}</span>
                      </div>
                      <div>
                        <FaLayerGroup style={{ marginRight: 4 }} />
                        <span>Semester {subject.semester}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}

export default MySubjects;
