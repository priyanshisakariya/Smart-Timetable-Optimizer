import { useState, useEffect } from "react";
import "./ManageFaculty.css";
import AdminLayout from "../layout/AdminLayout";
import { FaUserTie, FaSearch, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaLock } from "react-icons/fa";
import ActionButtons from "../../../components/ActionButtons";

function ManageFaculty() {
  const [faculty, setFaculty] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    phone: "",
    assignedSubjects: [],
    assignedClasses: [],
    status: "active",
  });

  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Load departments, subjects, and classes from MongoDB
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [deptRes, subRes, clsRes] = await Promise.all([
          fetch("http://localhost:5000/api/auth/departments"),
          fetch("http://localhost:5000/api/auth/subjects"),
          fetch("http://localhost:5000/api/auth/classes"),
        ]);
        const deptData = await deptRes.json();
        const subData = await subRes.json();
        const clsData = await clsRes.json();

        if (deptRes.ok) {
          const depts = Array.isArray(deptData) ? deptData : [];
          setDepartments(depts);
          if (depts.length > 0 && !faculty.department) {
            setFaculty((prev) => ({ ...prev, department: depts[0].name }));
          }
        }
        if (subRes.ok) setAvailableSubjects(Array.isArray(subData) ? subData : []);
        if (clsRes.ok) setAvailableClasses(Array.isArray(clsData) ? clsData : []);
      } catch (err) {
        console.error("Load Faculty Metadata Error:", err);
      }
    };
    loadMetadata();
  }, []);

  // Fetch all faculty
  const fetchFaculty = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/faculty");
      const data = await response.json();
      if (response.ok) {
        setFacultyList(data.faculty || []);
      }
    } catch (error) {
      console.error("Fetch faculty error:", error);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone") {
      const numericVal = value.replace(/\D/g, "");
      setFaculty((prev) => ({
        ...prev,
        phone: numericVal,
      }));
      if (numericVal && numericVal.length !== 10) {
        setPhoneError("Faculty phone number must be exactly 10 digits");
      } else {
        setPhoneError("");
      }
      return;
    }

    setFaculty((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const handleSubjectToggle = (subjectName) => {
    setFaculty((prev) => {
      const exists = prev.assignedSubjects.includes(subjectName);
      return {
        ...prev,
        assignedSubjects: exists
          ? prev.assignedSubjects.filter((s) => s !== subjectName)
          : [...prev.assignedSubjects, subjectName],
      };
    });
  };

  const handleClassToggle = (className) => {
    setFaculty((prev) => {
      const exists = prev.assignedClasses.includes(className);
      return {
        ...prev,
        assignedClasses: exists
          ? prev.assignedClasses.filter((c) => c !== className)
          : [...prev.assignedClasses, className],
      };
    });
  };

  const clearForm = () => {
    setFaculty({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: departments[0]?.name || "",
      phone: "",
      assignedSubjects: [],
      assignedClasses: [],
      status: "active",
    });
    setEditIndex(null);
    setPasswordError("");
    setPhoneError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation
    if (!faculty.name || !faculty.email || !faculty.department) {
      alert("Name, email, and department are required");
      return;
    }

    if (faculty.phone && faculty.phone.length !== 10) {
      setPhoneError("Faculty phone number must be exactly 10 digits");
      return;
    }

    if (editIndex === null) {
      // Adding new faculty: password validation required
      if (!faculty.password) {
        setPasswordError("Password cannot be empty");
        return;
      }
      if (!faculty.confirmPassword) {
        setPasswordError("Please confirm your password");
        return;
      }
      if (faculty.password !== faculty.confirmPassword) {
        setPasswordError("Password and Confirm Password do not match!");
        return;
      }
      if (faculty.password.length < 6) {
        setPasswordError("Password must be at least 6 characters long");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/auth/add-faculty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: faculty.name,
            email: faculty.email,
            password: faculty.password,
            confirmPassword: faculty.confirmPassword,
            department: faculty.department,
            phone: faculty.phone,
            assignedSubjects: faculty.assignedSubjects,
            assignedClasses: faculty.assignedClasses,
            status: faculty.status,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          alert(data.message || "Failed to add faculty");
          return;
        }

        alert("Faculty added successfully!");
        clearForm();
        fetchFaculty();
      } catch (error) {
        console.error("Add faculty error:", error);
        alert("Unable to connect to backend server");
      }
    } else {
      // Updating faculty
      if (faculty.password) {
        if (faculty.password !== faculty.confirmPassword) {
          setPasswordError("Password and Confirm Password do not match!");
          return;
        }
      }

      try {
        const facultyId = facultyList[editIndex].id || facultyList[editIndex]._id;
        const response = await fetch(`http://localhost:5000/api/auth/update-faculty/${facultyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: faculty.name,
            email: faculty.email,
            department: faculty.department,
            phone: faculty.phone,
            assignedSubjects: faculty.assignedSubjects,
            assignedClasses: faculty.assignedClasses,
            status: faculty.status,
            ...(faculty.password ? { password: faculty.password, confirmPassword: faculty.confirmPassword } : {}),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          alert(data.message || "Failed to update faculty");
          return;
        }

        alert("Faculty updated successfully!");
        clearForm();
        fetchFaculty();
      } catch (error) {
        console.error("Update faculty error:", error);
        alert("Unable to connect to backend server");
      }
    }
  };

  const handleEdit = (index) => {
    const selectedFaculty = facultyList[index];
    setFaculty({
      name: selectedFaculty.name || "",
      email: selectedFaculty.email || "",
      password: "",
      confirmPassword: "",
      department: selectedFaculty.department || departments[0]?.name || "",
      phone: selectedFaculty.phone || selectedFaculty.mobileNo || "",
      assignedSubjects: Array.isArray(selectedFaculty.assignedSubjects) ? selectedFaculty.assignedSubjects : [],
      assignedClasses: Array.isArray(selectedFaculty.assignedClasses) ? selectedFaculty.assignedClasses : [],
      status: selectedFaculty.status || "active",
    });
    setEditIndex(index);
    setPasswordError("");
    setPhoneError("");
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this faculty member?")) return;
    try {
      const facultyId = facultyList[index].id || facultyList[index]._id;
      const response = await fetch(`http://localhost:5000/api/auth/delete-faculty/${facultyId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to delete faculty");
        return;
      }

      alert("Faculty deleted successfully!");
      if (editIndex === index) clearForm();
      fetchFaculty();
    } catch (error) {
      console.error("Delete faculty error:", error);
      alert("Unable to connect to backend server");
    }
  };

  const filteredFaculty = facultyList.filter((f) => {
    const matchesSearch =
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept ? f.department?.toLowerCase() === filterDept.toLowerCase() : true;
    return matchesSearch && matchesDept;
  });

  return (
    <AdminLayout>
      <div className="faculty-page">
        {/* PAGE HEADER */}
        <div className="faculty-header">
          <div>
            <h1>Manage Faculty</h1>
            <p>Register, update, and assign academic subjects and divisions to faculty members.</p>
          </div>
          <div className="faculty-header-icon">
            <FaUserTie />
          </div>
        </div>

        {/* FACULTY FORM */}
        <div className="faculty-form-card">
          <h2>{editIndex === null ? "Add Faculty Member" : "Edit Faculty Member"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              {/* Faculty Name */}
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Prof. A. K. Dhami"
                  value={faculty.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. faculty@university.edu"
                  value={faculty.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Department Dropdown (from DB) */}
              <div className="form-group">
                <label>Department (from Database) *</label>
                <select name="department" value={faculty.department} onChange={handleChange} required>
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div className={`form-group ${phoneError ? "has-error" : ""}`}>
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  maxLength={10}
                  placeholder="e.g. 9876543210 (10 digits)"
                  value={faculty.phone}
                  onChange={handleChange}
                  className={phoneError ? "input-field-error" : ""}
                />
                {phoneError && <span className="field-error-text">{phoneError}</span>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label>
                  <FaLock /> {editIndex === null ? "Password *" : "New Password (optional)"}
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder={editIndex === null ? "Enter secure password" : "Leave blank to keep current"}
                  value={faculty.password}
                  onChange={handleChange}
                  required={editIndex === null}
                />
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label>
                  <FaLock /> Confirm Password {editIndex === null ? "*" : ""}
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={faculty.confirmPassword}
                  onChange={handleChange}
                  required={editIndex === null || Boolean(faculty.password)}
                />
              </div>
            </div>

            {/* Live Password Error Message */}
            {passwordError && <div className="validation-error-banner">{passwordError}</div>}

            {/* Subject Assignment Checkbox Chips */}
            <div className="form-group full-width">
              <label>Assign Subjects (from Database)</label>
              <div className="chips-container">
                {availableSubjects.map((sub) => {
                  const isSelected = faculty.assignedSubjects.includes(sub.name);
                  return (
                    <button
                      type="button"
                      key={sub._id}
                      className={`chip-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSubjectToggle(sub.name)}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {sub.name} ({sub.code})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Class Assignment Checkbox Chips */}
            <div className="form-group full-width">
              <label>Assign Classes / Divisions (from Database)</label>
              <div className="chips-container">
                {availableClasses.map((cls) => {
                  const isSelected = faculty.assignedClasses.includes(cls.name);
                  return (
                    <button
                      type="button"
                      key={cls._id}
                      className={`chip-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => handleClassToggle(cls.name)}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {cls.name} ({cls.department} - Sem {cls.semester})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={faculty.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Add / Update Button */}
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editIndex === null ? <FaPlus /> : <FaEdit />}
                {editIndex === null ? "Add Faculty Member" : "Update Faculty Member"}
              </button>
              {editIndex !== null && (
                <button type="button" className="cancel-btn" onClick={clearForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* FACULTY TABLE */}
        <div className="faculty-table-section">
          <div className="list-toolbar">
            <h2>Registered Faculty Members ({filteredFaculty.length})</h2>
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
                  placeholder="Search faculty name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredFaculty.length === 0 ? (
            <p className="no-faculty">No faculty members found.</p>
          ) : (
            <div className="table-responsive">
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Assigned Subjects</th>
                    <th>Assigned Classes</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFaculty.map((member, index) => (
                    <tr key={member.id || member._id || index}>
                      <td>
                        <strong>{member.name}</strong>
                      </td>
                      <td>{member.email}</td>
                      <td>
                        <span className="badge badge-dept">{member.department}</span>
                      </td>
                      <td>
                        <div className="tags-list">
                          {Array.isArray(member.assignedSubjects) && member.assignedSubjects.length > 0 ? (
                            member.assignedSubjects.map((s, idx) => (
                              <span key={idx} className="tag tag-subject">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="tags-list">
                          {Array.isArray(member.assignedClasses) && member.assignedClasses.length > 0 ? (
                            member.assignedClasses.map((c, idx) => (
                              <span key={idx} className="tag tag-class">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-status ${member.status === "inactive" ? "status-inactive" : "status-active"}`}>
                          {member.status || "active"}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <ActionButtons
                          onEdit={() => handleEdit(index)}
                          onDelete={() => handleDelete(index)}
                          editTitle={`Edit ${member.name}`}
                          deleteTitle={`Delete ${member.name}`}
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

export default ManageFaculty;
