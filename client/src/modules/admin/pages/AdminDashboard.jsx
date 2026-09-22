import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import {
  FaBuilding,
  FaGraduationCap,
  FaLayerGroup,
  FaBook,
  FaUserTie,
  FaUsers,
  FaClock,
  FaDoorOpen,
  FaCalendarAlt,
  FaSync,
  FaArrowRight,
} from "react-icons/fa";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    departments: 0,
    semesters: 0,
    classes: 0,
    subjects: 0,
    faculty: 0,
    students: 0,
    timeSlots: 0,
    rooms: 0,
    timetable: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/auth/admin-dashboard");
      const data = await response.json();

      if (response.ok) {
        setDashboardData({
          departments: data.departmentCount ?? data.departments ?? 0,
          semesters: data.semesterCount ?? data.semesters ?? 0,
          classes: data.classCount ?? data.classes ?? 0,
          subjects: data.subjectCount ?? data.subjects ?? 0,
          faculty: data.facultyCount ?? data.faculty ?? 0,
          students: data.studentCount ?? data.students ?? 0,
          timeSlots: data.timeslotCount ?? data.timeSlots ?? 0,
          rooms: data.roomCount ?? data.rooms ?? 0,
          timetable: data.timetableCount ?? data.timetable ?? 0,
        });
      }
    } catch (error) {
      console.error("Fetch Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const handleRefresh = () => fetchDashboard();
    window.addEventListener("timetableGenerated", handleRefresh);
    window.addEventListener("timeSlotChanged", handleRefresh);
    return () => {
      window.removeEventListener("timetableGenerated", handleRefresh);
      window.removeEventListener("timeSlotChanged", handleRefresh);
    };
  }, [fetchDashboard]);

  return (
    <AdminLayout>
      <div className="admin-dashboard-page">
        {/* HEADER */}
        <div className="dash-header">
          <div>
            <h1>College Portal Administration</h1>
            <p>Real-time analytics and management overview of academic entities and scheduled timetables.</p>
          </div>

          <button className="refresh-btn" onClick={fetchDashboard}>
            <FaSync className={loading ? "spin-icon" : ""} /> Refresh Data
          </button>
        </div>

        {/* STATISTICS CARDS GRID */}
        <div className="dash-cards-grid">
          {/* Departments */}
          <div className="stat-card stat-teal">
            <div className="stat-icon-wrapper">
              <FaBuilding />
            </div>
            <div className="stat-info">
              <h3>Departments</h3>
              <h2>{loading ? "..." : dashboardData.departments}</h2>
              <Link to="/admin/departments" className="stat-link">
                Manage Departments <FaArrowRight />
              </Link>
            </div>
          </div>

          {/* Semesters */}
          <div className="stat-card stat-indigo">
            <div className="stat-icon-wrapper">
              <FaGraduationCap />
            </div>
            <div className="stat-info">
              <h3>Semesters</h3>
              <h2>{loading ? "..." : dashboardData.semesters}</h2>
              <Link to="/admin/semesters" className="stat-link">
                Manage Semesters <FaArrowRight />
              </Link>
            </div>
          </div>

          {/* Classes */}
          <div className="stat-card stat-amber">
            <div className="stat-icon-wrapper">
              <FaLayerGroup />
            </div>
            <div className="stat-info">
              <h3>Classes / Divisions</h3>
              <h2>{loading ? "..." : dashboardData.classes}</h2>
              <Link to="/admin/classes" className="stat-link">
                Manage Classes <FaArrowRight />
              </Link>
            </div>
          </div>

          {/* Subjects */}
          <div className="stat-card stat-blue">
            <div className="stat-icon-wrapper">
              <FaBook />
            </div>
            <div className="stat-info">
              <h3>Academic Subjects</h3>
              <h2>{loading ? "..." : dashboardData.subjects}</h2>
              <Link to="/admin/subjects" className="stat-link">
                Manage Subjects <FaArrowRight />
              </Link>
            </div>
          </div>

          {/* Faculty */}
          <div className="stat-card stat-purple">
            <div className="stat-icon-wrapper">
              <FaUserTie />
            </div>
            <div className="stat-info">
              <h3>Faculty Members</h3>
              <h2>{loading ? "..." : dashboardData.faculty}</h2>
              <Link to="/admin/faculty" className="stat-link">
                Manage Faculty <FaArrowRight />
              </Link>
            </div>
          </div>

          {/* Students */}
          <div className="stat-card stat-emerald">
            <div className="stat-icon-wrapper">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>Enrolled Students</h3>
              <h2>{loading ? "..." : dashboardData.students}</h2>
              <Link to="/admin/students" className="stat-link">
                Manage Students <FaArrowRight />
              </Link>
            </div>
          </div>

          {/* Time Slots */}
          <div className="stat-card stat-cyan">
            <div className="stat-icon-wrapper">
              <FaClock />
            </div>
            <div className="stat-info">
              <h3>Active Time Slots</h3>
              <h2>{loading ? "..." : dashboardData.timeSlots}</h2>
              <Link to="/admin/timeslots" className="stat-link">
                Manage Time Slots <FaArrowRight />
              </Link>
            </div>
          </div>

          {/* Rooms */}
          <div className="stat-card stat-rose">
            <div className="stat-icon-wrapper">
              <FaDoorOpen />
            </div>
            <div className="stat-info">
              <h3>Rooms & Labs</h3>
              <h2>{loading ? "..." : dashboardData.rooms}</h2>
              <Link to="/admin/rooms" className="stat-link">
                Manage Rooms <FaArrowRight />
              </Link>
            </div>
          </div>

          {/* Generated Timetable */}
          <div className="stat-card stat-primary">
            <div className="stat-icon-wrapper">
              <FaCalendarAlt />
            </div>
            <div className="stat-info">
              <h3>Scheduled Lectures</h3>
              <h2>
                {loading
                  ? "..."
                  : dashboardData.timetable > 0
                  ? `${dashboardData.timetable} Generated`
                  : "0 (Not Generated)"}
              </h2>
              <Link to="/admin/view-timetable" className="stat-link">
                View Timetable <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS BANNER */}
        <div className="quick-actions-banner">
          <div>
            <h2>Ready to generate your college timetable?</h2>
            <p>The optimizer uses automatic constraint satisfaction to eliminate faculty, room, and division clashes.</p>
          </div>
          <Link to="/admin/timetable" className="cta-generate-btn">
            <FaCalendarAlt /> Launch Generator
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
