const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");
const Department = require("./models/Department");
const Semester = require("./models/Semester");
const Class = require("./models/Class");
const Subject = require("./models/Subject");
const TimeSlot = require("./models/TimeSlot");
const Room = require("./models/Room");
const Availability = require("./models/Availability");

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_timetable";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // 1. Seed Admin
    const existingAdmin = await User.findOne({ role: "admin" });
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "University Admin",
        email: "admin@university.edu",
        password: adminPassword,
        role: "admin",
        status: "active",
      });
      console.log("✓ Admin created: admin@university.edu / admin123");
    }

    // 2. Seed Departments
    const departmentsData = [
      { name: "Computer Science", code: "CS", description: "Department of Computer Science & Engineering" },
      { name: "Information Technology", code: "IT", description: "Department of Information Technology" },
      { name: "Computer Applications", code: "CA", description: "Department of Computer Applications" },
    ];

    for (const d of departmentsData) {
      await Department.findOneAndUpdate({ code: d.code }, d, { upsert: true, new: true });
    }
    console.log("✓ Departments seeded (Computer Science, Information Technology, Computer Applications)");

    // 3. Seed Semesters
    const csSemesters = ["1", "2", "3", "4", "5", "6"];
    for (const sem of csSemesters) {
      await Semester.findOneAndUpdate(
        { semesterNumber: sem, department: "Computer Science" },
        { semesterNumber: sem, department: "Computer Science", academicYear: "2025-2026", status: "active" },
        { upsert: true }
      );
      await Semester.findOneAndUpdate(
        { semesterNumber: sem, department: "Information Technology" },
        { semesterNumber: sem, department: "Information Technology", academicYear: "2025-2026", status: "active" },
        { upsert: true }
      );
    }
    console.log("✓ Semesters seeded (Semesters 1-6 for CS and IT)");

    // 4. Seed Classes
    const classesData = [
      { name: "BCA-A", department: "Computer Science", semester: "4", academicYear: "2025-2026", strength: 60 },
      { name: "BCA-B", department: "Computer Science", semester: "4", academicYear: "2025-2026", strength: 60 },
      { name: "BCA-Sem2", department: "Computer Science", semester: "2", academicYear: "2025-2026", strength: 55 },
      { name: "IT-Sem4", department: "Information Technology", semester: "4", academicYear: "2025-2026", strength: 50 },
    ];

    for (const c of classesData) {
      await Class.findOneAndUpdate(
        { name: c.name, department: c.department, semester: c.semester },
        c,
        { upsert: true }
      );
    }
    console.log("✓ Classes seeded (BCA-A, BCA-B, BCA-Sem2, IT-Sem4)");

    // 5. Seed Faculty
    const facultyPassword = await bcrypt.hash("faculty123", 10);
    const facultyList = [
      {
        name: "Prof. Dhami",
        email: "dhami@university.edu",
        department: "Computer Science",
        assignedSubjects: ["Java", "Advanced Java"],
        assignedClasses: ["BCA-A", "BCA-B"],
        phone: "9876543210",
      },
      {
        name: "Prof. Patel",
        email: "patel@university.edu",
        department: "Computer Science",
        assignedSubjects: ["DBMS", "Database Systems"],
        assignedClasses: ["BCA-A", "BCA-B"],
        phone: "9876543211",
      },
      {
        name: "Prof. Shah",
        email: "shah@university.edu",
        department: "Computer Science",
        assignedSubjects: ["Web Development", "Frontend Frameworks"],
        assignedClasses: ["BCA-A", "BCA-B"],
        phone: "9876543212",
      },
      {
        name: "Prof. Mehta",
        email: "mehta@university.edu",
        department: "Computer Science",
        assignedSubjects: ["Software Engineering", "System Design"],
        assignedClasses: ["BCA-A", "BCA-B"],
        phone: "9876543213",
      },
    ];

    const facultyDocs = {};
    for (const f of facultyList) {
      const doc = await User.findOneAndUpdate(
        { email: f.email },
        { ...f, password: facultyPassword, role: "faculty", status: "active" },
        { upsert: true, new: true }
      );
      facultyDocs[f.name] = doc;
    }
    console.log("✓ Faculty seeded (Prof. Dhami, Prof. Patel, Prof. Shah, Prof. Mehta - password: faculty123)");

    // 6. Seed Subjects
    const subjectsData = [
      {
        name: "Advanced Java",
        code: "AJ401",
        department: "Computer Science",
        semester: "4",
        credits: 4,
        weeklyLectures: 4,
        facultyName: "Prof. Dhami",
        facultyId: facultyDocs["Prof. Dhami"]?._id,
      },
      {
        name: "DBMS",
        code: "DB401",
        department: "Computer Science",
        semester: "4",
        credits: 4,
        weeklyLectures: 4,
        facultyName: "Prof. Patel",
        facultyId: facultyDocs["Prof. Patel"]?._id,
      },
      {
        name: "Web Development",
        code: "WD401",
        department: "Computer Science",
        semester: "4",
        credits: 3,
        weeklyLectures: 3,
        facultyName: "Prof. Shah",
        facultyId: facultyDocs["Prof. Shah"]?._id,
      },
      {
        name: "Software Engineering",
        code: "SE401",
        department: "Computer Science",
        semester: "4",
        credits: 3,
        weeklyLectures: 3,
        facultyName: "Prof. Mehta",
        facultyId: facultyDocs["Prof. Mehta"]?._id,
      },
    ];

    for (const s of subjectsData) {
      await Subject.findOneAndUpdate({ code: s.code }, s, { upsert: true });
    }
    console.log("✓ Subjects seeded (Advanced Java, DBMS, Web Development, Software Engineering)");

    // 7. Seed Rooms
    const roomsData = [
      { roomNumber: "Lab 201", roomType: "Computer Lab", capacity: 40, building: "Main Block" },
      { roomNumber: "Room 204", roomType: "Lecture Hall", capacity: 60, building: "Main Block" },
      { roomNumber: "Room 305", roomType: "Classroom", capacity: 60, building: "Science Block" },
      { roomNumber: "Seminar Hall", roomType: "Auditorium", capacity: 120, building: "Admin Block" },
    ];

    for (const r of roomsData) {
      await Room.findOneAndUpdate({ roomNumber: r.roomNumber }, r, { upsert: true });
    }
    console.log("✓ Rooms seeded (Lab 201, Room 204, Room 305, Seminar Hall)");

    // 8. Seed Time Slots
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const slots = [
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "10:00", endTime: "11:00" },
      { startTime: "11:00", endTime: "12:00" },
      { startTime: "01:00", endTime: "02:00" },
      { startTime: "02:00", endTime: "03:00" },
    ];

    for (const day of days) {
      for (const slot of slots) {
        await TimeSlot.findOneAndUpdate(
          { day, startTime: slot.startTime, endTime: slot.endTime },
          { day, startTime: slot.startTime, endTime: slot.endTime, slotLabel: `${slot.startTime} - ${slot.endTime}` },
          { upsert: true }
        );
      }
    }
    console.log("✓ Time Slots seeded (Monday-Friday 09:00 to 15:00)");

    // 9. Seed Sample Student
    const studentPassword = await bcrypt.hash("student123", 10);
    await User.findOneAndUpdate(
      { email: "student@university.edu" },
      {
        name: "Rahul Sharma",
        email: "student@university.edu",
        password: studentPassword,
        role: "student",
        enrollmentNo: "EN2025001",
        department: "Computer Science",
        semester: "4",
        className: "BCA-A",
        mobileNo: "9988776655",
        status: "active",
      },
      { upsert: true }
    );
    console.log("✓ Sample student seeded: student@university.edu / student123 (BCA-A, Sem 4)");

    console.log("=========================================");
    console.log("SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();
