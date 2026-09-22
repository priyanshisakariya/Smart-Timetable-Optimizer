const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      default: "2025-2026",
      trim: true,
    },
    strength: {
      type: Number,
      default: 60,
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

// Compound index to prevent duplicate class names within same dept & semester
classSchema.index({ name: 1, department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);
