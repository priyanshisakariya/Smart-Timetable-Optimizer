import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import { FaBook, FaPlus, FaEdit, FaTrash, FaSearch, FaUserTie } from "react-icons/fa";
import ActionButtons from "../../../components/ActionButtons";
import "./ManageSubject.css";
import axios from "axios";

function ManageSubject() {
  const [subject, setSubject] = useState({
    name: "",
    code: "",
    department: "",
    semester: "",
    credits: 4,
    weeklyLectures: 4,
    facultyId: "",
    facultyName: "",
    status: "active",
  });

  const [subjectList, setSubjectList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");

  // Load Departments and Faculty from DB
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [deptRes, facRes] = await Promise.all([
          axios.get("http://localhost:5000/api/auth/departments"),
          axios.get("http://localhost:5000/api/auth/faculty"),
        ]);
        const depts = Array.isArray(deptRes.data) ? deptRes.data : [];
        const facs = Array.isArray(facRes.data.faculty) ? facRes.data.faculty : [];

        setDepartments(depts);
        setFacultyList(facs);

        if (depts.length > 0 && !subject.department) {
          const firstDept = depts[0].name;
          setSubject((prev) => ({ ...prev, department: firstDept }));
          fetchSemestersForDept(firstDept);
        }
      } catch (err) {
        console.error("Load Subject Metadata Error:", err);
      }
    };
    loadMetadata();
  }, []);

  // Cascading Semesters when Department changes
  const fetchSemestersForDept = async (deptName) => {
    if (!deptName) {
      setSemesters([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/auth/semesters/by-department/${encodeURIComponent(deptName)}`);
      const sems = Array.isArray(res.data) ? res.data : [];
      setSemesters(sems);
      if (sems.length > 0) {
        setSubject((prev) => ({ ...prev, semester: sems[0].semesterNumber }));
      }
    } catch (err) {
      console.error("Fetch Semesters Error:", err);
    }
  };

  // Fetch all subjects from DB
  const fetchSubjects = async () => {
    try {
      const params = new URLSearchParams();
      if (filterDept) params.append("department", filterDept);
      if (filterSem) params.append("semester", filterSem);

      const url = `http://localhost:5000/api/auth/subjects?${params.toString()}`;
      const response = await axios.get(url);
      const subjectsData = Array.isArray(response.data) ? response.data : response.data.subjects || [];
      setSubjectList(subjectsData);
    } catch (error) {
      console.error("Fetch Subjects Error:", error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [filterDept, filterSem]);

  const handleDeptChange = (e) => {
    const selectedDept = e.target.value;
    setSubject((prev) => ({ ...prev, department: selectedDept }));
    fetchSemestersForDept(selectedDept);
  };

  const handleFacultyChange = (e) => {
    const selectedFacId = e.target.value;
    const selectedFac = facultyList.find((f) => String(f._id) === String(selectedFacId));
    setSubject((prev) => ({
      ...prev,
      facultyId: selectedFacId,
      facultyName: selectedFac ? selectedFac.name : "",
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSubject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearForm = () => {
    setSubject({
      name: "",
      code: "",
      department: departments[0]?.name || "",
      semester: semesters[0]?.semesterNumber || "1",
      credits: 4,
      weeklyLectures: 4,
      facultyId: "",
      facultyName: "",
      status: "active",
    });
    setEditIndex(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!subject.name || !subject.code || !subject.department || !subject.semester) {
      alert("Subject name, code, department, and semester are required");
      return;
    }

    if (editIndex === null) {
      // Add Subject
      try {
        const response = await axios.post("http://localhost:5000/api/auth/add-subject", {
          name: subject.name,
          code: subject.code,
          department: subject.department,
          semester: subject.semester,
          credits: Number(subject.credits) || 4,
          weeklyLectures: Number(subject.weeklyLectures) || Number(subject.credits) || 4,
          facultyId: subject.facultyId || null,
          facultyName: subject.facultyName || "",
          status: subject.status,
        });

        alert("Subject added successfully!");
        clearForm();
        fetchSubjects();
      } catch (error) {
        console.error("Add Subject Error:", error);
        alert(error.response?.data?.message || "Failed to add subject");
      }
    } else {
      // Update Subject
      try {
        const subjectId = subjectList[editIndex]._id || subjectList[editIndex].id;
        await axios.put(`http://localhost:5000/api/auth/update-subject/${subjectId}`, {
          name: subject.name,
          code: subject.code,
          department: subject.department,
          semester: subject.semester,
          credits: Number(subject.credits) || 4,
          weeklyLectures: Number(subject.weeklyLectures) || Number(subject.credits) || 4,
          facultyId: subject.facultyId || null,
          facultyName: subject.facultyName || "",
          status: subject.status,
        });

        alert("Subject updated successfully!");
        clearForm();
        fetchSubjects();
      } catch (error) {
        console.error("Update Subject Error:", error);
        alert(error.response?.data?.message || "Failed to update subject");
      }
    }
  };

  const handleEdit = (index) => {
    const selectedSubject = subjectList[index];
    setSubject({
      name: selectedSubject.name || "",
      code: selectedSubject.code || "",
      department: selectedSubject.department || departments[0]?.name || "",
      semester: selectedSubject.semester || "1",
      credits: selectedSubject.credits || 4,
      weeklyLectures: selectedSubject.weeklyLectures || selectedSubject.credits || 4,
      facultyId: selectedSubject.facultyId || "",
      facultyName: selectedSubject.facultyName || "",
      status: selectedSubject.status || "active",
    });
    setEditIndex(index);
    fetchSemestersForDept(selectedSubject.department);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      const subjectId = subjectList[index]._id || subjectList[index].id;
      await axios.delete(`http://localhost:5000/api/auth/delete-subject/${subjectId}`);
      alert("Subject deleted successfully!");
      if (editIndex === index) clearForm();
      fetchSubjects();
    } catch (error) {
      console.error("Delete Subject Error:", error);
      alert(error.response?.data?.message || "Failed to delete subject");
    }
  };

  const filteredSubjects = subjectList.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.facultyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="manage-subject-page">
        {/* HEADER */}
        <div className="subject-header">
          <div>
            <h1>Manage Subjects</h1>
            <p>Define courses, course codes, weekly lecture counts, and designated faculty assignments.</p>
          </div>
          <div className="subject-header-icon">
            <FaBook />
          </div>
        </div>

        {/* FORM */}
        <div className="subject-form-card">
          <h2>{editIndex === null ? "Add Academic Subject" : "Edit Academic Subject"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Advanced Java Programming"
                  value={subject.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject Code *</label>
                <input
                  type="text"
                  name="code"
                  placeholder="e.g. AJ401"
                  value={subject.code}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Department Dropdown (from DB) */}
              <div className="form-group">
                <label>Department (from DB) *</label>
                <select name="department" value={subject.department} onChange={handleDeptChange} required>
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
                <select name="semester" value={subject.semester} onChange={handleChange} required>
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

              {/* Faculty Assignment Dropdown (from DB) */}
              <div className="form-group">
                <label>Designated Faculty (from DB)</label>
                <select value={subject.facultyId} onChange={handleFacultyChange}>
                  <option value="">-- Select Assigned Faculty (Optional) --</option>
                  {facultyList
                    .filter((f) => !subject.department || f.department?.toLowerCase() === subject.department.toLowerCase())
                    .map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.department})
                      </option>
                    ))}
                </select>
              </div>

              {/* Weekly Lectures / Credits */}
              <div className="form-group">
                <label>Weekly Lectures Required *</label>
                <input
                  type="number"
                  name="weeklyLectures"
                  min="1"
                  max="10"
                  value={subject.weeklyLectures}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Credits</label>
                <input
                  type="number"
                  name="credits"
                  min="1"
                  max="10"
                  value={subject.credits}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" value={subject.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editIndex === null ? <FaPlus /> : <FaEdit />}
                {editIndex === null ? "Add Subject" : "Update Subject"}
              </button>
              {editIndex !== null && (
                <button type="button" className="cancel-btn" onClick={clearForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST */}
        <div className="subject-table-section">
          <div className="list-toolbar">
            <h2>Subjects Directory ({filteredSubjects.length})</h2>
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
                  placeholder="Search subject or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredSubjects.length === 0 ? (
            <p className="no-subjects">No subjects found.</p>
          ) : (
            <div className="table-responsive">
              <table className="subject-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Lectures/Wk</th>
                    <th>Assigned Faculty</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((sub, index) => (
                    <tr key={sub._id || index}>
                      <td>
                        <span className="badge badge-code">{sub.code}</span>
                      </td>
                      <td>
                        <strong>{sub.name}</strong>
                      </td>
                      <td>{sub.department}</td>
                      <td>Semester {sub.semester}</td>
                      <td>
                        <span className="badge badge-lectures">{sub.weeklyLectures || sub.credits} Lectures</span>
                      </td>
                      <td>
                        <div className="faculty-badge">
                          <FaUserTie /> {sub.facultyName || "Unassigned"}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-status ${sub.status === "inactive" ? "status-inactive" : "status-active"}`}>
                          {sub.status || "active"}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <ActionButtons
                          onEdit={() => handleEdit(index)}
                          onDelete={() => handleDelete(index)}
                          editTitle={`Edit ${sub.name}`}
                          deleteTitle={`Delete ${sub.name}`}
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

export default ManageSubject;
