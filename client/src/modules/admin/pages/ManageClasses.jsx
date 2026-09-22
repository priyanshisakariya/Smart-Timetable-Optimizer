import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import { FaLayerGroup, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaUsers } from "react-icons/fa";
import ActionButtons from "../../../components/ActionButtons";
import "./ManageClasses.css";

function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    semester: "",
    academicYear: "2025-2026",
    strength: 60,
    status: "active",
  });
  const [editId, setEditId] = useState(null);
  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/departments");
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : [];
        setDepartments(list);
        if (list.length > 0 && !formData.department) {
          const firstDept = list[0].name;
          setFormData((prev) => ({ ...prev, department: firstDept }));
          fetchSemestersForDept(firstDept);
        }
      }
    } catch (err) {
      console.error("Fetch Departments Error:", err);
    }
  };

  // Fetch Semesters for chosen Department (Cascading dropdown)
  const fetchSemestersForDept = async (deptName) => {
    if (!deptName) {
      setSemesters([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/auth/semesters/by-department/${encodeURIComponent(deptName)}`);
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : [];
        setSemesters(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, semester: list[0].semesterNumber }));
        } else {
          setFormData((prev) => ({ ...prev, semester: "" }));
        }
      }
    } catch (err) {
      console.error("Fetch Semesters for Dept Error:", err);
    }
  };

  // Fetch Classes from DB
  const fetchClasses = async () => {
    try {
      setLoading(true);
      let url = "http://localhost:5000/api/auth/classes";
      const params = new URLSearchParams();
      if (filterDept) params.append("department", filterDept);
      if (filterSem) params.append("semester", filterSem);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setClasses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch Classes Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [filterDept, filterSem]);

  const handleDeptChange = (e) => {
    const selectedDept = e.target.value;
    setFormData({ ...formData, department: selectedDept });
    fetchSemestersForDept(selectedDept);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.department || !formData.semester) {
      alert("Class name, Department, and Semester are required");
      return;
    }

    try {
      if (editId) {
        const res = await fetch(`http://localhost:5000/api/auth/update-class/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          alert("Class updated successfully!");
          setEditId(null);
          setFormData((prev) => ({ ...prev, name: "", strength: 60 }));
          fetchClasses();
        } else {
          alert(data.message || "Failed to update class");
        }
      } else {
        const res = await fetch("http://localhost:5000/api/auth/add-class", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          alert("Class added successfully!");
          setFormData((prev) => ({ ...prev, name: "", strength: 60 }));
          fetchClasses();
        } else {
          alert(data.message || "Failed to add class");
        }
      }
    } catch (err) {
      console.error("Save Class Error:", err);
      alert("Server connection error");
    }
  };

  const handleEdit = (cls) => {
    setEditId(cls._id);
    setFormData({
      name: cls.name,
      department: cls.department,
      semester: cls.semester,
      academicYear: cls.academicYear || "2025-2026",
      strength: cls.strength || 60,
      status: cls.status || "active",
    });
    fetchSemestersForDept(cls.department);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class division?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/delete-class/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert("Class deleted successfully");
        if (editId === id) setEditId(null);
        fetchClasses();
      } else {
        alert(data.message || "Failed to delete class");
      }
    } catch (err) {
      console.error("Delete Class Error:", err);
      alert("Server connection error");
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.semester).includes(searchQuery)
  );

  return (
    <AdminLayout>
      <div className="manage-classes-page">
        <div className="cls-header">
          <div>
            <h1>Manage Classes / Divisions</h1>
            <p>Organize department and semester divisions (e.g. BCA-A, BCA-B) for timetable scheduling.</p>
          </div>
          <div className="cls-icon-wrapper">
            <FaLayerGroup />
          </div>
        </div>

        <div className="cls-grid-layout">
          {/* Form Card */}
          <div className="cls-form-card">
            <h2>{editId ? "Edit Class Division" : "Add Class Division"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleDeptChange}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Semester (Cascaded) *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                >
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

              <div className="form-group">
                <label>Class / Division Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. BCA-A or Div-1"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Class Strength (Students)</label>
                <input
                  type="number"
                  name="strength"
                  placeholder="e.g. 60"
                  value={formData.strength}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Academic Year</label>
                <input
                  type="text"
                  name="academicYear"
                  placeholder="e.g. 2025-2026"
                  value={formData.academicYear}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="form-button-group">
                <button type="submit" className="submit-btn">
                  {editId ? <FaEdit /> : <FaPlus />} {editId ? "Update Class" : "Add Class"}
                </button>
                {editId && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setEditId(null);
                      setFormData((prev) => ({ ...prev, name: "" }));
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Card */}
          <div className="cls-list-card">
            <div className="list-header">
              <h2>Class Divisions ({filteredClasses.length})</h2>
              <div className="filter-search-group">
                <div className="filter-dropdown">
                  <FaFilter />
                  <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="">All Depts</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="search-bar">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search class..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <p className="loading-text">Loading classes...</p>
            ) : filteredClasses.length === 0 ? (
              <p className="empty-text">No class divisions found.</p>
            ) : (
              <div className="table-responsive">
                <table className="cls-table">
                  <thead>
                    <tr>
                      <th>Class / Division</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Strength</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((cls) => (
                      <tr key={cls._id}>
                        <td>
                          <span className="badge badge-class">{cls.name}</span>
                        </td>
                        <td>
                          <strong>{cls.department}</strong>
                        </td>
                        <td>Semester {cls.semester}</td>
                        <td>
                          <span className="strength-chip">
                            <FaUsers /> {cls.strength || 60}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-status ${cls.status === "active" ? "status-active" : "status-inactive"}`}>
                            {cls.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <ActionButtons
                            onEdit={() => handleEdit(cls)}
                            onDelete={() => handleDelete(cls._id)}
                            editTitle={`Edit ${cls.name}`}
                            deleteTitle={`Delete ${cls.name}`}
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
      </div>
    </AdminLayout>
  );
}

export default ManageClasses;
