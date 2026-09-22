import { useState, useEffect } from "react";
import FacultyLayout from "../FacultyLayout";
import { FaClock, FaCheckCircle, FaTrashAlt } from "react-icons/fa";
import "./Availability.css";
import axios from "axios";

function Availability() {
  const [formData, setFormData] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });

  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getFacultyInfo = () => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const user = getFacultyInfo();
      const facultyId = user?.id || user?._id || localStorage.getItem("facultyId") || localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      if (facultyId) params.append("facultyId", facultyId);
      if (user?.email) params.append("facultyEmail", user.email);
      if (user?.name) params.append("facultyName", user.name);

      const response = await axios.get(
        `http://localhost:5000/api/auth/availability?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const availabilityData = Array.isArray(response.data)
        ? response.data
        : response.data.availability || [];

      setAvailability(availabilityData);
    } catch (error) {
      console.error("Fetch Availability Error:", error);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveAvailability = async () => {
    if (!formData.day || !formData.startTime || !formData.endTime) {
      alert("Please select day, start time and end time");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert("End time must be after start time");
      return;
    }

    setSaving(true);
    try {
      const user = getFacultyInfo();
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/auth/availability",
        {
          facultyId: user?.id || user?._id,
          facultyName: user?.name,
          facultyEmail: user?.email,
          day: formData.day,
          startTime: formData.startTime,
          endTime: formData.endTime,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      alert("Availability saved successfully!");
      setFormData({
        day: "",
        startTime: "",
        endTime: "",
      });
      fetchAvailability();
    } catch (error) {
      console.error("Save Availability Error:", error);
      alert(error.response?.data?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this availability slot?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/auth/availability/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchAvailability();
    } catch (error) {
      console.error("Delete Availability Error:", error);
      alert("Failed to delete availability slot");
    }
  };

  return (
    <FacultyLayout>
      <div className="availability-page">
        <div className="availability-header">
          <div>
            <h1>My Teaching Availability</h1>
            <p>Set the time windows when you are available for lectures. The algorithm will strictly respect your preferences.</p>
          </div>
          <div className="availability-icon">
            <FaClock />
          </div>
        </div>

        <div className="availability-form-card">
          <h2>Add Availability Window</h2>
          <div className="availability-form">
            <div className="form-group">
              <label>Day of the Week</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
              >
                <option value="">Select Day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>

            <div className="form-group">
              <label>Available From (Start Time)</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Available To (End Time)</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>

            <button
              className="save-availability"
              type="button"
              onClick={handleSaveAvailability}
              disabled={saving}
            >
              <FaCheckCircle />
              {saving ? "Saving..." : "Save Availability"}
            </button>
          </div>
        </div>

        <div className="availability-list-card">
          <div className="list-header">
            <div>
              <h2>Your Configured Availability</h2>
              <p>Active teaching windows currently registered for your account.</p>
            </div>
          </div>

          {loading && <p>Loading availability...</p>}

          {!loading && availability.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              <p>No specific availability restrictions set. (You are considered available for all standard slots).</p>
            </div>
          )}

          {!loading && availability.length > 0 && (
            <div className="availability-list">
              {availability.map((item, index) => (
                <div
                  className="availability-item"
                  key={item._id || index}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div className="day-name">{item.day}</div>
                  <div className="available-time">
                    <FaClock />
                    {item.startTime} - {item.endTime}
                  </div>
                  <button
                    onClick={() => handleDelete(item._id)}
                    style={{
                      background: "#fee2e2",
                      border: "none",
                      color: "#dc2626",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    title="Delete Slot"
                  >
                    <FaTrashAlt /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FacultyLayout>
  );
}

export default Availability;
