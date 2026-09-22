import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaIdCard,
  FaGraduationCap,
  FaPhone,
  FaLayerGroup,
} from "react-icons/fa";
import "./StudentRegister.css";

function StudentRegister() {
  const [student, setStudent] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    enrollmentNo: "",
    department: "",
    semester: "",
    className: "",
    mobileNo: "",
  });

  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [passwordError, setPasswordError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Load Departments on Mount
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/auth/departments")
      .then((res) => {
        const depts = Array.isArray(res.data) ? res.data : [];
        setDepartments(depts);
        if (depts.length > 0) {
          const firstDept = depts[0].name;
          setStudent((prev) => ({ ...prev, department: firstDept }));
          fetchCascadingData(firstDept);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch cascading Semesters and Classes
  const fetchCascadingData = async (deptName) => {
    if (!deptName) return;
    try {
      const [semRes, clsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/auth/semesters/by-department/${encodeURIComponent(deptName)}`),
        axios.get(`http://localhost:5000/api/auth/classes?department=${encodeURIComponent(deptName)}`),
      ]);
      const sems = Array.isArray(semRes.data) ? semRes.data : [];
      const clsList = Array.isArray(clsRes.data) ? clsRes.data : [];
      setSemesters(sems);
      setClasses(clsList);

      setStudent((prev) => ({
        ...prev,
        semester: sems.length > 0 ? sems[0].semesterNumber : "1",
        className: clsList.length > 0 ? clsList[0].name : "",
      }));
    } catch (err) {
      console.error("Fetch Cascading Error:", err);
    }
  };

  const handleDeptChange = (e) => {
    const selectedDept = e.target.value;
    setStudent((prev) => ({ ...prev, department: selectedDept }));
    fetchCascadingData(selectedDept);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobileNo") {
      const numericVal = value.replace(/\D/g, "");
      setStudent((prev) => ({
        ...prev,
        mobileNo: numericVal,
      }));

      if (numericVal && numericVal.length !== 10) {
        setMobileError("Student mobile number must be 10 digits");
      } else {
        setMobileError("");
      }
      return;
    }

    setStudent((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!student.fullName || !student.email || !student.enrollmentNo || !student.department || !student.semester) {
      alert("Please fill all required student registration fields");
      return;
    }

    if (!student.password) {
      setPasswordError("Password cannot be empty");
      return;
    }

    if (student.password !== student.confirmPassword) {
      setPasswordError("Password and Confirm Password do not match!");
      return;
    }

    if (student.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    if (!student.mobileNo || student.mobileNo.trim().length !== 10) {
      setMobileError("Student mobile number must be 10 digits");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        name: student.fullName,
        email: student.email,
        password: student.password,
        confirmPassword: student.confirmPassword,
        role: "student",
        enrollmentNo: student.enrollmentNo,
        department: student.department,
        semester: student.semester,
        className: student.className,
        mobileNo: student.mobileNo,
      });

      console.log("Registration Response:", response.data);
      alert("Registration successful! You can now login with your credentials.");
      navigate("/login");
    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-register-page">
      {/* NAVBAR */}
      <header className="register-navbar">
        <Link to="/" className="register-logo">
          Smart Timetable Optimizer
        </Link>
        <Link to="/login" className="register-login-link">
          Login
        </Link>
      </header>

      {/* CONTAINER */}
      <main className="register-container">
        <div className="register-card">
          <div className="register-header">
            <div className="register-icon">
              <FaGraduationCap />
            </div>
            <h1>Student Registration</h1>
            <p>Create your institutional student account</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="register-field">
              <label>Full Name *</label>
              <div className="input-wrapper">
                <FaUser />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={student.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="register-field">
              <label>Email Address *</label>
              <div className="input-wrapper">
                <FaEnvelope />
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. rahul@university.edu"
                  value={student.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="register-field">
              <label>Password *</label>
              <div className="input-wrapper">
                <FaLock />
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password (min 6 chars)"
                  value={student.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="register-field">
              <label>Confirm Password *</label>
              <div className="input-wrapper">
                <FaLock />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={student.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {passwordError && <div className="register-error-banner">{passwordError}</div>}

            {/* Enrollment */}
            <div className="register-field">
              <label>Enrollment Number *</label>
              <div className="input-wrapper">
                <FaIdCard />
                <input
                  type="text"
                  name="enrollmentNo"
                  placeholder="e.g. EN2025001"
                  value={student.enrollmentNo}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Department Dropdown (from DB) */}
            <div className="register-field">
              <label>Department (from DB) *</label>
              <div className="input-wrapper">
                <FaGraduationCap />
                <select name="department" value={student.department} onChange={handleDeptChange} required>
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Semester Dropdown (Cascaded from DB) */}
            <div className="register-field">
              <label>Semester (Cascaded) *</label>
              <div className="input-wrapper">
                <FaGraduationCap />
                <select name="semester" value={student.semester} onChange={handleChange} required>
                  <option value="">Select Semester</option>
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
            </div>

            {/* Class / Division (Cascaded from DB) */}
            <div className="register-field">
              <label>Class / Division (from DB)</label>
              <div className="input-wrapper">
                <FaLayerGroup />
                <select name="className" value={student.className} onChange={handleChange}>
                  <option value="">Select Class / Division</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile */}
            <div className="register-field">
              <label>Mobile Number *</label>
              <div className={`input-wrapper ${mobileError ? "has-error" : ""}`}>
                <FaPhone />
                <input
                  type="tel"
                  name="mobileNo"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={student.mobileNo}
                  onChange={handleChange}
                  required
                />
              </div>
              {mobileError && <span className="field-error-text">{mobileError}</span>}
            </div>

            {/* Submit */}
            <button type="submit" className="register-button" disabled={loading}>
              {loading ? "Creating Account..." : "Create Student Account"}
            </button>
          </form>

          <div className="register-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>
      </main>

      <footer className="register-page-footer">
        <p>© 2026 Smart Timetable Optimizer. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default StudentRegister;
