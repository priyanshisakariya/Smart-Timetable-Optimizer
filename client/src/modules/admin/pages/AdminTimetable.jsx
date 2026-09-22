import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import {
  FaTable,
  FaCalendarAlt,
  FaFilter,
  FaRedo,
  FaPrint,
  FaTrash,
  FaClock,
  FaDoorOpen,
  FaUserTie,
  FaBook,
} from "react-icons/fa";
import "./AdminTimetable.css";

function AdminTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [loading, setLoading] = useState(false);

  // Fetch departments & faculty on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [deptRes, facRes] = await Promise.all([
          fetch("http://localhost:5000/api/auth/departments"),
          fetch("http://localhost:5000/api/auth/faculty"),
        ]);
        const deptData = await deptRes.json();
        const facData = await facRes.json();
        if (deptRes.ok) setDepartments(Array.isArray(deptData) ? deptData : []);
        if (facRes.ok) setFacultyList(Array.isArray(facData.faculty) ? facData.faculty : []);
      } catch (err) {
        console.error("Metadata Load Error:", err);
      }
    };
    loadMetadata();
  }, []);

  // Fetch cascading semesters & classes when department changes
  useEffect(() => {
    if (filterDept) {
      fetch(`http://localhost:5000/api/auth/semesters/by-department/${encodeURIComponent(filterDept)}`)
        .then((res) => res.json())
        .then((data) => setSemesters(Array.isArray(data) ? data : []))
        .catch(console.error);

      fetch(`http://localhost:5000/api/auth/classes?department=${encodeURIComponent(filterDept)}`)
        .then((res) => res.json())
        .then((data) => setClasses(Array.isArray(data) ? data : []))
        .catch(console.error);
    } else {
      setSemesters([]);
      setClasses([]);
    }
  }, [filterDept]);

  // Fetch timetable based on filters
  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDept) params.append("department", filterDept);
      if (filterSem) params.append("semester", filterSem);
      if (filterClass) params.append("className", filterClass);
      if (filterFaculty) params.append("facultyId", filterFaculty);

      const url = `http://localhost:5000/api/auth/timetable?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setTimetable(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch Timetable Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [filterDept, filterSem, filterClass, filterFaculty]);

  const handleClearFilters = () => {
    setFilterDept("");
    setFilterSem("");
    setFilterClass("");
    setFilterFaculty("");
    setFilterDay("");
  };

  const handleDeleteClassTimetable = async () => {
    if (!filterClass && !filterDept) {
      if (!window.confirm("Warning: This will clear ALL generated timetables across the entire institution. Proceed?")) return;
    } else {
      if (!window.confirm(`Clear timetable records for ${filterDept || ""} ${filterClass ? `(${filterClass})` : ""}?`)) return;
    }

    try {
      const params = new URLSearchParams();
      if (filterDept) params.append("department", filterDept);
      if (filterSem) params.append("semester", filterSem);
      if (filterClass) params.append("className", filterClass);

      const res = await fetch(`http://localhost:5000/api/auth/timetable?${params.toString()}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Timetable records cleared successfully");
        fetchTimetable();
      }
    } catch (err) {
      console.error("Delete Timetable Error:", err);
    }
  };

  // Filter by Day locally for instant viewing
  const displayedTimetable = filterDay
    ? timetable.filter((item) => item.day?.toLowerCase() === filterDay.toLowerCase())
    : timetable;

  // Grouping for Grid View (Day × Time Slots)
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const distinctSlots = Array.from(
    new Set(timetable.map((t) => `${t.startTime} - ${t.endTime}`))
  ).sort();

  return (
    <AdminLayout>
      <div className="admin-timetable-view-page">
        {/* Header */}
        <div className="view-tt-header">
          <div>
            <h1>View Master Timetable</h1>
            <p>Inspect, filter, and review scheduled lectures across departments, classes, and faculty.</p>
          </div>
          <div className="view-tt-actions">
            <button className="btn-print" onClick={() => window.print()}>
              <FaPrint /> Print / Export
            </button>
            <button className="btn-clear" onClick={handleDeleteClassTimetable} title="Clear displayed schedule">
              <FaTrash /> Clear Timetable
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="view-tt-filter-card">
          <div className="filter-title">
            <FaFilter />
            <span>Filter Timetable Schedule</span>
          </div>

          <div className="filter-controls-grid">
            <div className="control-group">
              <label>Department</label>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Semester</label>
              <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)}>
                <option value="">All Semesters</option>
                {semesters.length > 0 ? (
                  semesters.map((s) => (
                    <option key={s._id} value={s.semesterNumber}>
                      Semester {s.semesterNumber}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                  </>
                )}
              </select>
            </div>

            <div className="control-group">
              <label>Class / Division</label>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Faculty</label>
              <select value={filterFaculty} onChange={(e) => setFilterFaculty(e.target.value)}>
                <option value="">All Faculty</option>
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Day</label>
              <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
                <option value="">All Days</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
          </div>

          <div className="filter-footer">
            <div className="view-mode-tabs">
              <button
                className={`tab-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <FaTable /> Weekly Grid
              </button>
              <button
                className={`tab-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
              >
                <FaCalendarAlt /> Table List
              </button>
            </div>

            <button className="btn-reset" onClick={handleClearFilters}>
              <FaRedo /> Reset Filters
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="tt-card loading-state">
            <p>Loading timetable data...</p>
          </div>
        ) : displayedTimetable.length === 0 ? (
          <div className="tt-card empty-state">
            <FaCalendarAlt className="empty-icon" />
            <h2>No Timetable Records Found</h2>
            <p>No timetable entries match the selected filters. Use "Generate Timetable" to create schedules.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* WEEKLY MATRIX GRID VIEW */
          <div className="tt-card grid-view-container">
            <div className="grid-header-meta">
              <h2>
                Weekly Schedule Overview
                {filterClass && <span className="active-tag">Class: {filterClass}</span>}
                {filterDept && <span className="active-tag">Dept: {filterDept}</span>}
              </h2>
              <span className="count-tag">{displayedTimetable.length} Lectures Scheduled</span>
            </div>

            <div className="tt-matrix-wrapper">
              <table className="tt-matrix-table">
                <thead>
                  <tr>
                    <th className="th-day">Day</th>
                    {distinctSlots.map((slot) => (
                      <th key={slot} className="th-time">
                        <FaClock /> {slot}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daysOfWeek.map((day) => {
                    const dayLectures = displayedTimetable.filter((t) => t.day?.toLowerCase() === day.toLowerCase());
                    if (filterDay && day.toLowerCase() !== filterDay.toLowerCase()) return null;
                    if (dayLectures.length === 0 && !filterDay) return null;

                    return (
                      <tr key={day}>
                        <td className="matrix-day-cell">
                          <strong>{day}</strong>
                        </td>
                        {distinctSlots.map((slot) => {
                          const slotLectures = dayLectures.filter(
                            (t) => `${t.startTime} - ${t.endTime}` === slot
                          );

                          return (
                            <td key={slot} className="matrix-slot-cell">
                              {slotLectures.map((lec, idx) => (
                                <div className="lecture-card" key={lec._id || idx}>
                                  <div className="lec-subject">
                                    <FaBook /> {lec.subject}
                                  </div>
                                  <div className="lec-meta">
                                    {lec.subjectCode && <span className="code-chip">{lec.subjectCode}</span>}
                                    {lec.className && <span className="class-chip">{lec.className}</span>}
                                  </div>
                                  <div className="lec-detail">
                                    <FaUserTie /> {lec.faculty}
                                  </div>
                                  <div className="lec-detail">
                                    <FaDoorOpen /> Room: {lec.room}
                                  </div>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TABLE LIST VIEW */
          <div className="tt-card list-view-container">
            <div className="table-responsive">
              <table className="tt-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Subject Code</th>
                    <th>Faculty</th>
                    <th>Class / Division</th>
                    <th>Room</th>
                    <th>Department & Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTimetable.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>
                        <strong className="day-badge">{item.day}</strong>
                      </td>
                      <td>
                        <span className="time-badge">
                          <FaClock /> {item.time}
                        </span>
                      </td>
                      <td>
                        <strong>{item.subject}</strong>
                      </td>
                      <td>
                        <span className="code-badge">{item.subjectCode || "-"}</span>
                      </td>
                      <td>
                        <div className="faculty-info">
                          <FaUserTie /> {item.faculty}
                        </div>
                      </td>
                      <td>
                        <span className="class-badge">{item.className || "Standard"}</span>
                      </td>
                      <td>
                        <span className="room-badge">
                          <FaDoorOpen /> {item.room}
                        </span>
                      </td>
                      <td>
                        {item.department} - Sem {item.semester}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminTimetable;
