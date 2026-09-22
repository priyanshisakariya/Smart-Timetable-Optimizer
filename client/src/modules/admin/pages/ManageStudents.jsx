import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import "./ManageStudent.css";
import { FaUsers, FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import ActionButtons from "../../../components/ActionButtons";
import axios from "axios";

function ManageStudent() {
  const [student, setStudent] = useState({
    name: "",
    email: "",
    enrollmentNo: "",
    department: "",
    semester: "",
    className: "",
    mobileNo: "",
  });

  const [studentList, setStudentList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [mobileError, setMobileError] = useState("");

  // Load Departments on Mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/departments");
        const depts = Array.isArray(response.data) ? response.data : [];
        setDepartments(depts);
        if (depts.length > 0 && !student.department) {
          const firstDept = depts[0].name;
          setStudent((prev) => ({ ...prev, department: firstDept }));
          fetchCascadingData(firstDept);
        }
      } catch (err) {
        console.error("Load Departments Error:", err);
      }
    };
    loadDepartments();
  }, []);

  // Fetch cascading semesters & classes when department changes
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

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const url = filterDept
        ? `http://localhost:5000/api/auth/students?department=${encodeURIComponent(filterDept)}`
        : "http://localhost:5000/api/auth/students";
      const response = await axios.get(url);
      setStudentList(response.data.students || []);
    } catch (error) {
      console.error("Fetch Students Error:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filterDept]);

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
  };

  const clearForm = () => {
    setStudent({
      name: "",
      email: "",
      enrollmentNo: "",
      department: departments[0]?.name || "",
      semester: semesters[0]?.semesterNumber || "1",
      className: classes[0]?.name || "",
      mobileNo: "",
    });
    setEditIndex(null);
    setMobileError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!student.name || !student.email || !student.enrollmentNo || !student.department || !student.semester) {
      alert("Name, email, enrollment number, department, and semester are required");
      return;
    }

    if (student.mobileNo && student.mobileNo.trim().length !== 10) {
      setMobileError("Student mobile number must be 10 digits");
      return;
    }

    if (editIndex === null) {
      // Add Student
      try {
        await axios.post("http://localhost:5000/api/auth/add-student", {
          name: student.name,
          email: student.email,
          enrollmentNo: student.enrollmentNo,
          department: student.department,
          semester: student.semester,
          className: student.className,
          mobileNo: student.mobileNo,
        });

        alert(`Student added successfully! Default login password: ${student.enrollmentNo}`);
        clearForm();
        fetchStudents();
      } catch (error) {
        console.error("Add Student Error:", error);
        alert(error.response?.data?.message || "Failed to add student");
      }
    } else {
      // Update Student
      try {
        const studentId = studentList[editIndex].id || studentList[editIndex]._id;
        await axios.put(`http://localhost:5000/api/auth/update-student/${studentId}`, {
          name: student.name,
          email: student.email,
          enrollmentNo: student.enrollmentNo,
          department: student.department,
          semester: student.semester,
          className: student.className,
          mobileNo: student.mobileNo,
        });

        alert("Student updated successfully!");
        clearForm();
        fetchStudents();
      } catch (error) {
        console.error("Update Student Error:", error);
        alert(error.response?.data?.message || "Failed to update student");
      }
    }
  };

  const handleEdit = (index) => {
    const selectedStudent = studentList[index];
    setStudent({
      name: selectedStudent.name || "",
      email: selectedStudent.email || "",
      enrollmentNo: selectedStudent.enrollmentNo || "",
      department: selectedStudent.department || departments[0]?.name || "",
      semester: selectedStudent.semester || "1",
      className: selectedStudent.className || "",
      mobileNo: selectedStudent.mobileNo || "",
    });
    setEditIndex(index);
    setMobileError("");
    fetchCascadingData(selectedStudent.department);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this student record?")) return;
    try {
      const studentId = studentList[index].id || studentList[index]._id;
      await axios.delete(`http://localhost:5000/api/auth/delete-student/${studentId}`);
      alert("Student deleted successfully!");
      if (editIndex === index) clearForm();
      fetchStudents();
    } catch (error) {
      console.error("Delete Student Error:", error);
      alert(error.response?.data?.message || "Failed to delete student");
    }
  };

  const filteredStudents = studentList.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.enrollmentNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.className?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="manage-student-page">
        {/* HEADER */}
        <div className="student-header">
          <div>
            <h1>Manage Students</h1>
            <p>Enroll and assign students to their respective department, semester, and division.</p>
          </div>
          <div className="student-header-icon">
            <FaUsers />
          </div>
        </div>

        {/* FORM */}
        <div className="student-form-card">
          <h2>{editIndex === null ? "Enroll Student" : "Edit Student Details"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Student Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Rahul Sharma"
                  value={student.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. rahul@university.edu"
                  value={student.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Enrollment Number *</label>
                <input
                  type="text"
                  name="enrollmentNo"
                  placeholder="e.g. EN2025001"
                  value={student.enrollmentNo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={`form-group ${mobileError ? "has-error" : ""}`}>
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="mobileNo"
                  maxLength={10}
                  placeholder="e.g. 9876543210 (10 digits)"
                  value={student.mobileNo}
                  onChange={handleChange}
                  className={mobileError ? "input-field-error" : ""}
                />
                {mobileError && <span className="field-error-text">{mobileError}</span>}
              </div>

              {/* Department Dropdown (from DB) */}
              <div className="form-group">
                <label>Department (from DB) *</label>
                <select name="department" value={student.department} onChange={handleDeptChange} required>
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cascading Semester Dropdown (from DB) */}
              <div className="form-group">
                <label>Semester (Cascaded from DB) *</label>
                <select name="semester" value={student.semester} onChange={handleChange} required>
                  <option value="">-- Select Semester --</option>
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

              {/* Cascading Class Dropdown (from DB) */}
              <div className="form-group">
                <label>Class / Division (from DB)</label>
                <select name="className" value={student.className} onChange={handleChange}>
                  <option value="">-- Select Class / Division --</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editIndex === null ? <FaPlus /> : <FaEdit />}
                {editIndex === null ? "Enroll Student" : "Update Student"}
              </button>
              {editIndex !== null && (
                <button type="button" className="cancel-btn" onClick={clearForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* TABLE */}
        <div className="student-table-section">
          <div className="list-toolbar">
            <h2>Enrolled Students ({filteredStudents.length})</h2>
            <div className="filter-group">
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <div className="search-bar">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search student, enrollment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <p className="no-students">No enrolled students found.</p>
          ) : (
            <div className="table-responsive">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Enrollment No</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Class / Division</th>
                    <th>Mobile</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((stud, index) => (
                    <tr key={stud._id || stud.id || index}>
                      <td>
                        <span className="badge badge-code">{stud.enrollmentNo || "-"}</span>
                      </td>
                      <td>
                        <strong>{stud.name}</strong>
                      </td>
                      <td>{stud.email}</td>
                      <td>{stud.department}</td>
                      <td>Semester {stud.semester}</td>
                      <td>
                        <span className="badge badge-class">{stud.className || "-"}</span>
                      </td>
                      <td>{stud.mobileNo || "-"}</td>
                      <td className="action-buttons">
                        <ActionButtons
                          onEdit={() => handleEdit(index)}
                          onDelete={() => handleDelete(index)}
                          editTitle={`Edit ${stud.name}`}
                          deleteTitle={`Delete ${stud.name}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default ManageStudent;
