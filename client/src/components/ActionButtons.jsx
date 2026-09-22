import React from "react";
import { FiEdit } from "react-icons/fi";
import { FaTrash } from "react-icons/fa";
import "./ActionButtons.css";

export default function ActionButtons({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
  editTitle = "Edit record",
  deleteTitle = "Delete record",
  showEdit = true,
  showDelete = true,
  disabled = false,
  className = "",
}) {
  return (
    <div className={`table-action-group ${className}`}>
      {showEdit && onEdit && (
        <button
          type="button"
          className="table-action-btn btn-action-edit"
          onClick={onEdit}
          title={editTitle}
          disabled={disabled}
        >
          <FiEdit className="btn-action-icon" />
          <span className="btn-action-text">{editLabel}</span>
        </button>
      )}

      {showDelete && onDelete && (
        <button
          type="button"
          className="table-action-btn btn-action-delete"
          onClick={onDelete}
          title={deleteTitle}
          disabled={disabled}
        >
          <FaTrash className="btn-action-icon" />
          <span className="btn-action-text">{deleteLabel}</span>
        </button>
      )}
    </div>
  );
}
