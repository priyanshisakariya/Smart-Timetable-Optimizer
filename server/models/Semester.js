const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema(
  {
    semesterNumber: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      default: "2025-2026",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per department
semesterSchema.index({ semesterNumber: 1, department: 1 }, { unique: true });

module.exports = mongoose.model("Semester", semesterSchema);
