const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
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

    slotLabel: {
      type: String,
      default: function () {
        return `${this.startTime} - ${this.endTime}`;
      },
      trim: true,
    },
  },
  {
    collection: "timeslots",
    timestamps: true,
  }
);

module.exports = mongoose.model("TimeSlot", timeSlotSchema);