import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import { FaBuilding, FaPlus, FaEdit, FaTrash, FaSearch, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import ActionButtons from "../../../components/ActionButtons";
import "./ManageDepartments.css";

function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "active",
  });
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/departments");
      const data = await res.json();
      if (res.ok) {
        setDepartments(Array.isArray(data) ? data : []);
      } else {
        alert(data.message || "Failed to fetch departments");
      }
    } catch (err) {
      console.error("Fetch Departments Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert("Department Name and Code are required");
      return;
    }

    try {
      if (editId) {
        const res = await fetch(`http://localhost:5000/api/auth/update-department/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          alert("Department updated successfully!");
          setEditId(null);
          setFormData({ name: "", code: "", description: "", status: "active" });
          fetchDepartments();
        } else {
          alert(data.message || "Failed to update department");
        }
      } else {
        const res = await fetch("http://localhost:5000/api/auth/add-department", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          alert("Department added successfully!");
          setFormData({ name: "", code: "", description: "", status: "active" });
          fetchDepartments();
        } else {
          alert(data.message || "Failed to add department");
        }
      }
    } catch (err) {
      console.error("Save Department Error:", err);
      alert("Server connection failed");
    }
  };

  const handleEdit = (dept) => {
    setEditId(dept._id);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      status: dept.status || "active",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/delete-department/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert("Department deleted successfully");
        if (editId === id) {
          setEditId(null);
          setFormData({ name: "", code: "", description: "", status: "active" });
        }
        fetchDepartments();
      } else {
        alert(data.message || "Failed to delete department");
      }
    } catch (err) {
      console.error("Delete Department Error:", err);
      alert("Server connection failed");
    }
  };

  const filteredDepartments = departments.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="manage-departments-page">
        <div className="dept-header">
          <div>
            <h1>Manage Departments</h1>
            <p>Define academic departments for colleges and faculty assignment.</p>
          </div>
          <div className="dept-icon-wrapper">
            <FaBuilding />
          </div>
        </div>

        <div className="dept-grid-layout">
          {/* Form Card */}
          <div className="dept-form-card">
            <h2>{editId ? "Edit Department" : "Add Department"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Computer Science"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Department Code *</label>
                <input
                  type="text"
                  name="code"
                  placeholder="e.g. CS"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  name="description"
                  placeholder="Department details, specializations..."
                  rows="3"
                  value={formData.description}
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
                  {editId ? <FaEdit /> : <FaPlus />} {editId ? "Update Department" : "Add Department"}
                </button>
                {editId && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setEditId(null);
                      setFormData({ name: "", code: "", description: "", status: "active" });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Card */}
          <div className="dept-list-card">
            <div className="list-header">
              <h2>Department List ({filteredDepartments.length})</h2>
              <div className="search-bar">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <p className="loading-text">Loading departments...</p>
            ) : filteredDepartments.length === 0 ? (
              <p className="empty-text">No departments found.</p>
            ) : (
              <div className="table-responsive">
                <table className="dept-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Department Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((dept) => (
                      <tr key={dept._id}>
                        <td>
                          <span className="badge badge-code">{dept.code}</span>
                        </td>
                        <td>
                          <strong>{dept.name}</strong>
                        </td>
                        <td>{dept.description || "-"}</td>
                        <td>
                          <span className={`badge badge-status ${dept.status === "active" ? "status-active" : "status-inactive"}`}>
                            {dept.status === "active" ? <FaCheckCircle /> : <FaTimesCircle />} {dept.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <ActionButtons
                            onEdit={() => handleEdit(dept)}
                            onDelete={() => handleDelete(dept._id)}
                            editTitle={`Edit ${dept.name}`}
                            deleteTitle={`Delete ${dept.name}`}
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

export default ManageDepartments;
