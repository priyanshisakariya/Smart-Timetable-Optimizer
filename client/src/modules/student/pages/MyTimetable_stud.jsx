import { useEffect, useState } from "react";

import StudentLayout from "../StudentLayout";

import { FaCalendarAlt, FaClock, FaUserTie, FaDoorOpen } from "react-icons/fa";

import "./MyTimetable.css";

function MyTimetable() {
  const [timetable, setTimetable] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ======================================================
  // GET LOGGED-IN STUDENT
  // ======================================================

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        setError("");

        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const studentId = user?.id || user?._id || localStorage.getItem("userId");

        if (!studentId) {
          throw new Error("Student ID not found. Please login again.");
        }

        const response = await fetch(
          `http://localhost:5000/api/auth/timetable?studentId=${encodeURIComponent(studentId)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch timetable");
        }

        const timetableData = Array.isArray(data)
          ? data
          : data.timetable || [];

        console.log("STUDENT TIMETABLE:", timetableData);
        setTimetable(timetableData);
      } catch (error) {
        console.error("Timetable Error:", error);
        setError(error.message || "Failed to load timetable.");
        setTimetable([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <StudentLayout>
        <div className="student-timetable">
          <div className="timetable-empty">
            <h2>Loading timetable...</h2>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (error) {
    return (
      <StudentLayout>
        <div className="student-timetable">
          <div className="timetable-empty">
            <h2>{error}</h2>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ======================================================
  // MAIN UI
  // ======================================================

  return (
    <StudentLayout>
      <div className="student-timetable">
        {/* =========================================
                    HEADER
                ========================================== */}

        <div className="student-timetable-header">
          <div>
            <h1>My Timetable</h1>

            <p>View your weekly class schedule.</p>
          </div>

          <div className="timetable-header-icon">
            <FaCalendarAlt />
          </div>
        </div>

        {/* =========================================
                    TIMETABLE CARD
                ========================================== */}

        <div className="timetable-card">
          <div className="timetable-card-header">
            <h2>Weekly Schedule</h2>

            <span>Current Semester</span>
          </div>

          {/* =====================================
                        EMPTY STATE
                    ====================================== */}

          {timetable.length === 0 ? (
            <div className="timetable-empty">
              <h3>No timetable available</h3>

              <p>
                No classes have been generated for your department and semester
                yet.
              </p>
            </div>
          ) : (
            /* ==================================
                           TABLE
                        =================================== */

            <div className="timetable-table-container">
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th>Day</th>

                    <th>Time</th>

                    <th>Subject</th>

                    <th>Faculty</th>

                    <th>Room</th>
                  </tr>
                </thead>

                <tbody>
                  {timetable.map((item) => (
                    <tr key={item._id}>
                      {/* DAY */}

                      <td>
                        <strong>{item.day}</strong>
                      </td>

                      {/* TIME */}

                      <td>
                        <div className="timetable-detail">
                          <FaClock />

                          <span>{item.time}</span>
                        </div>
                      </td>

                      {/* SUBJECT */}

                      <td>
                        <div className="timetable-subject-wrapper">
                          <strong className="timetable-subject">
                            {item.subject}
                          </strong>

                          {item.subjectCode && (
                            <span className="timetable-subject-code">
                              {item.subjectCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* FACULTY */}

                      <td>
                        <div className="timetable-detail">
                          <FaUserTie />

                          <span>{item.faculty}</span>
                        </div>
                      </td>

                      {/* ROOM */}

                      <td>
                        <div className="timetable-detail">
                          <FaDoorOpen />

                          <span>{item.room}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default MyTimetable;
