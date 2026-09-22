const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_timetable";

async function run() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const Timetable = mongoose.model('Timetable', new mongoose.Schema({}, { strict: false }), 'timetables');

  // 1. UPDATE ALL EXISTING STUDENTS' PASSWORDS TO THEIR ENROLLMENT NUMBERS
  const students = await User.find({ role: "student" });
  console.log(`Found ${students.length} students to update password:`);
  
  for (const s of students) {
    const enr = (s.enrollmentNo || "").trim();
    if (enr) {
      const hash = await bcrypt.hash(enr, 10);
      s.password = hash;
      await s.save();
      console.log(`✓ ${s.name} (${s.email}) -> Password set to: ${enr}`);
    }
  }

  // 2. UPDATE DIVISION B TIMETABLE TO INCLUDE AGILE (ALL 4 SUBJECTS FOR BOTH DIVISIONS)
  const asutosh = await User.findOne({ name: { $regex: "Asutosh", $options: "i" } });
  const kunjan = await User.findOne({ name: { $regex: "kunjan", $options: "i" } });
  const tinal = await User.findOne({ name: { $regex: "Tinal", $options: "i" } });
  const dipti = await User.findOne({ name: { $regex: "Dipti", $options: "i" } });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Clear existing Div B timetable
  await Timetable.deleteMany({ className: "Division B" });

  const divBRecords = [];

  for (const day of days) {
    // 1: Full Stack (11:00 - 12:00)
    divBRecords.push({
      day,
      startTime: "11:00",
      endTime: "12:00",
      time: "11:00 - 12:00",
      subject: "Full Stack",
      subjectCode: "MCA304",
      faculty: kunjan ? kunjan.name : "kunjan medam",
      facultyId: kunjan ? kunjan._id : null,
      facultyEmail: kunjan ? kunjan.email : "kunjan@gmail.com",
      room: "Lab 202",
      department: "MCA",
      semester: "3",
      className: "Division B",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });

    // 2: Full Stack (12:00 - 13:00)
    divBRecords.push({
      day,
      startTime: "12:00",
      endTime: "13:00",
      time: "12:00 - 13:00",
      subject: "Full Stack",
      subjectCode: "MCA304",
      faculty: kunjan ? kunjan.name : "kunjan medam",
      facultyId: kunjan ? kunjan._id : null,
      facultyEmail: kunjan ? kunjan.email : "kunjan@gmail.com",
      room: "Lab 202",
      department: "MCA",
      semester: "3",
      className: "Division B",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });

    // 3: Spring boot (13:30 - 14:30)
    divBRecords.push({
      day,
      startTime: "13:30",
      endTime: "14:30",
      time: "13:30 - 14:30",
      subject: "Spring boot",
      subjectCode: "MCA302",
      faculty: asutosh ? asutosh.name : "Prof Asutosh Trivedi",
      facultyId: asutosh ? asutosh._id : null,
      facultyEmail: asutosh ? asutosh.email : "asutosh@gmail.com",
      room: "Room 102",
      department: "MCA",
      semester: "3",
      className: "Division B",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });

    // 4: UI/UX (14:30 - 15:30)
    divBRecords.push({
      day,
      startTime: "14:30",
      endTime: "15:30",
      time: "14:30 - 15:30",
      subject: "UI/UX",
      subjectCode: "MCA303",
      faculty: tinal ? tinal.name : "Prof. Tinal Parikh",
      facultyId: tinal ? tinal._id : null,
      facultyEmail: tinal ? tinal.email : "tinalparikh@gmail.com",
      room: "Room 101",
      department: "MCA",
      semester: "3",
      className: "Division B",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });

    // 5: Agile (15:30 - 16:30)
    divBRecords.push({
      day,
      startTime: "15:30",
      endTime: "16:30",
      time: "15:30 - 16:30",
      subject: "Agile",
      subjectCode: "MCA301",
      faculty: dipti ? dipti.name : "Dipti Bhatt",
      facultyId: dipti ? dipti._id : null,
      facultyEmail: dipti ? dipti.email : "dbhatt@gmail.com",
      room: "Lab 201",
      department: "MCA",
      semester: "3",
      className: "Division B",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });
  }

  await Timetable.insertMany(divBRecords);
  console.log(`✓ Inserted ${divBRecords.length} lectures for Division B with all 4 subjects!`);

  console.log("\nUpdate complete!");
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
