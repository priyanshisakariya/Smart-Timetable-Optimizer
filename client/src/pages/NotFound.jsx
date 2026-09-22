import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaHome, FaArrowLeft } from "react-icons/fa";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon">
          <FaExclamationTriangle />
        </div>
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-desc">
          Oops! The page you are looking for does not exist or has been moved.
        </p>

        <div className="not-found-actions">
          <button
            type="button"
            className="not-found-btn btn-back"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Go Back
          </button>
          <Link to="/" className="not-found-btn btn-home">
            <FaHome /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
