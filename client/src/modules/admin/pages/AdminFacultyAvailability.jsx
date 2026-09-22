import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import { FaCalendarCheck, FaClock, FaUserTie, FaFilter, FaTrash, FaPlus } from "react-icons/fa";
import "./AdminFacultyAvailability.css";

function AdminFacultyAvailability() {
  const [availabilityList, setAvailabilityList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [loading, setLoading] = useState(false);

  // New availability form state for Admin
  const [newAvail, setNewAvail] = useState({
    facultyId: "",
    day: "Monday",
    startTime: "09:00",
    endTime: "12:00",
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch Faculty List
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/faculty")
      .then((res) => res.json())
      .then((data) => {
        if (data.faculty) {
          setFacultyList(data.faculty);
          if (data.faculty.length > 0) {
            setNewAvail((prev) => ({ ...prev, facultyId: data.faculty[0]._id }));
          }
        }
      })
      .catch(console.error);
  }, []);

  // Fetch Availability List
  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const url = filterFaculty
        ? `http://localhost:5000/api/auth/availability?facultyId=${encodeURIComponent(filterFaculty)}`
        : "http://localhost:5000/api/auth/availability";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setAvailabilityList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch Availability Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [filterFaculty]);

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!newAvail.facultyId || !newAvail.day || !newAvail.startTime || !newAvail.endTime) {
      alert("Please fill all required availability fields");
      return;
    }

    try {
      const selectedFac = facultyList.find((f) => f._id === newAvail.facultyId);
      const res = await fetch("http://localhost:5000/api/auth/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAvail,
          facultyName: selectedFac ? selectedFac.name : "",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Faculty availability slot added successfully!");
        setShowAddModal(false);
        fetchAvailability();
      } else {
        alert(data.message || "Failed to add availability");
      }
    } catch (err) {
      console.error("Save Availability Error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this availability slot?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/availability/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Availability slot removed");
        fetchAvailability();
      }
    } catch (err) {
      console.error("Delete Availability Error:", err);
    }
  };

  const displayedList = filterDay
    ? availabilityList.filter((a) => a.day?.toLowerCase() === filterDay.toLowerCase())
    : availabilityList;

  return (
    <AdminLayout>
      <div className="admin-faculty-avail-page">
        {/* Header */}
        <div className="avail-header">
          <div>
            <h1>Faculty Availability Management</h1>
            <p>Monitor and configure faculty teaching windows respected during timetable generation.</p>
          </div>
          <button className="btn-add-avail" onClick={() => setShowAddModal(true)}>
            <FaPlus /> Set Faculty Availability
          </button>
        </div>

        {/* Filters */}
        <div className="avail-filter-card">
          <div className="filter-group-row">
            <div className="control-group">
              <label>Filter by Faculty</label>
              <select value={filterFaculty} onChange={(e) => setFilterFaculty(e.target.value)}>
                <option value="">All Faculty Members</option>
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Filter by Day</label>
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
        </div>

        {/* List Section */}
        <div className="avail-content-card">
          <h2>Teaching Windows ({displayedList.length})</h2>

          {loading ? (
            <p className="loading-text">Loading availability records...</p>
          ) : displayedList.length === 0 ? (
            <div className="empty-state">
              <FaCalendarCheck className="empty-icon" />
              <h3>No Availability Windows Defined</h3>
              <p>Faculty members can submit their availability from their portal, or Admin can configure it above.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="avail-table">
                <thead>
                  <tr>
                    <th>Faculty Member</th>
                    <th>Day</th>
                    <th>Available Time Window</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedList.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className="fac-name-cell">
                          <FaUserTie className="fac-icon" />
                          <div>
                            <strong>{item.facultyName || "Faculty Member"}</strong>
                            {item.facultyEmail && <span className="fac-email">{item.facultyEmail}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="day-badge">{item.day}</span>
                      </td>
                      <td>
                        <span className="time-window-badge">
                          <FaClock /> {item.startTime} - {item.endTime}
                        </span>
                      </td>
                      <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDelete(item._id)}
                          title="Delete slot"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Admin Adding Availability */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Set Faculty Availability</h2>
              <form onSubmit={handleAddAvailability}>
                <div className="form-group">
                  <label>Select Faculty *</label>
                  <select
                    value={newAvail.facultyId}
                    onChange={(e) => setNewAvail({ ...newAvail, facultyId: e.target.value })}
                    required
                  >
                    {facultyList.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Day of Week *</label>
                  <select
                    value={newAvail.day}
                    onChange={(e) => setNewAvail({ ...newAvail, day: e.target.value })}
                    required
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      value={newAvail.startTime}
                      onChange={(e) => setNewAvail({ ...newAvail, startTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="time"
                      value={newAvail.endTime}
                      onChange={(e) => setNewAvail({ ...newAvail, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="submit-btn">
                    Save Availability
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminFacultyAvailability;
