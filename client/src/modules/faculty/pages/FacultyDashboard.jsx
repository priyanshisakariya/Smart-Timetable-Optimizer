import { useState, useEffect } from "react";
import FacultyLayout from "../FacultyLayout";

import { FaBook, FaCalendarAlt, FaChalkboardTeacher } from "react-icons/fa";

import axios from "axios";

import "./FacultyDashboard.css";

function FacultyDashboard() {
  // ======================================================
  // TIMETABLE DATA
  // ======================================================

  const [timetable, setTimetable] = useState([]);

  const [loading, setLoading] = useState(true);

  // ======================================================
  // GET TIMETABLE
  // ======================================================

 useEffect(() => {
  const fetchTimetable = async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const facultyId = user?.id || user?._id || localStorage.getItem("facultyId") || localStorage.getItem("userId");

      if (!facultyId) {
        console.error("Faculty ID not found");
        setTimetable([]);
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/auth/timetable?facultyId=${encodeURIComponent(facultyId)}`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.timetable || [];

      console.log("Faculty Dashboard Timetable:", data);
      setTimetable(data);
    } catch (error) {
      console.error("Fetch Dashboard Timetable Error:", error);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  fetchTimetable();
}, []);
  // ======================================================
  // ASSIGNED SUBJECTS
  // ======================================================

  const assignedSubjects = [
    ...new Set(timetable.map((item) => item.subject).filter(Boolean)),
  ];

  // ======================================================
// TODAY
// ======================================================

const today = new Date().toLocaleDateString("en-US", {
    weekday: "long"
});


// ======================================================
// TODAY'S CLASSES
// ======================================================

const todayClasses = timetable.filter((item) => {
    return (
        item.day &&
        item.day.toString().trim().toLowerCase() ===
        today.trim().toLowerCase()
    );
});
  // ======================================================
  // TOTAL CLASSES
  // ======================================================

  const totalClasses = timetable.length;

  // ======================================================
  // TIME FORMAT
  // ======================================================

  const formatTime = (time) => {
    if (!time) {
      return "";
    }

    // If backend stores 09:00
    // convert to 09:00 AM

    const [hours, minutes] = time.split(":");

    let hour = parseInt(hours);

    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${String(hour).padStart(2, "0")}:${minutes} ${period}`;
  };

  return (
    <FacultyLayout>
      <div className="faculty-dashboard">
        {/* ==================================================
                    HEADER
                ================================================== */}

        <div className="faculty-welcome">
          <h1>Faculty Dashboard</h1>

          <p>Welcome back! Here is your teaching overview.</p>
        </div>

        {/* ==================================================
                    SUMMARY CARDS
                ================================================== */}

        <div className="faculty-cards">
          {/* ASSIGNED SUBJECTS */}

          <div className="faculty-card">
            <div className="card-icon">
              <FaBook />
            </div>

            <div className="card-content">
              <h3>Assigned Subjects</h3>

              <p>{assignedSubjects.length}</p>
            </div>
          </div>

          {/* TODAY'S CLASSES */}

          <div className="faculty-card">
            <div className="card-icon">
              <FaCalendarAlt />
            </div>

            <div className="card-content">
              <h3>Today's Classes</h3>

              <p>{todayClasses.length}</p>
            </div>
          </div>

          {/* TOTAL CLASSES */}

          <div className="faculty-card">
            <div className="card-icon">
              <FaChalkboardTeacher />
            </div>

            <div className="card-content">
              <h3>Total Classes</h3>

              <p>{totalClasses}</p>
            </div>
          </div>
        </div>

        {/* ==================================================
                    TODAY'S SCHEDULE
                ================================================== */}

        <div className="schedule-section">
          <div className="section-header">
            <h2>Today's Schedule</h2>

            <p>Your classes scheduled for today</p>
          </div>

          {/* LOADING */}

          {loading && <p>Loading today's schedule...</p>}

          {/* NO CLASSES */}

          {!loading && todayClasses.length === 0 && (
            <div className="schedule-list">
              <p>No classes scheduled for today.</p>
            </div>
          )}

          {/* TODAY'S CLASSES */}

          {!loading && todayClasses.length > 0 && (
            <div className="schedule-list">
              {todayClasses.map((item, index) => (
                <div className="schedule-item" key={item._id || index}>
                  {/* TIME */}

                  <div className="schedule-time">
                    {item.time ? (
                      <strong>{item.time}</strong>
                    ) : (
                      <>
                        <strong>
                          {item.startTime ? formatTime(item.startTime) : ""}
                        </strong>

                        <span>
                          {item.endTime ? formatTime(item.endTime) : ""}
                        </span>
                      </>
                    )}
                  </div>

                  {/* DETAILS */}

                  <div className="schedule-details">
                    <h3>{item.subject}</h3>

                    <p>
                      {item.room ? `Room ${item.room}` : "Room not assigned"}

                      {" • "}

                      {item.department
                        ? `${item.department} - Semester ${item.semester}`
                        : `Semester ${item.semester || "N/A"}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FacultyLayout>
  );
}

export default FacultyDashboard;
