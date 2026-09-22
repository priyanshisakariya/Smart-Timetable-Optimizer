import { useState, useEffect } from "react";
import FacultyLayout from "../FacultyLayout";
import { FaCalendarAlt } from "react-icons/fa";
import "./MyTimetable.css";
import axios from "axios";

function MyTimetable() {
  // ======================================================
  // TIMETABLE LIST
  // ======================================================

  const [timetable, setTimetable] = useState([]);

  const [loading, setLoading] = useState(true);

  // ======================================================
  // GET GENERATED TIMETABLE
  // ======================================================

 useEffect(() => {
  const fetchTimetable = async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const facultyId = user?.id || user?._id || localStorage.getItem("facultyId") || localStorage.getItem("userId");

      console.log("My Timetable Faculty ID:", facultyId);

      if (!facultyId) {
        throw new Error("Faculty ID not found. Please login again.");
      }

      const response = await axios.get(
        `http://localhost:5000/api/auth/timetable?facultyId=${encodeURIComponent(facultyId)}`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.timetable || [];

      console.log("My Timetable Response:", data);
      setTimetable(data);
    } catch (error) {
      console.error("Fetch Timetable Error:", error);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  fetchTimetable();
}, []);
  // ======================================================
  // UI
  // ======================================================

  return (
    <FacultyLayout>
      <div className="my-timetable">
        {/* ==================================================
                    HEADER
                ================================================== */}

        <div className="timetable-header">
          <div>
            <h1>My Timetable</h1>

            <p>View your weekly teaching schedule.</p>
          </div>

          <div className="timetable-icon">
            <FaCalendarAlt />
          </div>
        </div>

        {/* ==================================================
                    LOADING
                ================================================== */}

        {loading && <p>Loading timetable...</p>}

        {/* ==================================================
                    NO TIMETABLE
                ================================================== */}

        {!loading && timetable.length === 0 && (
          <div className="timetable-card">
            <p>No timetable generated yet.</p>
          </div>
        )}

        {/* ==================================================
                    TIMETABLE TABLE
                ================================================== */}

        {!loading && timetable.length > 0 && (
          <div className="timetable-card">
            <table>
              <thead>
                <tr>
                  <th>Day</th>

                  <th>Time</th>

                  <th>Subject</th>

                  <th>Room</th>

                  <th>Semester</th>
                </tr>
              </thead>

              <tbody>
                {timetable.map((item, index) => (
                  <tr key={item._id || index}>
                    <td>{item.day}</td>

                    <td>{item.time}</td>

                    <td>{item.subject}</td>

                    <td>{item.room}</td>

                    <td>
                      {item.department
                        ? `${item.department} - Semester ${item.semester}`
                        : item.semester}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}

export default MyTimetable;
