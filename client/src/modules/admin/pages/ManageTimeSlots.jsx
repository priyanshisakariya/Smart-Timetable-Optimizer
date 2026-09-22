import { useEffect, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import {
  FaClock,
  FaCalendarAlt,
  FaLightbulb,
  FaExclamationTriangle,
  FaEdit,
  FaTrash,
  FaPlus,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";
import ActionButtons from "../../../components/ActionButtons";
import "./ManageTimeSlot.css";

// Helper: Convert "HH:mm" (24h) to minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper: Convert 24h string to 12h display string
const formatTime12h = (time24) => {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const formattedHour = h < 10 ? `0${h}` : `${h}`;
  return `${formattedHour}:${m} ${ampm}`;
};

function ManageTimeSlot() {
  const [timeSlot, setTimeSlot] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });

  const [timeSlotList, setTimeSlotList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterDay, setFilterDay] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/auth/timeslots");
      const data = await response.json();
      if (response.ok) {
        setTimeSlotList(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch time slots:", data.message);
        setTimeSlotList([]);
      }
    } catch (error) {
      console.error("Fetch Time Slots Error:", error);
      setTimeSlotList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTimeSlot((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!timeSlot.day || !timeSlot.startTime || !timeSlot.endTime) {
      setErrorMessage("Please select a day, start time, and end time.");
      return;
    }

    const startMin = timeToMinutes(timeSlot.startTime);
    const endMin = timeToMinutes(timeSlot.endTime);

    if (startMin >= endMin) {
      setErrorMessage("End time must be after start time.");
      return;
    }

    const cleanDay = timeSlot.day.trim().toLowerCase();
    const existingOverlap = timeSlotList.find((slot) => {
      if (editId && slot._id === editId) return false;
      if (slot.day.trim().toLowerCase() !== cleanDay) return false;
      const sStart = timeToMinutes(slot.startTime);
      const sEnd = timeToMinutes(slot.endTime);
      return startMin < sEnd && endMin > sStart;
    });

    if (existingOverlap) {
      setErrorMessage(
        `This time slot overlaps with an existing ${timeSlot.day} time slot (${formatTime12h(
          existingOverlap.startTime
        )} – ${formatTime12h(existingOverlap.endTime)}).`
      );
      return;
    }

    setLoading(true);

    try {
      if (editId !== null) {
        const response = await fetch(
          `http://localhost:5000/api/auth/timeslots/${editId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(timeSlot),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setSuccessMessage("Time slot updated successfully!");
          setEditId(null);
          setTimeSlot({ day: "", startTime: "", endTime: "" });
          fetchTimeSlots();
        } else {
          setErrorMessage(data.message || "Failed to update time slot.");
        }
      } else {
        const response = await fetch(
          "http://localhost:5000/api/auth/timeslots",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(timeSlot),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setSuccessMessage("Time slot added successfully!");
          setTimeSlot({ day: "", startTime: "", endTime: "" });
          fetchTimeSlots();
        } else {
          setErrorMessage(data.message || "Failed to add time slot.");
        }
      }
    } catch (error) {
      console.error("Save Time Slot Error:", error);
      setErrorMessage("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setTimeSlot({
      day: item.day || "",
      startTime: item.startTime || "",
      endTime: item.endTime || "",
    });
    setEditId(item._id);
    setErrorMessage("");
    setSuccessMessage("");
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this time slot?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/timeslots/${id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Time slot deleted successfully.");
        if (editId === id) {
          setEditId(null);
          setTimeSlot({ day: "", startTime: "", endTime: "" });
        }
        fetchTimeSlots();
      } else {
        setErrorMessage(data.message || "Failed to delete time slot.");
      }
    } catch (error) {
      console.error("Delete Time Slot Error:", error);
      setErrorMessage("Unable to connect to server.");
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setTimeSlot({ day: "", startTime: "", endTime: "" });
    setErrorMessage("");
  };

  const displayedList = filterDay
    ? timeSlotList.filter(
        (s) => s.day?.toLowerCase() === filterDay.toLowerCase()
      )
    : timeSlotList;

  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const sortedList = [...displayedList].sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  return (
    <AdminLayout>
      <div className="admin-timeslot-page">
        {/* 1. PAGE HEADER */}
        <div className="timeslot-top-header">
          <div className="header-text-group">
            <h1>Manage Time Slots</h1>
            <p>
              Configure the regular teaching periods of the college used for
              automatic timetable generation.
            </p>
          </div>
        </div>

        {/* 2. ADD / EDIT TIME SLOT FORM */}
        <div className="timeslot-form-card">
          <div className="form-card-title">
            <h2>{editId !== null ? "Edit Time Slot" : "Add Teaching Period"}</h2>
            <p>
              {editId !== null
                ? "Modify the selected teaching period details below."
                : "Enter the day and start/end time for the college teaching period."}
            </p>
          </div>

          {errorMessage && (
            <div className="ts-alert ts-alert-error">
              <FaExclamationTriangle />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="ts-alert ts-alert-success">
              <FaCheckCircle />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="timeslot-input-form">
            <div className="form-fields-grid">
              <div className="ts-form-group">
                <label htmlFor="slot-day">
                  Day <span className="required-star">*</span>
                </label>
                <select
                  id="slot-day"
                  name="day"
                  value={timeSlot.day}
                  onChange={handleChange}
                  required
                >
                  <option value="">[ Select Day ]</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
                <span className="field-helper">Select day of the week</span>
              </div>

              <div className="ts-form-group">
                <label htmlFor="slot-start">
                  Start Time <span className="required-star">*</span>
                </label>
                <input
                  id="slot-start"
                  type="time"
                  name="startTime"
                  value={timeSlot.startTime}
                  onChange={handleChange}
                  required
                />
                <span className="field-helper">Select start time</span>
              </div>

              <div className="ts-form-group">
                <label htmlFor="slot-end">
                  End Time <span className="required-star">*</span>
                </label>
                <input
                  id="slot-end"
                  type="time"
                  name="endTime"
                  value={timeSlot.endTime}
                  onChange={handleChange}
                  required
                />
                <span className="field-helper">Select end time</span>
              </div>
            </div>

            <div className="form-example-helper">
              <FaLightbulb />
              <span>Example: Monday, 09:00 AM – 10:00 AM</span>
            </div>

            <div className="form-button-row">
              <button type="submit" className="btn-ts-primary" disabled={loading}>
                {loading ? (
                  "Saving..."
                ) : editId === null ? (
                  <>
                    <FaPlus /> Add Time Slot
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Update Time Slot
                  </>
                )}
              </button>

              {editId !== null && (
                <button
                  type="button"
                  className="btn-ts-cancel"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  <FaTimes /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 3. CONFIGURED TIME SLOTS SECTION */}
        <div className="timeslot-list-card">
          <div className="list-section-header">
            <div>
              <h2>Configured Time Slots ({timeSlotList.length})</h2>
              <p>
                These are the time periods currently available for timetable
                generation.
              </p>
            </div>

            <div className="day-filter-control">
              <label htmlFor="ts-day-filter">Filter by Day:</label>
              <select
                id="ts-day-filter"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
              >
                <option value="">All Days ({timeSlotList.length})</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
          </div>

          {loading && timeSlotList.length === 0 ? (
            <div className="ts-loading-state">
              <p>Loading configured time slots...</p>
            </div>
          ) : sortedList.length === 0 ? (
            <div className="ts-empty-state">
              <FaCalendarAlt className="empty-state-icon" />
              <h3>No Time Slots Configured</h3>
              <p>
                Add the college's regular teaching periods above. The timetable
                generator will use these periods when creating schedules.
              </p>
            </div>
          ) : (
            <div className="ts-table-responsive">
              <table className="ts-records-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Database Format (24h)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedList.map((item) => {
                    const startMin = timeToMinutes(item.startTime);
                    const endMin = timeToMinutes(item.endTime);
                    const durationMins = endMin - startMin;

                    return (
                      <tr
                        key={item._id}
                        className={
                          editId === item._id ? "row-being-edited" : ""
                        }
                      >
                        <td>
                          <span className="day-pill-badge">{item.day}</span>
                        </td>
                        <td>
                          <div className="time-range-display">
                            <FaClock className="ts-clock-icon" />
                            <span>
                              {formatTime12h(item.startTime)} –{" "}
                              {formatTime12h(item.endTime)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="duration-pill">
                            {durationMins > 0 ? `${durationMins} mins` : "—"}
                          </span>
                        </td>
                        <td>
                          <code className="db-format-code">
                            {item.startTime} - {item.endTime}
                          </code>
                        </td>
                        <td>
                          <ActionButtons
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDelete(item._id)}
                            editTitle={`Edit ${item.day} Slot`}
                            deleteTitle={`Delete ${item.day} Slot`}
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

export default ManageTimeSlot;
