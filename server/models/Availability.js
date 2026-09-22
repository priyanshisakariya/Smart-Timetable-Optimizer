const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    facultyName: {
      type: String,
      default: "",
      trim: true,
    },
    facultyEmail: {
      type: String,
      default: "",
      trim: true,
    },
    day: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    timeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "availability",
  }
);

module.exports = mongoose.model("Availability", availabilitySchema);
