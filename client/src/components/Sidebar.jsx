import {
  FaTachometerAlt,
  FaBuilding,
  FaGraduationCap,
  FaLayerGroup,
  FaBook,
  FaUserTie,
  FaClock,
  FaCalendarAlt,
  FaDoorOpen,
  FaUsers,
  FaUser,
  FaTable,
  FaCalendarCheck,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ role = "admin" }) {
  return (
    <aside className="sidebar">
      {/* ==========================================
          ADMIN SIDEBAR
      ========================================== */}
      {role === "admin" && (
        <>
          <div className="sidebar-title">Admin Portal</div>

          <nav className="sidebar-menu">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaTachometerAlt />
              <span>Dashboard</span>
            </NavLink>

            <div className="sidebar-section-heading">Academic Management</div>

            <NavLink
              to="/admin/departments"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaBuilding />
              <span>Manage Departments</span>
            </NavLink>

            <NavLink
              to="/admin/semesters"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaGraduationCap />
              <span>Manage Semesters</span>
            </NavLink>

            <NavLink
              to="/admin/classes"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaLayerGroup />
              <span>Manage Classes</span>
            </NavLink>

            <NavLink
              to="/admin/subjects"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaBook />
              <span>Manage Subjects</span>
            </NavLink>

            <NavLink
              to="/admin/faculty"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaUserTie />
              <span>Manage Faculty</span>
            </NavLink>

            <NavLink
              to="/admin/faculty-availability"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaCalendarCheck />
              <span>Faculty Availability</span>
            </NavLink>

            <NavLink
              to="/admin/timeslots"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaClock />
              <span>Manage Time Slots</span>
            </NavLink>

            <NavLink
              to="/admin/rooms"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaDoorOpen />
              <span>Manage Rooms</span>
            </NavLink>

            <NavLink
              to="/admin/students"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaUsers />
              <span>Manage Students</span>
            </NavLink>

            <div className="sidebar-section-heading">Timetable Management</div>

            <NavLink
              to="/admin/timetable"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaCalendarAlt />
              <span>Generate Timetable</span>
            </NavLink>

            <NavLink
              to="/admin/view-timetable"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaTable />
              <span>View Timetable</span>
            </NavLink>
          </nav>
        </>
      )}

      {/* ==========================================
          FACULTY SIDEBAR
      ========================================== */}
      {role === "faculty" && (
        <>
          <div className="sidebar-title">Faculty Portal</div>

          <nav className="sidebar-menu">
            <NavLink
              to="/faculty/dashboard"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaTachometerAlt />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/faculty/subjects"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaBook />
              <span>My Subjects</span>
            </NavLink>

            <NavLink
              to="/faculty/timetable"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaCalendarAlt />
              <span>My Timetable</span>
            </NavLink>

            <NavLink
              to="/faculty/availability"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaClock />
              <span>My Availability</span>
            </NavLink>

            <NavLink
              to="/faculty/profile"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaUser />
              <span>Profile</span>
            </NavLink>
          </nav>
        </>
      )}

      {/* ==========================================
          STUDENT SIDEBAR
      ========================================== */}
      {role === "student" && (
        <>
          <div className="sidebar-title">Student Portal</div>

          <nav className="sidebar-menu">
            <NavLink
              to="/student/dashboard"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaTachometerAlt />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/student/profile"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaUser />
              <span>My Profile</span>
            </NavLink>

            <NavLink
              to="/student/subjects"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaBook />
              <span>My Subjects</span>
            </NavLink>

            <NavLink
              to="/student/timetable"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaCalendarAlt />
              <span>My Timetable</span>
            </NavLink>
          </nav>
        </>
      )}
    </aside>
  );
}

export default Sidebar;
