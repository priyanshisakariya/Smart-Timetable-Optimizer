import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import { FaGraduationCap, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from "react-icons/fa";
import ActionButtons from "../../../components/ActionButtons";
import "./ManageSemesters.css";

function ManageSemesters() {
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    semesterNumber: "1",
    department: "",
    academicYear: "2025-2026",
    status: "active",
  });
  const [editId, setEditId] = useState(null);
  const [filterDept, setFilterDept] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch Departments from DB for dropdown
  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/departments");
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : [];
        setDepartments(list);
        if (list.length > 0 && !formData.department) {
          setFormData((prev) => ({ ...prev, department: list[0].name }));
        }
      }
    } catch (err) {
      console.error("Fetch Departments Error:", err);
    }
  };

  // Fetch Semesters from DB
  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const url = filterDept
        ? `http://localhost:5000/api/auth/semesters?department=${encodeURIComponent(filterDept)}`
        : "http://localhost:5000/api/auth/semesters";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setSemesters(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch Semesters Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [filterDept]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.semesterNumber || !formData.department) {
      alert("Semester number and Department are required");
      return;
    }

    try {
      if (editId) {
        const res = await fetch(`http://localhost:5000/api/auth/update-semester/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          alert("Semester updated successfully!");
          setEditId(null);
          setFormData({
            semesterNumber: "1",
            department: departments[0]?.name || "",
            academicYear: "2025-2026",
            status: "active",
          });
          fetchSemesters();
        } else {
          alert(data.message || "Failed to update semester");
        }
      } else {
        const res = await fetch("http://localhost:5000/api/auth/add-semester", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          alert("Semester added successfully!");
          setFormData({
            semesterNumber: "1",
            department: departments[0]?.name || "",
            academicYear: "2025-2026",
            status: "active",
          });
          fetchSemesters();
        } else {
          alert(data.message || "Failed to add semester");
        }
      }
    } catch (err) {
      console.error("Save Semester Error:", err);
      alert("Server connection error");
    }
  };

  const handleEdit = (sem) => {
    setEditId(sem._id);
    setFormData({
      semesterNumber: sem.semesterNumber,
      department: sem.department,
      academicYear: sem.academicYear || "2025-2026",
      status: sem.status || "active",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this semester?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/delete-semester/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert("Semester deleted successfully");
        if (editId === id) {
          setEditId(null);
        }
        fetchSemesters();
      } else {
        alert(data.message || "Failed to delete semester");
      }
    } catch (err) {
      console.error("Delete Semester Error:", err);
      alert("Server connection error");
    }
  };

  const filteredSemesters = semesters.filter(
    (s) =>
      s.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.semesterNumber).includes(searchQuery)
  );

  return (
    <AdminLayout>
      <div className="manage-semesters-page">
        <div className="sem-header">
          <div>
            <h1>Manage Semesters</h1>
            <p>Connect semesters directly to departments with academic year mapping.</p>
          </div>
          <div className="sem-icon-wrapper">
            <FaGraduationCap />
          </div>
        </div>

        <div className="sem-grid-layout">
          {/* Form Card */}
          <div className="sem-form-card">
            <h2>{editId ? "Edit Semester" : "Add Semester"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Semester Number *</label>
                <select
                  name="semesterNumber"
                  value={formData.semesterNumber}
                  onChange={handleChange}
                  required
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
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
                  {editId ? <FaEdit /> : <FaPlus />} {editId ? "Update Semester" : "Add Semester"}
                </button>
                {editId && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setEditId(null);
                      setFormData({
                        semesterNumber: "1",
                        department: departments[0]?.name || "",
                        academicYear: "2025-2026",
                        status: "active",
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Card */}
          <div className="sem-list-card">
            <div className="list-header">
              <h2>Semester Records ({filteredSemesters.length})</h2>
              <div className="filter-search-group">
                <div className="filter-dropdown">
                  <FaFilter />
                  <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="">All Departments</option>
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
                    placeholder="Search semester..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <p className="loading-text">Loading semesters...</p>
            ) : filteredSemesters.length === 0 ? (
              <p className="empty-text">No semester records found.</p>
            ) : (
              <div className="table-responsive">
                <table className="sem-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Academic Year</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSemesters.map((sem) => (
                      <tr key={sem._id}>
                        <td>
                          <strong>{sem.department}</strong>
                        </td>
                        <td>
                          <span className="badge badge-sem">Semester {sem.semesterNumber}</span>
                        </td>
                        <td>{sem.academicYear || "2025-2026"}</td>
                        <td>
                          <span className={`badge badge-status ${sem.status === "active" ? "status-active" : "status-inactive"}`}>
                            {sem.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <ActionButtons
                            onEdit={() => handleEdit(sem)}
                            onDelete={() => handleDelete(sem._id)}
                            editTitle={`Edit Semester ${sem.semesterNumber}`}
                            deleteTitle={`Delete Semester ${sem.semesterNumber}`}
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

export default ManageSemesters;
