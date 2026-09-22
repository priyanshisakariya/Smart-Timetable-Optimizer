import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import {
  FaCogs,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBook,
  FaUserTie,
  FaClock,
  FaDoorOpen,
  FaPrint,
} from "react-icons/fa";
import "./GenerateTimetable.css";

function GenerateTimetable() {
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSem, setSelectedSem] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");

  // Pre-generation verification state
  const [previewSubjects, setPreviewSubjects] = useState([]);
  const [previewFaculty, setPreviewFaculty] = useState([]);
  const [previewTimeSlots, setPreviewTimeSlots] = useState([]);
  const [previewRooms, setPreviewRooms] = useState([]);

  const [generatedTimetable, setGeneratedTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Fetch Departments on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/departments")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setDepartments(list);
        if (list.length > 0) {
          const firstDept = list[0].name;
          setSelectedDept(firstDept);
        }
      })
      .catch(console.error);

    // Fetch system baseline (time slots & rooms)
    Promise.all([
      fetch("http://localhost:5000/api/auth/timeslots").then((r) => r.json()),
      fetch("http://localhost:5000/api/auth/rooms").then((r) => r.json()),
    ]).then(([slots, rooms]) => {
      setPreviewTimeSlots(Array.isArray(slots) ? slots : []);
      setPreviewRooms(Array.isArray(rooms) ? rooms : []);
    });
  }, []);

  // 2. Fetch Cascading Semesters & Classes when Department changes
  useEffect(() => {
    if (!selectedDept) return;

    fetch(`http://localhost:5000/api/auth/semesters/by-department/${encodeURIComponent(selectedDept)}`)
      .then((res) => res.json())
      .then((data) => {
        const sems = Array.isArray(data) ? data : [];
        setSemesters(sems);
        if (sems.length > 0) {
          setSelectedSem(sems[0].semesterNumber);
        } else {
          setSelectedSem("1");
        }
      })
      .catch(console.error);

    fetch(`http://localhost:5000/api/auth/classes?department=${encodeURIComponent(selectedDept)}`)
      .then((res) => res.json())
      .then((data) => {
        const clsList = Array.isArray(data) ? data : [];
        setClasses(clsList);
        if (clsList.length > 0) {
          setSelectedClass(clsList[0].name);
        } else {
          setSelectedClass("");
        }
      })
      .catch(console.error);
  }, [selectedDept]);

  // 3. Load Matching Subjects Preview when Dept/Sem/Class change
  useEffect(() => {
    if (!selectedDept || !selectedSem) return;

    fetch(
      `http://localhost:5000/api/auth/subjects?department=${encodeURIComponent(selectedDept)}&semester=${encodeURIComponent(selectedSem)}`
    )
      .then((res) => res.json())
      .then((data) => {
        setPreviewSubjects(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, [selectedDept, selectedSem]);

  // 4. Fetch already saved timetable for this class if exists
  useEffect(() => {
    if (!selectedDept || !selectedSem) return;

    const params = new URLSearchParams();
    params.append("department", selectedDept);
    params.append("semester", selectedSem);
    if (selectedClass) params.append("className", selectedClass);

    fetch(`http://localhost:5000/api/auth/timetable?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setGeneratedTimetable(data);
        } else {
          setGeneratedTimetable([]);
        }
      })
      .catch(console.error);
  }, [selectedDept, selectedSem, selectedClass]);

  // Handle Generate Timetable with Full Constraints
  const handleGenerate = async () => {
    setGenerating(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/generate-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: selectedDept,
          semester: selectedSem,
          className: selectedClass,
          academicYear,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          data.message ||
            `Timetable generated successfully for ${selectedDept} - Semester ${selectedSem}${selectedClass ? ` - ${selectedClass}` : ""}!`
        );
        const records = Array.isArray(data.timetable) ? data.timetable : [];
        setGeneratedTimetable(records);

        window.dispatchEvent(new Event("timetableGenerated"));
      } else {
        setErrorMessage(data.message || "Failed to generate timetable. Please check subjects and constraints.");
      }
    } catch (err) {
      console.error("Generate Timetable Error:", err);
      setErrorMessage("Unable to connect to timetable generation server.");
    } finally {
      setGenerating(false);
    }
  };

  // Matrix grouping for timetable view
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const distinctSlots = Array.from(
    new Set(generatedTimetable.map((t) => `${t.startTime} - ${t.endTime}`))
  ).sort();

  return (
    <AdminLayout>
      <div className="generate-timetable-page">
        {/* HEADER */}
        <div className="gen-header">
          <div>
            <h1>Intelligent Timetable Generator</h1>
            <p>Automate conflict-free scheduling with constraint satisfaction across faculty, rooms, and divisions.</p>
          </div>
          <div className="gen-icon-wrapper">
            <FaCogs />
          </div>
        </div>

        {/* STEP-BY-STEP GENERATION CONTROL CARD */}
        <div className="gen-control-card">
          <h2>1. Academic Scope & Class Selection</h2>
          <div className="control-grid">
            {/* Step 1: Department */}
            <div className="step-group">
              <label>Step 1: Department *</label>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Semester */}
            <div className="step-group">
              <label>Step 2: Semester *</label>
              <select value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)}>
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

            {/* Step 3: Class / Division */}
            <div className="step-group">
              <label>Step 3: Class / Division</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">-- All Divisions / Standard --</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name} (Strength: {c.strength || 60})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4: Academic Year */}
            <div className="step-group">
              <label>Step 4: Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
              />
            </div>
          </div>

          {/* Verification Preview Section */}
          <div className="verification-section">
            <h3>2. Resource Verification Check</h3>
            <div className="verification-grid">
              <div className="verif-card">
                <div className="verif-icon">
                  <FaBook />
                </div>
                <div>
                  <strong>{previewSubjects.length} Subjects</strong>
                  <span>
                    {previewSubjects.map((s) => s.name).join(", ") || "No subjects found for this semester"}
                  </span>
                </div>
              </div>

              <div className="verif-card">
                <div className="verif-icon">
                  <FaClock />
                </div>
                <div>
                  <strong>{previewTimeSlots.length} Time Slots</strong>
                  <span>Active periods per weekday</span>
                </div>
              </div>

              <div className="verif-card">
                <div className="verif-icon">
                  <FaDoorOpen />
                </div>
                <div>
                  <strong>{previewRooms.length} Available Rooms</strong>
                  <span>Classrooms & Lecture Halls</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="gen-action-bar">
            <button
              className="generate-main-btn"
              onClick={handleGenerate}
              disabled={generating || previewSubjects.length === 0}
            >
              <FaCogs className={generating ? "spin-icon" : ""} />
              {generating ? "Generating Conflict-Free Timetable..." : "GENERATE TIMETABLE"}
            </button>
          </div>

          {/* Banners */}
          {successMessage && (
            <div className="banner success-banner">
              <FaCheckCircle /> {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="banner error-banner">
              <FaExclamationTriangle /> {errorMessage}
            </div>
          )}
        </div>

        {/* TIMETABLE DISPLAY SECTION */}
        {generatedTimetable.length > 0 && (
          <div className="gen-result-card">
            <div className="result-header">
              <div>
                <h2>
                  Generated Timetable: {selectedDept} - Semester {selectedSem}{" "}
                  {selectedClass && `(${selectedClass})`}
                </h2>
                <p>Constraint-satisfaction verified. No faculty, room, or division conflicts.</p>
              </div>

              <button className="btn-print" onClick={() => window.print()}>
                <FaPrint /> Print / Export Timetable
              </button>
            </div>

            {/* Matrix View */}
            <div className="matrix-scroll-wrapper">
              <table className="matrix-table">
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
                    const dayLectures = generatedTimetable.filter(
                      (t) => t.day?.toLowerCase() === day.toLowerCase()
                    );
                    if (dayLectures.length === 0) return null;

                    return (
                      <tr key={day}>
                        <td className="matrix-day">
                          <strong>{day}</strong>
                        </td>
                        {distinctSlots.map((slot) => {
                          const slotLectures = dayLectures.filter(
                            (t) => `${t.startTime} - ${t.endTime}` === slot
                          );

                          return (
                            <td key={slot} className="matrix-slot">
                              {slotLectures.map((lec, idx) => (
                                <div className="slot-chip" key={lec._id || idx}>
                                  <div className="chip-subject">
                                    <FaBook /> {lec.subject}
                                  </div>
                                  <div className="chip-meta">
                                    {lec.subjectCode && <span className="sub-code">{lec.subjectCode}</span>}
                                    {lec.className && <span className="cls-code">{lec.className}</span>}
                                  </div>
                                  <div className="chip-faculty">
                                    <FaUserTie /> {lec.faculty}
                                  </div>
                                  <div className="chip-room">
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
        )}
      </div>
    </AdminLayout>
  );
}

export default GenerateTimetable;
