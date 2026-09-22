import { useEffect, useState } from "react";
import StudentLayout from "../StudentLayout";
import {
  FaBook,
  FaCalendarAlt,
  FaClock,
  FaBuilding,
  FaGraduationCap,
  FaLayerGroup,
  FaUserTie,
  FaDoorOpen,
} from "react-icons/fa";
import "./StudentDashboard.css";

function StudentDashboard() {
  const [timetable, setTimetable] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    name: "",
    department: "",
    semester: "",
    className: "",
    enrollmentNo: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const timeToMinutes = (time) => {
    if (!time) return 0;
    const parts = String(time).trim().split(":");
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  };

  useEffect(() => {
    const fetchStudentDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const studentId = user?.id || user?._id || localStorage.getItem("userId");

        if (!studentId) {
          throw new Error("Student ID not found. Please login again.");
        }

        // Fetch fresh student profile
        const profRes = await fetch(`http://localhost:5000/api/auth/student-profile/${studentId}`);
        const profData = await profRes.json();
        if (profRes.ok && profData.student) {
          setStudentInfo(profData.student);
        } else {
          setStudentInfo(user || {});
        }

        // Fetch timetable for student
        const response = await fetch(
          `http://localhost:5000/api/auth/timetable?studentId=${encodeURIComponent(studentId)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch timetable.");
        }

        const timetableData = Array.isArray(data) ? data : data.timetable || [];
        setTimetable(timetableData);

        // Real-world dynamic current day
        const now = new Date();
        const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
        const currentDayLower = currentDay.toLowerCase();

        const today = timetableData
          .filter((item) => String(item.day || "").trim().toLowerCase() === currentDayLower)
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        setTodayClasses(today);

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const currentDayIndex = now.getDay();
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
        let upcoming = null;

        const upcomingToday = today.filter(
          (item) => timeToMinutes(item.startTime) >= currentTimeMinutes
        );

        if (upcomingToday.length > 0) {
          upcoming = { ...upcomingToday[0], displayDay: "Today" };
        } else {
          for (let offset = 1; offset <= 7; offset++) {
            const futureDay = days[(currentDayIndex + offset) % 7];
            const futureClasses = timetableData
              .filter(
                (item) =>
                  String(item.day || "").trim().toLowerCase() === futureDay.toLowerCase()
              )
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

            if (futureClasses.length > 0) {
              upcoming = { ...futureClasses[0], displayDay: futureDay };
              break;
            }
          }
        }

        setNextClass(upcoming);
      } catch (err) {
        console.error("Student Dashboard Error:", err);
        setError(err.message || "Failed to load dashboard.");
        setTimetable([]);
        setTodayClasses([]);
        setNextClass(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDashboard();
  }, []);

  const uniqueSubjects = [
    ...new Set(timetable.map((item) => item.subject).filter(Boolean)),
  ];

  return (
    <StudentLayout>
      <div className="student-dashboard">
        {/* WELCOME */}
        <div className="student-welcome">
          <div>
            <h1>Welcome, {studentInfo.name || "Student"}!</h1>
            <p>
              {studentInfo.department || "Academic Department"} • Semester{" "}
              {studentInfo.semester || "N/A"}{" "}
              {studentInfo.className && `• Class: ${studentInfo.className}`}
            </p>
          </div>
          <div className="enroll-badge">
            Enrollment: {studentInfo.enrollmentNo || "Active Student"}
          </div>
        </div>

        {error && <div className="student-error-banner">{error}</div>}

        {/* SUMMARY CARDS */}
        <div className="student-cards">
          <div className="student-card">
            <div className="student-card-icon card-icon-teal">
              <FaBuilding />
            </div>
            <div>
              <h3>My Department</h3>
              <p className="card-text-main">{studentInfo.department || "N/A"}</p>
            </div>
          </div>

          <div className="student-card">
            <div className="student-card-icon card-icon-indigo">
              <FaGraduationCap />
            </div>
            <div>
              <h3>My Semester</h3>
              <p className="card-text-main">Semester {studentInfo.semester || "1"}</p>
            </div>
          </div>

          <div className="student-card">
            <div className="student-card-icon card-icon-amber">
              <FaLayerGroup />
            </div>
            <div>
              <h3>My Class / Division</h3>
              <p className="card-text-main">{studentInfo.className || "Default"}</p>
            </div>
          </div>

          <div className="student-card">
            <div className="student-card-icon card-icon-blue">
              <FaBook />
            </div>
            <div>
              <h3>Total Subjects</h3>
              <p className="card-text-main">{uniqueSubjects.length} Courses</p>
            </div>
          </div>

          <div className="student-card">
            <div className="student-card-icon card-icon-emerald">
              <FaCalendarAlt />
            </div>
            <div>
              <h3>Today's Classes</h3>
              <p className="card-text-main">{todayClasses.length} Scheduled</p>
            </div>
          </div>

          <div className="student-card">
            <div className="student-card-icon card-icon-purple">
              <FaClock />
            </div>
            <div>
              <h3>Next Class</h3>
              <p className="card-text-main">
                {nextClass ? `${nextClass.startTime} (${nextClass.displayDay})` : "No upcoming class"}
              </p>
            </div>
          </div>
        </div>

        {/* TODAY'S SCHEDULE */}
        <div className="student-schedule">
          <div className="schedule-header">
            <h2>
              Today's Schedule (
              {new Date().toLocaleDateString("en-US", { weekday: "long" })})
            </h2>
            <p>Your scheduled lectures for today</p>
          </div>

          {loading ? (
            <p className="loading-txt">Loading schedule...</p>
          ) : todayClasses.length === 0 ? (
            <div className="student-schedule-empty">
              <h3>No classes scheduled today</h3>
              <p>
                Enjoy your free time! No lectures scheduled for{" "}
                {new Date().toLocaleDateString("en-US", { weekday: "long" })}.
              </p>
            </div>
          ) : (
            <div className="student-schedule-list">
              {todayClasses.map((item, index) => (
                <div className="student-schedule-item" key={item._id || index}>
                  <div className="student-time">
                    <strong>{item.startTime}</strong>
                    <span>{item.endTime}</span>
                  </div>

                  <div className="student-class">
                    <h3>{item.subject}</h3>
                    <p>
                      <FaDoorOpen /> Room {item.room} • <FaUserTie /> Faculty: {item.faculty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UPCOMING CLASS DETAILS */}
        {nextClass && (
          <div className="student-schedule">
            <div className="schedule-header">
              <h2>Next Upcoming Period</h2>
              <p>Next active lecture on your academic calendar</p>
            </div>

            <div className="student-schedule-list">
              <div className="student-schedule-item next-class-highlight">
                <div className="student-time">
                  <strong>{nextClass.startTime}</strong>
                  <span>{nextClass.endTime}</span>
                </div>

                <div className="student-class">
                  <h3>{nextClass.subject}</h3>
                  <p>
                    <strong>{nextClass.displayDay}</strong> • <FaDoorOpen /> Room {nextClass.room} •{" "}
                    <FaUserTie /> {nextClass.faculty}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default StudentDashboard;
