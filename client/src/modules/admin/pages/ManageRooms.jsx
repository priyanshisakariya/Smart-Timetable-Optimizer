import { useEffect, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import {
  FaDoorOpen,
  FaBuilding,
  FaUsers,
  FaCheckCircle,
  FaTimes,
  FaEdit,
  FaTrash,
  FaPlus,
  FaExclamationTriangle,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import ActionButtons from "../../../components/ActionButtons";
import "./ManageRoom.css";

function ManageRoom() {
  // Room form state
  const [room, setRoom] = useState({
    roomNumber: "",
    roomType: "",
    capacity: "",
    building: "",
    status: "active",
  });

  // State
  const [roomList, setRoomList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ======================================================
  // GET ALL ROOMS
  // ======================================================
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/auth/rooms");
      const data = await response.json();
      if (response.ok) {
        setRoomList(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch rooms:", data.message);
        setRoomList([]);
      }
    } catch (error) {
      console.error("Fetch Rooms Error:", error);
      setRoomList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  // Handle Input Changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setRoom((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage("");
  };

  // ======================================================
  // ADD / UPDATE ROOM
  // ======================================================
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (!room.roomNumber || !room.roomType || !room.capacity || !room.building) {
      setErrorMessage("Please fill all required room fields.");
      return;
    }

    if (Number(room.capacity) <= 0) {
      setErrorMessage("Room capacity must be a positive number.");
      return;
    }

    setLoading(true);

    try {
      if (editId !== null) {
        // UPDATE
        const response = await fetch(`http://localhost:5000/api/auth/rooms/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(room),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccessMessage("Room updated successfully!");
          setEditId(null);
          setRoom({
            roomNumber: "",
            roomType: "",
            capacity: "",
            building: "",
            status: "active",
          });
          fetchRooms();
        } else {
          setErrorMessage(data.message || "Failed to update room.");
        }
      } else {
        // ADD
        const response = await fetch("http://localhost:5000/api/auth/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(room),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccessMessage("Room added successfully!");
          setRoom({
            roomNumber: "",
            roomType: "",
            capacity: "",
            building: "",
            status: "active",
          });
          fetchRooms();
        } else {
          setErrorMessage(data.message || "Failed to add room.");
        }
      }
    } catch (error) {
      console.error("Save Room Error:", error);
      setErrorMessage("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Room Status
  const handleToggleStatus = async (item) => {
    const newStatus = item.status === "inactive" ? "active" : "inactive";
    try {
      const response = await fetch(`http://localhost:5000/api/auth/rooms/${item._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`Room ${item.roomNumber} is now ${newStatus}.`);
        fetchRooms();
      } else {
        setErrorMessage(data.message || "Failed to update room status.");
      }
    } catch (error) {
      console.error("Toggle Status Error:", error);
      setErrorMessage("Unable to connect to server.");
    }
  };

  // Edit Action
  const handleEdit = (item) => {
    setRoom({
      roomNumber: item.roomNumber || "",
      roomType: item.roomType || "",
      capacity: item.capacity || "",
      building: item.building || "",
      status: item.status || "active",
    });
    setEditId(item._id);
    setErrorMessage("");
    setSuccessMessage("");
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  // Delete Action
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this room?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/auth/rooms/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage("Room deleted successfully.");
        if (editId === id) {
          setEditId(null);
          setRoom({
            roomNumber: "",
            roomType: "",
            capacity: "",
            building: "",
            status: "active",
          });
        }
        fetchRooms();
      } else {
        setErrorMessage(data.message || "Failed to delete room.");
      }
    } catch (error) {
      console.error("Delete Room Error:", error);
      setErrorMessage("Unable to connect to server.");
    }
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditId(null);
    setRoom({
      roomNumber: "",
      roomType: "",
      capacity: "",
      building: "",
      status: "active",
    });
    setErrorMessage("");
  };

  // Filtered List
  const displayedList = roomList.filter((r) => {
    const matchType = !filterType || r.roomType?.toLowerCase() === filterType.toLowerCase();
    const matchStatus =
      !filterStatus || (r.status || "active").toLowerCase() === filterStatus.toLowerCase();
    return matchType && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="admin-room-page">
        {/* ==================================================
            1. PAGE HEADER
        ================================================== */}
        <div className="room-top-header">
          <div className="header-text-group">
            <h1>Manage Rooms</h1>
            <p>Configure classrooms and laboratories where lectures and practical sessions are conducted.</p>
          </div>
        </div>

        {/* ==================================================
            2. ADD / EDIT ROOM FORM
        ================================================== */}
        <div className="room-form-card">
          <div className="form-card-title">
            <h2>{editId !== null ? "Edit Room" : "Add Room"}</h2>
            <p>
              {editId !== null
                ? "Update room specifications and availability status below."
                : "Enter room number, type, capacity, and building details."}
            </p>
          </div>

          {errorMessage && (
            <div className="rm-alert rm-alert-error">
              <FaExclamationTriangle />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rm-alert rm-alert-success">
              <FaCheckCircle />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="room-input-form">
            <div className="form-fields-grid">
              {/* Room Number / Name */}
              <div className="rm-form-group">
                <label htmlFor="room-number">
                  Room Number / Name <span className="required-star">*</span>
                </label>
                <input
                  id="room-number"
                  type="text"
                  name="roomNumber"
                  placeholder="e.g. 101 or Lab-201"
                  value={room.roomNumber}
                  onChange={handleChange}
                  required
                />
                <span className="field-helper">Example: 101 or Lab-201</span>
              </div>

              {/* Room Type */}
              <div className="rm-form-group">
                <label htmlFor="room-type">
                  Room Type <span className="required-star">*</span>
                </label>
                <select
                  id="room-type"
                  name="roomType"
                  value={room.roomType}
                  onChange={handleChange}
                  required
                >
                  <option value="">[ Select Room Type ]</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Auditorium">Auditorium</option>
                </select>
                <span className="field-helper">Select type of room facility</span>
              </div>

              {/* Capacity */}
              <div className="rm-form-group">
                <label htmlFor="room-capacity">
                  Capacity <span className="required-star">*</span>
                </label>
                <input
                  id="room-capacity"
                  type="number"
                  name="capacity"
                  min="1"
                  placeholder="e.g. 60"
                  value={room.capacity}
                  onChange={handleChange}
                  required
                />
                <span className="field-helper">Maximum student seating capacity</span>
              </div>

              {/* Building */}
              <div className="rm-form-group">
                <label htmlFor="room-building">
                  Building / Block <span className="required-star">*</span>
                </label>
                <input
                  id="room-building"
                  type="text"
                  name="building"
                  placeholder="e.g. Main Block or Block A"
                  value={room.building}
                  onChange={handleChange}
                  required
                />
                <span className="field-helper">Example: Main Block or Block A</span>
              </div>

              {/* Status */}
              <div className="rm-form-group">
                <label htmlFor="room-status">
                  Status <span className="required-star">*</span>
                </label>
                <select
                  id="room-status"
                  name="status"
                  value={room.status || "active"}
                  onChange={handleChange}
                  required
                >
                  <option value="active">Active (Available for scheduling)</option>
                  <option value="inactive">Inactive (Excluded from scheduling)</option>
                </select>
                <span className="field-helper">Control scheduling availability</span>
              </div>
            </div>

            <div className="form-button-row">
              <button type="submit" className="btn-rm-primary" disabled={loading}>
                {loading ? (
                  "Saving..."
                ) : editId === null ? (
                  <>
                    <FaPlus /> Add Room
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Update Room
                  </>
                )}
              </button>

              {editId !== null && (
                <button
                  type="button"
                  className="btn-rm-cancel"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  <FaTimes /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ==================================================
            3. CONFIGURED ROOMS SECTION
        ================================================== */}
        <div className="room-list-card">
          <div className="list-section-header">
            <div>
              <h2>Configured Rooms ({roomList.length})</h2>
              <p>These are the classrooms and laboratories currently available for timetable scheduling.</p>
            </div>

            {/* Filter Controls */}
            <div className="room-filter-group">
              <div className="filter-item">
                <label htmlFor="filter-type-select">Type:</label>
                <select
                  id="filter-type-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Auditorium">Auditorium</option>
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="filter-status-select">Status:</label>
                <select
                  id="filter-status-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {loading && roomList.length === 0 ? (
            <div className="rm-loading-state">
              <p>Loading configured rooms...</p>
            </div>
          ) : displayedList.length === 0 ? (
            <div className="rm-empty-state">
              <FaDoorOpen className="empty-state-icon" />
              <h3>No Rooms Configured</h3>
              <p>
                Add the classrooms and laboratories available in your college. The timetable generator will use active rooms when creating schedules.
              </p>
            </div>
          ) : (
            <div className="rm-table-responsive">
              <table className="rm-records-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Building</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedList.map((item) => {
                    const isActive = item.status !== "inactive";

                    return (
                      <tr key={item._id} className={editId === item._id ? "row-being-edited" : ""}>
                        <td>
                          <div className="room-name-cell">
                            <FaDoorOpen className="room-door-icon" />
                            <strong>{item.roomNumber}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="room-type-badge">{item.roomType}</span>
                        </td>
                        <td>
                          <span className="capacity-badge">
                            <FaUsers /> {item.capacity} seats
                          </span>
                        </td>
                        <td>
                          <div className="building-cell">
                            <FaBuilding className="building-icon" />
                            <span>{item.building}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`status-pill-btn ${isActive ? "active" : "inactive"}`}
                            onClick={() => handleToggleStatus(item)}
                            title={`Click to switch status to ${isActive ? "Inactive" : "Active"}`}
                          >
                            {isActive ? <FaToggleOn /> : <FaToggleOff />}
                            <span>{isActive ? "Active" : "Inactive"}</span>
                          </button>
                        </td>
                        <td>
                          <ActionButtons
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDelete(item._id)}
                            editTitle={`Edit Room ${item.roomNumber}`}
                            deleteTitle={`Delete Room ${item.roomNumber}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default ManageRoom;
