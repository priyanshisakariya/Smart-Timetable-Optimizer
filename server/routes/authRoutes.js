const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Department = require("../models/Department");
const Semester = require("../models/Semester");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const TimeSlot = require("../models/TimeSlot");
const Room = require("../models/Room");
const Availability = require("../models/Availability");
const Timetable = require("../models/Timetable");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Helper to escape regex strings safely
const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Helper to convert "HH:mm" time string to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// ======================================================
// 1. AUTHENTICATION & USERS
// ======================================================

// REGISTER STUDENT
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      fullName,
      email,
      password,
      confirmPassword,
      role,
      enrollmentNo,
      department,
      semester,
      className,
      mobileNo,
    } = req.body;

    const studentName = (name || fullName || "").trim();
    const studentEmail = (email || "").trim().toLowerCase();

    if (!studentName || !studentEmail || !password) {
      return res.status(400).json({
        message: "Full name, email and password are required",
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and Confirm Password do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const cleanedMobile = (mobileNo || "").trim();
    if (cleanedMobile && !/^\d{10}$/.test(cleanedMobile)) {
      return res.status(400).json({
        message: "Student mobile number must be exactly 10 digits",
      });
    } 

    const existingUser = await User.findOne({ email: studentEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    if (enrollmentNo) {
      const existingEnrollment = await User.findOne({ enrollmentNo: enrollmentNo.trim() });
      if (existingEnrollment) {
        return res.status(400).json({
          message: "Student with this enrollment number already exists",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: studentName,
      email: studentEmail,
      password: hashedPassword,
      role: role || "student",
      enrollmentNo: (enrollmentNo || "").trim(),
      department: (department || "").trim(),
      semester: (semester || "").trim(),
      className: (className || "").trim(),
      mobileNo: (mobileNo || "").trim(),
      status: "active",
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollmentNo: user.enrollmentNo,
        department: user.department,
        semester: user.semester,
        className: user.className,
        mobileNo: user.mobileNo,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your account is deactivated. Please contact administrator.",
      });
    }

    let isPasswordCorrect = false;
    if (user.password) {
      isPasswordCorrect = await bcrypt.compare(password, user.password);
    }
    // Also allow student to login using their enrollment number directly as password (e.g. 25CI2110093)
    if (!isPasswordCorrect && user.role === "student" && user.enrollmentNo) {
      if (password.trim().toLowerCase() === user.enrollmentNo.trim().toLowerCase()) {
        isPasswordCorrect = true;
      }
    }

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET || "smart_timetable_secret_key_2026",
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollmentNo: user.enrollmentNo || "",
        department: user.department || "",
        semester: user.semester || "",
        className: user.className || "",
        mobileNo: user.mobileNo || user.phone || "",
        phone: user.phone || user.mobileNo || "",
        assignedSubjects: user.assignedSubjects || [],
        assignedClasses: user.assignedClasses || [],
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
});

// CREATE ADMIN
router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    await admin.save();
    res.status(201).json({
      message: "Admin created successfully",
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while creating admin", error: error.message });
  }
});

// RESET ADMIN PASSWORD
router.post("/reset-admin-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await User.findOne({ email: email.trim().toLowerCase(), role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found" });
    }

    admin.password = await bcrypt.hash(password, 10);
    await admin.save();
    res.status(200).json({ message: "Admin password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error while resetting admin password", error: error.message });
  }
});

// ======================================================
// 2. ADMIN DASHBOARD STATS
// ======================================================

router.get("/admin-dashboard", async (req, res) => {
  try {
    const [
      departmentCount,
      semesterCount,
      classCount,
      subjectCount,
      facultyCount,
      studentCount,
      timeslotCount,
      roomCount,
      timetableCount,
    ] = await Promise.all([
      Department.countDocuments({}),
      Semester.countDocuments({}),
      Class.countDocuments({}),
      Subject.countDocuments({}),
      User.countDocuments({ role: "faculty" }),
      User.countDocuments({ role: "student" }),
      TimeSlot.countDocuments({}),
      Room.countDocuments({}),
      Timetable.countDocuments({}),
    ]);

    res.status(200).json({
      success: true,
      message: "Admin dashboard data fetched successfully",
      departmentCount,
      departments: departmentCount,
      semesterCount,
      semesters: semesterCount,
      classCount,
      classes: classCount,
      subjectCount,
      subjects: subjectCount,
      facultyCount,
      faculty: facultyCount,
      studentCount,
      students: studentCount,
      timeslotCount,
      timeSlots: timeslotCount,
      roomCount,
      rooms: roomCount,
      timetableCount,
      timetable: timetableCount,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({
      message: "Failed to fetch admin dashboard stats",
      error: error.message,
    });
  }
});

// ======================================================
// 3. DEPARTMENT MANAGEMENT
// ======================================================

// GET ALL DEPARTMENTS
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find({}).sort({ name: 1 });
    res.status(200).json(departments);
  } catch (error) {
    console.error("Get Departments Error:", error);
    res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
});

// ADD DEPARTMENT
router.post("/add-department", async (req, res) => {
  try {
    const { name, code, description, status } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: "Department Name and Code are required" });
    }

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    const existingDept = await Department.findOne({
      $or: [{ name: cleanName }, { code: cleanCode }],
    });

    if (existingDept) {
      return res.status(400).json({ message: "Department name or code already exists" });
    }

    const department = new Department({
      name: cleanName,
      code: cleanCode,
      description: (description || "").trim(),
      status: status || "active",
    });

    await department.save();
    res.status(201).json({
      success: true,
      message: "Department added successfully",
      department,
    });
  } catch (error) {
    console.error("Add Department Error:", error);
    res.status(500).json({ message: "Server error while adding department", error: error.message });
  }
});

// UPDATE DEPARTMENT
router.put("/update-department/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }

    const cleanName = (name || "").trim();
    const cleanCode = (code || "").trim().toUpperCase();

    const existingDept = await Department.findOne({
      _id: { $ne: id },
      $or: [{ name: cleanName }, { code: cleanCode }],
    });

    if (existingDept) {
      return res.status(400).json({ message: "Another department with this name or code exists" });
    }

    const updatedDept = await Department.findByIdAndUpdate(
      id,
      {
        name: cleanName,
        code: cleanCode,
        description: (description || "").trim(),
        status: status || "active",
      },
      { new: true }
    );

    if (!updatedDept) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department: updatedDept,
    });
  } catch (error) {
    console.error("Update Department Error:", error);
    res.status(500).json({ message: "Server error while updating department", error: error.message });
  }
});

// DELETE DEPARTMENT
router.delete("/delete-department/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }

    const deletedDept = await Department.findByIdAndDelete(id);
    if (!deletedDept) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete Department Error:", error);
    res.status(500).json({ message: "Server error while deleting department", error: error.message });
  }
});

// ======================================================
// 4. SEMESTER MANAGEMENT
// ======================================================

// GET ALL SEMESTERS (optional ?department=...)
router.get("/semesters", async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) {
      filter.department = {
        $regex: `^\\s*${escapeRegex(req.query.department.trim())}\\s*$`,
        $options: "i",
      };
    }

    const semesters = await Semester.find(filter).sort({ semesterNumber: 1 });
    res.status(200).json(semesters);
  } catch (error) {
    console.error("Get Semesters Error:", error);
    res.status(500).json({ message: "Failed to fetch semesters", error: error.message });
  }
});

// GET SEMESTERS BY DEPARTMENT
router.get("/semesters/by-department/:department", async (req, res) => {
  try {
    const { department } = req.params;
    const semesters = await Semester.find({
      department: {
        $regex: `^\\s*${escapeRegex(department.trim())}\\s*$`,
        $options: "i",
      },
      status: "active",
    }).sort({ semesterNumber: 1 });

    res.status(200).json(semesters);
  } catch (error) {
    console.error("Get Semesters By Dept Error:", error);
    res.status(500).json({ message: "Failed to fetch semesters", error: error.message });
  }
});

// ADD SEMESTER
router.post("/add-semester", async (req, res) => {
  try {
    const { semesterNumber, department, academicYear, status } = req.body;
    if (!semesterNumber || !department) {
      return res.status(400).json({ message: "Semester Number and Department are required" });
    }

    const cleanSemNum = String(semesterNumber).trim();
    const cleanDept = department.trim();

    const existingSem = await Semester.findOne({
      semesterNumber: cleanSemNum,
      department: { $regex: `^\\s*${escapeRegex(cleanDept)}\\s*$`, $options: "i" },
    });

    if (existingSem) {
      return res.status(400).json({ message: `Semester ${cleanSemNum} already exists for ${cleanDept}` });
    }

    const semester = new Semester({
      semesterNumber: cleanSemNum,
      department: cleanDept,
      academicYear: (academicYear || "2025-2026").trim(),
      status: status || "active",
    });

    await semester.save();
    res.status(201).json({
      success: true,
      message: "Semester added successfully",
      semester,
    });
  } catch (error) {
    console.error("Add Semester Error:", error);
    res.status(500).json({ message: "Server error while adding semester", error: error.message });
  }
});

// UPDATE SEMESTER
router.put("/update-semester/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { semesterNumber, department, academicYear, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid semester ID" });
    }

    const cleanSemNum = String(semesterNumber).trim();
    const cleanDept = (department || "").trim();

    const existingSem = await Semester.findOne({
      _id: { $ne: id },
      semesterNumber: cleanSemNum,
      department: { $regex: `^\\s*${escapeRegex(cleanDept)}\\s*$`, $options: "i" },
    });

    if (existingSem) {
      return res.status(400).json({ message: `Semester ${cleanSemNum} already exists for ${cleanDept}` });
    }

    const updatedSem = await Semester.findByIdAndUpdate(
      id,
      {
        semesterNumber: cleanSemNum,
        department: cleanDept,
        academicYear: (academicYear || "2025-2026").trim(),
        status: status || "active",
      },
      { new: true }
    );

    if (!updatedSem) {
      return res.status(404).json({ message: "Semester not found" });
    }

    res.status(200).json({
      success: true,
      message: "Semester updated successfully",
      semester: updatedSem,
    });
  } catch (error) {
    console.error("Update Semester Error:", error);
    res.status(500).json({ message: "Server error while updating semester", error: error.message });
  }
});

// DELETE SEMESTER
router.delete("/delete-semester/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid semester ID" });
    }

    const deletedSem = await Semester.findByIdAndDelete(id);
    if (!deletedSem) {
      return res.status(404).json({ message: "Semester not found" });
    }

    res.status(200).json({
      success: true,
      message: "Semester deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete Semester Error:", error);
    res.status(500).json({ message: "Server error while deleting semester", error: error.message });
  }
});

// ======================================================
// 5. CLASS / DIVISION MANAGEMENT
// ======================================================

// GET ALL CLASSES (supports ?department=...&semester=...)
router.get("/classes", async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) {
      filter.department = {
        $regex: `^\\s*${escapeRegex(req.query.department.trim())}\\s*$`,
        $options: "i",
      };
    }
    if (req.query.semester) {
      filter.semester = {
        $regex: `^\\s*${escapeRegex(req.query.semester.trim())}\\s*$`,
        $options: "i",
      };
    }

    const classes = await Class.find(filter).sort({ department: 1, semester: 1, name: 1 });
    res.status(200).json(classes);
  } catch (error) {
    console.error("Get Classes Error:", error);
    res.status(500).json({ message: "Failed to fetch classes", error: error.message });
  }
});

// GET CLASSES BY DEPT AND SEMESTER
router.get("/classes/by-dept-sem", async (req, res) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    if (department) {
      filter.department = {
        $regex: `^\\s*${escapeRegex(department.trim())}\\s*$`,
        $options: "i",
      };
    }
    if (semester) {
      filter.semester = {
        $regex: `^\\s*${escapeRegex(semester.trim())}\\s*$`,
        $options: "i",
      };
    }

    const classes = await Class.find(filter).sort({ name: 1 });
    res.status(200).json(classes);
  } catch (error) {
    console.error("Get Classes By Dept Sem Error:", error);
    res.status(500).json({ message: "Failed to fetch classes", error: error.message });
  }
});

// ADD CLASS
router.post("/add-class", async (req, res) => {
  try {
    const { name, department, semester, academicYear, strength, status } = req.body;

    if (!name || !department || !semester) {
      return res.status(400).json({ message: "Class Name, Department and Semester are required" });
    }

    const cleanName = name.trim();
    const cleanDept = department.trim();
    const cleanSem = String(semester).trim();

    const existingClass = await Class.findOne({
      name: { $regex: `^\\s*${escapeRegex(cleanName)}\\s*$`, $options: "i" },
      department: { $regex: `^\\s*${escapeRegex(cleanDept)}\\s*$`, $options: "i" },
      semester: { $regex: `^\\s*${escapeRegex(cleanSem)}\\s*$`, $options: "i" },
    });

    if (existingClass) {
      return res.status(400).json({ message: `Class ${cleanName} already exists for ${cleanDept} Semester ${cleanSem}` });
    }

    const newClass = new Class({
      name: cleanName,
      department: cleanDept,
      semester: cleanSem,
      academicYear: (academicYear || "2025-2026").trim(),
      strength: Number(strength) || 60,
      status: status || "active",
    });

    await newClass.save();
    res.status(201).json({
      success: true,
      message: "Class added successfully",
      class: newClass,
    });
  } catch (error) {
    console.error("Add Class Error:", error);
    res.status(500).json({ message: "Server error while adding class", error: error.message });
  }
});

// UPDATE CLASS
router.put("/update-class/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, semester, academicYear, strength, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const cleanName = (name || "").trim();
    const cleanDept = (department || "").trim();
    const cleanSem = String(semester || "").trim();

    const existingClass = await Class.findOne({
      _id: { $ne: id },
      name: { $regex: `^\\s*${escapeRegex(cleanName)}\\s*$`, $options: "i" },
      department: { $regex: `^\\s*${escapeRegex(cleanDept)}\\s*$`, $options: "i" },
      semester: { $regex: `^\\s*${escapeRegex(cleanSem)}\\s*$`, $options: "i" },
    });

    if (existingClass) {
      return res.status(400).json({ message: `Class ${cleanName} already exists for ${cleanDept} Semester ${cleanSem}` });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      {
        name: cleanName,
        department: cleanDept,
        semester: cleanSem,
        academicYear: (academicYear || "2025-2026").trim(),
        strength: Number(strength) || 60,
        status: status || "active",
      },
      { new: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Update Class Error:", error);
    res.status(500).json({ message: "Server error while updating class", error: error.message });
  }
});

// DELETE CLASS
router.delete("/delete-class/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const deletedClass = await Class.findByIdAndDelete(id);
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete Class Error:", error);
    res.status(500).json({ message: "Server error while deleting class", error: error.message });
  }
});

// ======================================================
// 6. SUBJECT MANAGEMENT
// ======================================================

// GET ALL SUBJECTS (supports ?department=...&semester=...)
router.get("/subjects", async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) {
      filter.department = {
        $regex: `^\\s*${escapeRegex(req.query.department.trim())}\\s*$`,
        $options: "i",
      };
    }
    if (req.query.semester) {
      filter.semester = {
        $regex: `^\\s*${escapeRegex(req.query.semester.trim())}\\s*$`,
        $options: "i",
      };
    }

    const subjects = await Subject.find(filter).sort({ department: 1, semester: 1, name: 1 });
    res.status(200).json(subjects);
  } catch (error) {
    console.error("Get Subjects Error:", error);
    res.status(500).json({ message: "Failed to fetch subjects", error: error.message });
  }
});

// ADD SUBJECT
router.post("/add-subject", async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      semester,
      credits,
      weeklyLectures,
      facultyId,
      facultyName,
      className,
    } = req.body;

    if (!name || !code || !department || !semester) {
      return res.status(400).json({ message: "Name, code, department, and semester are required" });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const existingSubject = await Subject.findOne({ code: cleanCode });
    if (existingSubject) {
      return res.status(400).json({ message: "Subject code already exists" });
    }

    let facultyObjId = null;
    let resolvedFacultyName = facultyName || "";

    if (facultyId && mongoose.Types.ObjectId.isValid(facultyId)) {
      facultyObjId = new mongoose.Types.ObjectId(facultyId);
      if (!resolvedFacultyName) {
        const fac = await User.findById(facultyObjId);
        if (fac) resolvedFacultyName = fac.name;
      }
    }

    const subject = new Subject({
      name: String(name).trim(),
      code: cleanCode,
      department: String(department).trim(),
      semester: String(semester).trim(),
      className: (className || "").trim(),
      credits: Number(credits) || 4,
      weeklyLectures: Number(weeklyLectures || credits) || 4,
      facultyId: facultyObjId,
      facultyName: resolvedFacultyName,
      status: "active",
    });

    await subject.save();

    res.status(201).json({
      success: true,
      message: "Subject added successfully",
      subject,
    });
  } catch (error) {
    console.error("Add Subject Error:", error);
    res.status(500).json({ message: "Server error while adding subject", error: error.message });
  }
});

// UPDATE SUBJECT
router.put("/update-subject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    const {
      name,
      code,
      department,
      semester,
      credits,
      weeklyLectures,
      facultyId,
      facultyName,
      className,
      status,
    } = req.body;

    const cleanCode = String(code || "").trim().toUpperCase();

    const existingSubject = await Subject.findOne({
      _id: { $ne: id },
      code: cleanCode,
    });

    if (existingSubject) {
      return res.status(400).json({ message: "Subject code already exists on another subject" });
    }

    let facultyObjId = null;
    let resolvedFacultyName = facultyName || "";

    if (facultyId && mongoose.Types.ObjectId.isValid(facultyId)) {
      facultyObjId = new mongoose.Types.ObjectId(facultyId);
      if (!resolvedFacultyName) {
        const fac = await User.findById(facultyObjId);
        if (fac) resolvedFacultyName = fac.name;
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      {
        name: String(name).trim(),
        code: cleanCode,
        department: String(department).trim(),
        semester: String(semester).trim(),
        className: (className || "").trim(),
        credits: Number(credits) || 4,
        weeklyLectures: Number(weeklyLectures || credits) || 4,
        facultyId: facultyObjId,
        facultyName: resolvedFacultyName,
        status: status || "active",
      },
      { new: true }
    );

    if (!updatedSubject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error("Update Subject Error:", error);
    res.status(500).json({ message: "Server error while updating subject", error: error.message });
  }
});

// DELETE SUBJECT
router.delete("/delete-subject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    const deletedSubject = await Subject.findByIdAndDelete(id);
    if (!deletedSubject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete Subject Error:", error);
    res.status(500).json({ message: "Server error while deleting subject", error: error.message });
  }
});

// ======================================================
// 7. FACULTY MANAGEMENT
// ======================================================

// GET ALL FACULTY
router.get("/faculty", async (req, res) => {
  try {
    const filter = { role: "faculty" };
    if (req.query.department) {
      filter.department = {
        $regex: `^\\s*${escapeRegex(req.query.department.trim())}\\s*$`,
        $options: "i",
      };
    }

    const faculty = await User.find(filter).select("-password").sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Faculty fetched successfully",
      faculty,
    });
  } catch (error) {
    console.error("Get Faculty Error:", error);
    res.status(500).json({ message: "Server error while fetching faculty", error: error.message });
  }
});

// ADD FACULTY
router.post("/add-faculty", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      department,
      phone,
      mobileNo,
      assignedSubjects,
      assignedClasses,
      status,
    } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({
        message: "Full Name, Email, Password, and Department are required",
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and Confirm Password do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const cleanedPhone = (phone || mobileNo || "").trim();
    if (cleanedPhone && !/^\d{10}$/.test(cleanedPhone)) {
      return res.status(400).json({
        message: "Faculty phone number must be exactly 10 digits",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "Faculty with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "faculty",
      department: department.trim(),
      phone: (phone || mobileNo || "").trim(),
      mobileNo: (mobileNo || phone || "").trim(),
      assignedSubjects: Array.isArray(assignedSubjects) ? assignedSubjects : [],
      assignedClasses: Array.isArray(assignedClasses) ? assignedClasses : [],
      status: status || "active",
    });

    await faculty.save();

    res.status(201).json({
      success: true,
      message: "Faculty added successfully",
      faculty: {
        id: faculty._id,
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        role: faculty.role,
        department: faculty.department,
        phone: faculty.phone,
        assignedSubjects: faculty.assignedSubjects,
        assignedClasses: faculty.assignedClasses,
        status: faculty.status,
      },
    });
  } catch (error) {
    console.error("Add Faculty Error:", error);
    res.status(500).json({ message: "Server error while adding faculty", error: error.message });
  }
});

// UPDATE FACULTY
router.put("/update-faculty/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid faculty ID" });
    }

    const {
      name,
      email,
      department,
      password,
      confirmPassword,
      phone,
      mobileNo,
      assignedSubjects,
      assignedClasses,
      status,
    } = req.body;

    if (!name || !email || !department) {
      return res.status(400).json({ message: "Name, email, and department are required" });
    }

    if (phone !== undefined || mobileNo !== undefined) {
      const cleanedPhone = (phone || mobileNo || "").trim();
      if (cleanedPhone && !/^\d{10}$/.test(cleanedPhone)) {
        return res.status(400).json({
          message: "Faculty phone number must be exactly 10 digits",
        });
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingEmail = await User.findOne({
      email: cleanEmail,
      _id: { $ne: id },
    });

    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists on another account" });
    }

    const faculty = await User.findOne({ _id: id, role: "faculty" });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    faculty.name = name.trim();
    faculty.email = cleanEmail;
    faculty.department = department.trim();
    if (phone !== undefined || mobileNo !== undefined) {
      faculty.phone = (phone || mobileNo || "").trim();
      faculty.mobileNo = (mobileNo || phone || "").trim();
    }
    if (assignedSubjects !== undefined) {
      faculty.assignedSubjects = Array.isArray(assignedSubjects) ? assignedSubjects : [];
    }
    if (assignedClasses !== undefined) {
      faculty.assignedClasses = Array.isArray(assignedClasses) ? assignedClasses : [];
    }
    if (status) {
      faculty.status = status;
    }

    if (password && password.trim()) {
      if (confirmPassword !== undefined && password !== confirmPassword) {
        return res.status(400).json({ message: "Password and Confirm Password do not match" });
      }
      faculty.password = await bcrypt.hash(password, 10);
    }

    await faculty.save();

    res.status(200).json({
      success: true,
      message: "Faculty updated successfully",
      faculty: {
        id: faculty._id,
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        role: faculty.role,
        phone: faculty.phone,
        assignedSubjects: faculty.assignedSubjects,
        assignedClasses: faculty.assignedClasses,
        status: faculty.status,
      },
    });
  } catch (error) {
    console.error("Update Faculty Error:", error);
    res.status(500).json({ message: "Server error while updating faculty", error: error.message });
  }
});

// DELETE FACULTY
router.delete("/delete-faculty/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid faculty ID" });
    }

    const faculty = await User.findOneAndDelete({ _id: id, role: "faculty" });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json({ success: true, message: "Faculty deleted successfully" });
  } catch (error) {
    console.error("Delete Faculty Error:", error);
    res.status(500).json({ message: "Server error while deleting faculty", error: error.message });
  }
});

// GET FACULTY PROFILE
router.get("/faculty-profile", async (req, res) => {
  try {
    const facultyId = String(req.query.id || "").trim();
    if (!facultyId || !mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ message: "Valid Faculty ID is required" });
    }

    const faculty = await User.findOne({ _id: facultyId, role: "faculty" }).select("-password");
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json({
      success: true,
      message: "Faculty profile fetched successfully",
      faculty: {
        _id: faculty._id,
        id: faculty._id,
        name: faculty.name || "",
        email: faculty.email || "",
        phone: faculty.phone || faculty.mobileNo || "",
        mobileNo: faculty.mobileNo || faculty.phone || "",
        department: faculty.department || "",
        assignedSubjects: faculty.assignedSubjects || [],
        assignedClasses: faculty.assignedClasses || [],
      },
    });
  } catch (error) {
    console.error("Get Faculty Profile Error:", error);
    res.status(500).json({ message: "Failed to fetch faculty profile", error: error.message });
  }
});

// UPDATE FACULTY PROFILE
router.put("/faculty-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, mobileNo, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid faculty ID" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: id } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists on another account" });
    }

    const updatedFaculty = await User.findOneAndUpdate(
      { _id: id, role: "faculty" },
      {
        $set: {
          name: (name || "").trim(),
          email: cleanEmail,
          phone: (phone || mobileNo || "").trim(),
          mobileNo: (mobileNo || phone || "").trim(),
          department: (department || "").trim(),
        },
      },
      { new: true }
    ).select("-password");

    if (!updatedFaculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json({
      success: true,
      message: "Faculty profile updated successfully",
      faculty: {
        _id: updatedFaculty._id,
        id: updatedFaculty._id,
        name: updatedFaculty.name,
        email: updatedFaculty.email,
        phone: updatedFaculty.phone,
        department: updatedFaculty.department,
      },
    });
  } catch (error) {
    console.error("Update Faculty Profile Error:", error);
    res.status(500).json({ message: "Failed to update faculty profile", error: error.message });
  }
});

// ======================================================
// 8. STUDENT MANAGEMENT
// ======================================================

// GET ALL STUDENTS
router.get("/students", async (req, res) => {
  try {
    const filter = { role: "student" };
    if (req.query.department) {
      filter.department = { $regex: `^\\s*${escapeRegex(req.query.department.trim())}\\s*$`, $options: "i" };
    }
    if (req.query.semester) {
      filter.semester = { $regex: `^\\s*${escapeRegex(req.query.semester.trim())}\\s*$`, $options: "i" };
    }
    if (req.query.className) {
      filter.className = { $regex: `^\\s*${escapeRegex(req.query.className.trim())}\\s*$`, $options: "i" };
    }

    const students = await User.find(filter).select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      students,
    });
  } catch (error) {
    console.error("Get Students Error:", error);
    res.status(500).json({ message: "Server error while fetching students", error: error.message });
  }
});

// ADD STUDENT (by Admin or Postman)
router.post("/add-student", async (req, res) => {
  try {
    const { name, email, enrollmentNo, department, semester, className, mobileNo, password } = req.body;

    if (!name || !email || !enrollmentNo || !department || !semester) {
      return res.status(400).json({
        message: "Name, email, enrollment number, department, and semester are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const cleanEnrollment = enrollmentNo.trim();
    const existingStudent = await User.findOne({ enrollmentNo: cleanEnrollment });
    if (existingStudent) {
      return res.status(400).json({ message: "Student with this enrollment number already exists" });
    }

    // Default password is their Enrollment Number (e.g. 25CI2110093), or custom password if provided
    const defaultPassword = cleanEnrollment || "student123";
    const chosenPassword = (password && String(password).trim().length >= 6)
      ? String(password).trim()
      : defaultPassword;
    const hashedPassword = await bcrypt.hash(chosenPassword, 10);

    const student = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "student",
      enrollmentNo: cleanEnrollment,
      department: department.trim(),
      semester: String(semester).trim(),
      className: (className || "").trim(),
      mobileNo: (mobileNo || "").trim(),
      status: "active",
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      student: {
        id: student._id,
        _id: student._id,
        name: student.name,
        email: student.email,
        enrollmentNo: student.enrollmentNo,
        department: student.department,
        semester: student.semester,
        className: student.className,
        role: student.role,
      },
      defaultPassword: chosenPassword,
      loginCredentials: {
        email: student.email,
        password: chosenPassword,
        role: "student",
      },
    });
  } catch (error) {
    console.error("Add Student Error:", error);
    res.status(500).json({ message: "Server error while adding student", error: error.message });
  }
});

// UPDATE STUDENT
router.put("/update-student/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const { name, email, enrollmentNo, department, semester, className, mobileNo, password } = req.body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: id } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists on another account" });
    }

    const cleanEnrollment = (enrollmentNo || "").trim();
    if (cleanEnrollment) {
      const existingEnrollment = await User.findOne({ enrollmentNo: cleanEnrollment, _id: { $ne: id } });
      if (existingEnrollment) {
        return res.status(400).json({ message: "Enrollment number already exists" });
      }
    }

    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.name = (name || student.name).trim();
    student.email = cleanEmail || student.email;
    if (cleanEnrollment) student.enrollmentNo = cleanEnrollment;
    if (department) student.department = department.trim();
    if (semester) student.semester = String(semester).trim();
    if (className !== undefined) student.className = className.trim();
    if (mobileNo !== undefined) student.mobileNo = mobileNo.trim();
    if (password && String(password).trim().length >= 6) {
      student.password = await bcrypt.hash(String(password).trim(), 10);
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: {
        id: student._id,
        _id: student._id,
        name: student.name,
        email: student.email,
        enrollmentNo: student.enrollmentNo,
        department: student.department,
        semester: student.semester,
        className: student.className,
        role: student.role,
        mobileNo: student.mobileNo,
      },
    });
  } catch (error) {
    console.error("Update Student Error:", error);
    res.status(500).json({ message: "Server error while updating student", error: error.message });
  }
});

// DELETE STUDENT
router.delete("/delete-student/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await User.findOneAndDelete({ _id: id, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      studentId: student._id,
    });
  } catch (error) {
    console.error("Delete Student Error:", error);
    res.status(500).json({ message: "Server error while deleting student", error: error.message });
  }
});

// GET STUDENT PROFILE
router.get("/student-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await User.findOne({ _id: id, role: "student" }).select("-password");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      success: true,
      message: "Student profile fetched successfully",
      student: {
        _id: student._id,
        id: student._id,
        name: student.name || "",
        email: student.email || "",
        mobileNo: student.mobileNo || "",
        enrollmentNo: student.enrollmentNo || "",
        department: student.department || "",
        semester: student.semester || "",
        className: student.className || "",
      },
    });
  } catch (error) {
    console.error("Get Student Profile Error:", error);
    res.status(500).json({ message: "Failed to fetch student profile", error: error.message });
  }
});

// UPDATE STUDENT PROFILE
router.put("/student-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobileNo, enrollmentNo, department, semester, className } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: id } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const updatedStudent = await User.findOneAndUpdate(
      { _id: id, role: "student" },
      {
        $set: {
          name: (name || "").trim(),
          email: cleanEmail,
          mobileNo: (mobileNo || "").trim(),
          enrollmentNo: (enrollmentNo || "").trim(),
          department: (department || "").trim(),
          semester: String(semester || "").trim(),
          className: (className || "").trim(),
        },
      },
      { new: true }
    ).select("-password");

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      success: true,
      message: "Student profile updated successfully",
      student: {
        _id: updatedStudent._id,
        id: updatedStudent._id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        mobileNo: updatedStudent.mobileNo,
        enrollmentNo: updatedStudent.enrollmentNo,
        department: updatedStudent.department,
        semester: updatedStudent.semester,
        className: updatedStudent.className,
      },
    });
  } catch (error) {
    console.error("Update Student Profile Error:", error);
    res.status(500).json({ message: "Failed to update student profile", error: error.message });
  }
});

// ======================================================
// 9. TIME SLOTS MANAGEMENT
// ======================================================

// GET ALL TIME SLOTS
// Pagination API: supports ?page=1&limit=5&day=Monday and returns metadata plus paginated data.
// If page/limit are not provided, it still returns the full array for backward compatibility.
router.get("/timeslots", async (req, res) => {
  try {
    const requestedPage = Number(req.query.page);
    const requestedLimit = Number(req.query.limit);
    const requestedDay = req.query.day;

    const filter = {};
    if (requestedDay) {
      filter.day = {
        $regex: `^\\s*${escapeRegex(String(requestedDay))}\\s*$`,
        $options: "i",
      };
    }

    const hasPagination = Number.isInteger(requestedPage) && requestedPage > 0 &&
      Number.isInteger(requestedLimit) && requestedLimit > 0;

    if (!hasPagination) {
      const timeSlots = await TimeSlot.find(filter).sort({ day: 1, startTime: 1 });
      return res.status(200).json(timeSlots);
    }

    const page = requestedPage;
    const limit = requestedLimit;
    const skip = (page - 1) * limit;

    const [timeSlots, totalItems] = await Promise.all([
      TimeSlot.find(filter).sort({ day: 1, startTime: 1 }).skip(skip).limit(limit),
      TimeSlot.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      page,
      limit,
      totalItems,
      totalPages,
      data: timeSlots,
    });
  } catch (error) {
    console.error("Get Time Slots Error:", error);
    res.status(500).json({ message: "Failed to fetch time slots", error: error.message });
  }
});

// ADD TIME SLOT
router.post("/timeslots", async (req, res) => {
  try {
    // 1. Support batch insert if array of slots is sent
    if (Array.isArray(req.body) && req.body.length > 0) {
      const created = [];
      for (const item of req.body) {
        const { day, startTime, endTime } = item;
        if (day && startTime && endTime) {
          const cleanDay = day.trim();
          const startMin = timeToMinutes(startTime);
          const endMin = timeToMinutes(endTime);
          if (startMin < endMin) {
            const existingSlots = await TimeSlot.find({
              day: { $regex: `^\\s*${escapeRegex(cleanDay)}\\s*$`, $options: "i" },
            });
            const overlapping = existingSlots.find((s) => {
              const eStart = timeToMinutes(s.startTime);
              const eEnd = timeToMinutes(s.endTime);
              return startMin < eEnd && endMin > eStart;
            });
            if (!overlapping) {
              const slot = new TimeSlot({
                day: cleanDay,
                startTime: startTime.trim(),
                endTime: endTime.trim(),
                slotLabel: `${startTime.trim()} - ${endTime.trim()}`,
              });
              await slot.save();
              created.push(slot);
            }
          }
        }
      }
      return res.status(201).json({
        success: true,
        message: `${created.length} time slots added successfully`,
        timeSlots: created,
      });
    }

    // 2. Default single time slot
    const { day, startTime, endTime } = req.body;
    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: "Day, start time, and end time are required" });
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (startMin >= endMin) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const cleanDay = day.trim();

    // Check for overlapping time slots on the same day:
    const existingSlots = await TimeSlot.find({
      day: { $regex: `^\\s*${escapeRegex(cleanDay)}\\s*$`, $options: "i" },
    });

    const overlappingSlot = existingSlots.find((slot) => {
      const existingStart = timeToMinutes(slot.startTime);
      const existingEnd = timeToMinutes(slot.endTime);
      return startMin < existingEnd && endMin > existingStart;
    });

    if (overlappingSlot) {
      return res.status(400).json({
        message: `This time slot overlaps with an existing ${cleanDay} time slot (${overlappingSlot.startTime} - ${overlappingSlot.endTime}).`,
      });
    }

    const timeSlot = new TimeSlot({
      day: cleanDay,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      slotLabel: `${startTime.trim()} - ${endTime.trim()}`,
    });

    await timeSlot.save();

    res.status(201).json({
      success: true,
      message: "Time slot added successfully",
      timeSlot,
    });
  } catch (error) {
    console.error("Add Time Slot Error:", error);
    res.status(500).json({ message: "Failed to add time slot", error: error.message });
  }
});

// UPDATE TIME SLOT
router.put("/timeslots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { day, startTime, endTime } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid time slot ID" });
    }

    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: "Day, start time, and end time are required" });
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (startMin >= endMin) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const cleanDay = day.trim();

    // Check for overlapping time slots on the same day excluding current slot
    const existingSlots = await TimeSlot.find({
      _id: { $ne: id },
      day: { $regex: `^\\s*${escapeRegex(cleanDay)}\\s*$`, $options: "i" },
    });

    const overlappingSlot = existingSlots.find((slot) => {
      const existingStart = timeToMinutes(slot.startTime);
      const existingEnd = timeToMinutes(slot.endTime);
      return startMin < existingEnd && endMin > existingStart;
    });

    if (overlappingSlot) {
      return res.status(400).json({
        message: `This time slot overlaps with an existing ${cleanDay} time slot (${overlappingSlot.startTime} - ${overlappingSlot.endTime}).`,
      });
    }

    const updatedSlot = await TimeSlot.findByIdAndUpdate(
      id,
      {
        day: cleanDay,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        slotLabel: `${startTime.trim()} - ${endTime.trim()}`,
      },
      { new: true }
    );

    if (!updatedSlot) {
      return res.status(404).json({ message: "Time slot not found" });
    }

    res.status(200).json({
      success: true,
      message: "Time slot updated successfully",
      timeSlot: updatedSlot,
    });
  } catch (error) {
    console.error("Update Time Slot Error:", error);
    res.status(500).json({ message: "Failed to update time slot", error: error.message });
  }
});

// DELETE TIME SLOT
router.delete("/timeslots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid time slot ID" });
    }

    const deletedSlot = await TimeSlot.findByIdAndDelete(id);
    if (!deletedSlot) {
      return res.status(404).json({ message: "Time slot not found" });
    }

    res.status(200).json({ success: true, message: "Time slot deleted successfully" });
  } catch (error) {
    console.error("Delete Time Slot Error:", error);
    res.status(500).json({ message: "Failed to delete time slot", error: error.message });
  }
});

// ======================================================
// 10. ROOM MANAGEMENT
// ======================================================

// GET ALL ROOMS
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ roomNumber: 1 });
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Get Rooms Error:", error);
    res.status(500).json({ message: "Failed to fetch rooms", error: error.message });
  }
});

// ADD ROOM
router.post("/rooms", async (req, res) => {
  try {
    // 1. Support batch insert if array of rooms is sent
    if (Array.isArray(req.body) && req.body.length > 0) {
      const created = [];
      for (const item of req.body) {
        const { roomNumber, roomType, capacity, building, status } = item;
        if (roomNumber && roomType && capacity && building) {
          const cleanRoomNum = roomNumber.trim();
          const existingRoom = await Room.findOne({ roomNumber: cleanRoomNum });
          if (!existingRoom) {
            const room = new Room({
              roomNumber: cleanRoomNum,
              roomType: roomType.trim(),
              capacity: Number(capacity) || 60,
              building: building.trim(),
              status: status || "active",
            });
            await room.save();
            created.push(room);
          }
        }
      }
      return res.status(201).json({
        success: true,
        message: `${created.length} rooms added successfully`,
        rooms: created,
      });
    }

    // 2. Default single room
    const { roomNumber, roomType, capacity, building, status } = req.body;
    if (!roomNumber || !roomType || !capacity || !building) {
      return res.status(400).json({ message: "All room fields are required" });
    }

    const cleanRoomNum = roomNumber.trim();
    const existingRoom = await Room.findOne({ roomNumber: cleanRoomNum });
    if (existingRoom) {
      return res.status(400).json({ message: "Room number already exists" });
    }

    const room = new Room({
      roomNumber: cleanRoomNum,
      roomType: roomType.trim(),
      capacity: Number(capacity) || 60,
      building: building.trim(),
      status: status || "active",
    });

    await room.save();

    res.status(201).json({
      success: true,
      message: "Room added successfully",
      room,
    });
  } catch (error) {
    console.error("Add Room Error:", error);
    res.status(500).json({ message: "Failed to add room", error: error.message });
  }
});

// UPDATE ROOM
router.put("/rooms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, roomType, capacity, building, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const cleanRoomNum = (roomNumber || "").trim();
    const existingRoom = await Room.findOne({
      roomNumber: cleanRoomNum,
      _id: { $ne: id },
    });

    if (existingRoom) {
      return res.status(400).json({ message: "Room number already exists on another room" });
    }

    const updateData = {
      roomNumber: cleanRoomNum,
      roomType: (roomType || "").trim(),
      capacity: Number(capacity) || 60,
      building: (building || "").trim(),
    };
    if (status) {
      updateData.status = status;
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error) {
    console.error("Update Room Error:", error);
    res.status(500).json({ message: "Failed to update room", error: error.message });
  }
});

// TOGGLE ROOM STATUS
router.patch("/rooms/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.status = status || (room.status === "active" ? "inactive" : "active");
    await room.save();

    res.status(200).json({
      success: true,
      message: `Room status updated to ${room.status}`,
      room,
    });
  } catch (error) {
    console.error("Toggle Room Status Error:", error);
    res.status(500).json({ message: "Failed to update room status", error: error.message });
  }
});

// DELETE ROOM
router.delete("/rooms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const deletedRoom = await Room.findByIdAndDelete(id);
    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete Room Error:", error);
    res.status(500).json({ message: "Failed to delete room", error: error.message });
  }
});

// ======================================================
// 11. FACULTY AVAILABILITY MANAGEMENT
// ======================================================

// GET ALL AVAILABILITY (supports ?facultyId=... & ?facultyEmail=... & ?facultyName=...)
router.get("/availability", async (req, res) => {
  try {
    const filter = {};
    const facId = (req.query.facultyId || "").trim();
    const facEmail = (req.query.facultyEmail || "").trim();
    const facName = (req.query.facultyName || "").trim();

    if (facId || facEmail || facName) {
      const orConditions = [];

      if (facId) {
        if (mongoose.Types.ObjectId.isValid(facId)) {
          const objId = new mongoose.Types.ObjectId(facId);
          orConditions.push({ facultyId: objId });
          orConditions.push({ facultyId: facId });

          const facUser = await User.findById(objId).lean();
          if (facUser) {
            if (facUser.email) orConditions.push({ facultyEmail: facUser.email });
            if (facUser.name) orConditions.push({ facultyName: { $regex: `^\\s*${escapeRegex(facUser.name.trim())}\\s*$`, $options: "i" } });
          }
        } else {
          orConditions.push({ facultyId: facId });
        }
      }

      if (facEmail) {
        orConditions.push({ facultyEmail: facEmail });
      }

      if (facName) {
        orConditions.push({ facultyName: { $regex: `^\\s*${escapeRegex(facName)}\\s*$`, $options: "i" } });
      }

      if (orConditions.length > 0) {
        filter.$or = orConditions;
      }
    }

    const availability = await Availability.find(filter).sort({ day: 1, startTime: 1 });
    res.status(200).json(availability);
  } catch (error) {
    console.error("Get Availability Error:", error);
    res.status(500).json({ message: "Failed to fetch availability", error: error.message });
  }
});

// Helper to resolve faculty details by ID or Name
const resolveFaculty = async (facultyId, facultyName) => {
  let facObjId = null;
  let resolvedFacName = (facultyName || "").trim();
  let resolvedFacEmail = "";

  if (facultyId && mongoose.Types.ObjectId.isValid(String(facultyId).trim())) {
    facObjId = new mongoose.Types.ObjectId(String(facultyId).trim());
    const fac = await User.findById(facObjId);
    if (fac) {
      return {
        facObjId: fac._id,
        resolvedFacName: fac.name,
        resolvedFacEmail: fac.email,
      };
    }
  }

  if (resolvedFacName) {
    const cleanName = escapeRegex(resolvedFacName);
    const fac = await User.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
      role: "faculty",
    });
    if (fac) {
      return {
        facObjId: fac._id,
        resolvedFacName: fac.name,
        resolvedFacEmail: fac.email,
      };
    }
  }

  return { facObjId, resolvedFacName, resolvedFacEmail };
};

// ADD / SAVE AVAILABILITY
router.post("/availability", async (req, res) => {
  try {
    // 1. If request body has multiple days array: { days: ["Monday", "Tuesday", ...], startTime, endTime, facultyId, facultyName }
    if (Array.isArray(req.body.days) && req.body.days.length > 0) {
      const { days, startTime, endTime, facultyId, facultyName } = req.body;
      if (!startTime || !endTime) {
        return res.status(400).json({ message: "Start time and end time are required" });
      }
      if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        return res.status(400).json({ message: "End time must be after start time" });
      }

      const { facObjId, resolvedFacName, resolvedFacEmail } = await resolveFaculty(facultyId, facultyName);

      const docsToInsert = days.map((d) => ({
        day: String(d).trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        facultyId: facObjId,
        facultyName: resolvedFacName,
        facultyEmail: resolvedFacEmail,
      }));

      const createdList = await Availability.insertMany(docsToInsert);
      return res.status(201).json({
        success: true,
        message: `${createdList.length} availability slots saved successfully`,
        availability: createdList,
      });
    }

    // 2. If request body is an array of availability objects: [ { day, startTime, endTime, ... }, ... ]
    if (Array.isArray(req.body) && req.body.length > 0) {
      const createdList = [];
      for (const item of req.body) {
        const { day, startTime, endTime, facultyId, facultyName } = item;
        if (day && startTime && endTime) {
          const { facObjId, resolvedFacName, resolvedFacEmail } = await resolveFaculty(facultyId, facultyName);
          createdList.push({
            day: String(day).trim(),
            startTime: String(startTime).trim(),
            endTime: String(endTime).trim(),
            facultyId: facObjId,
            facultyName: resolvedFacName,
            facultyEmail: resolvedFacEmail,
          });
        }
      }
      const inserted = await Availability.insertMany(createdList);
      return res.status(201).json({
        success: true,
        message: `${inserted.length} availability slots saved successfully`,
        availability: inserted,
      });
    }

    // 3. Default: Single day availability
    const { day, startTime, endTime, facultyId, facultyName } = req.body;

    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: "Day, start time, and end time are required" });
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const { facObjId, resolvedFacName, resolvedFacEmail } = await resolveFaculty(facultyId, facultyName);

    const newAvailability = new Availability({
      day: day.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      facultyId: facObjId,
      facultyName: resolvedFacName,
      facultyEmail: resolvedFacEmail,
    });

    await newAvailability.save();

    res.status(201).json({
      success: true,
      message: "Availability saved successfully",
      availability: newAvailability,
    });
  } catch (error) {
    console.error("Save Availability Error:", error);
    res.status(500).json({ message: "Failed to save availability", error: error.message });
  }
});

// DELETE AVAILABILITY
router.delete("/availability/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid availability ID" });
    }

    const deleted = await Availability.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Availability record not found" });
    }

    res.status(200).json({ success: true, message: "Availability slot deleted successfully" });
  } catch (error) {
    console.error("Delete Availability Error:", error);
    res.status(500).json({ message: "Failed to delete availability", error: error.message });
  }
});

// ======================================================
// 12. ADVANCED TIMETABLE GENERATION & CONSTRAINTS
// ======================================================

router.post("/generate-timetable", async (req, res) => {
  try {
    const { department, semester, className, academicYear } = req.body;

    const cleanDept = (department || "").trim();
    const cleanSem = String(semester || "").trim();
    const cleanClass = (className || "").trim();
    const cleanYear = (academicYear || "2025-2026").trim();

    // 1. Fetch Subjects matching criteria (or all active subjects if none specified)
    const subjectFilter = { status: "active" };
    if (cleanDept) {
      subjectFilter.department = { $regex: `^\\s*${escapeRegex(cleanDept)}\\s*$`, $options: "i" };
    }
    if (cleanSem) {
      subjectFilter.semester = { $regex: `^\\s*${escapeRegex(cleanSem)}\\s*$`, $options: "i" };
    }

    const subjects = await Subject.find(subjectFilter).lean();
    if (subjects.length === 0) {
      return res.status(400).json({
        message: cleanDept && cleanSem
          ? `No active subjects found for Department: "${cleanDept}", Semester: ${cleanSem}. Please add subjects first.`
          : "No active subjects available. Please add subjects first.",
      });
    }

    // 2. Fetch Time Slots
    const timeSlots = await TimeSlot.find({}).sort({ day: 1, startTime: 1 }).lean();
    if (timeSlots.length === 0) {
      return res.status(400).json({
        message: "No time slots configured. Please add time slots in Academic Management.",
      });
    }

    // 3. Fetch Rooms
    const rooms = await Room.find({ status: { $ne: "inactive" } }).sort({ roomNumber: 1 }).lean();
    if (rooms.length === 0) {
      return res.status(400).json({
        message: "No active rooms available. Please add rooms in Manage Rooms.",
      });
    }

    // 4. Fetch Faculty
    const allFaculty = await User.find({ role: "faculty", status: { $ne: "inactive" } }).lean();
    if (allFaculty.length === 0) {
      return res.status(400).json({
        message: "No active faculty found. Please add faculty members first.",
      });
    }

    // 5. Fetch All Faculty Availability
    const allAvailability = await Availability.find({}).lean();

    // 6. Fetch Existing Timetables from other classes to prevent simultaneous conflicts
    const existingTimetableFilter = {};
    if (cleanClass) {
      existingTimetableFilter.className = { $ne: cleanClass };
    } else if (cleanDept && cleanSem) {
      existingTimetableFilter.$or = [
        { department: { $ne: cleanDept } },
        { semester: { $ne: cleanSem } },
      ];
    }
    const otherTimetables = await Timetable.find(existingTimetableFilter).lean();

    // Set up Conflict Trackers using interval tracking:
    // a. Faculty booked intervals: { facultyId, facultyName, day, startMin, endMin }
    const facultyBookings = [];
    // b. Room booked intervals: { room, day, startMin, endMin }
    const roomBookings = [];

    // Register existing commitments from other classes
    otherTimetables.forEach((item) => {
      const itemStart = timeToMinutes(item.startTime);
      const itemEnd = timeToMinutes(item.endTime);
      if (item.facultyId || item.faculty) {
        facultyBookings.push({
          facultyId: item.facultyId ? String(item.facultyId) : null,
          facultyName: (item.faculty || "").trim().toLowerCase(),
          day: item.day,
          startMin: itemStart,
          endMin: itemEnd,
        });
      }
      if (item.room) {
        roomBookings.push({
          room: item.room,
          day: item.day,
          startMin: itemStart,
          endMin: itemEnd,
        });
      }
    });

    // Determine target classes to generate for
    let targetClasses = [];
    if (cleanClass) {
      targetClasses = [{ name: cleanClass, department: cleanDept, semester: cleanSem }];
    } else if (cleanDept && cleanSem) {
      const dbClasses = await Class.find({
        department: { $regex: `^\\s*${escapeRegex(cleanDept)}\\s*$`, $options: "i" },
        semester: { $regex: `^\\s*${escapeRegex(cleanSem)}\\s*$`, $options: "i" },
        status: "active",
      }).lean();

      if (dbClasses.length > 0) {
        targetClasses = dbClasses;
      } else {
        targetClasses = [{ name: "Section-A", department: cleanDept, semester: cleanSem }];
      }
    } else {
      const dbClasses = await Class.find({ status: "active" }).lean();
      if (dbClasses.length > 0) {
        targetClasses = dbClasses;
      } else {
        // Fallback to distinct dept/semesters from subjects
        const pairs = [];
        const seen = new Set();
        subjects.forEach((s) => {
          const key = `${s.department}_${s.semester}`;
          if (!seen.has(key)) {
            seen.add(key);
            pairs.push({ name: "Division-1", department: s.department, semester: s.semester });
          }
        });
        targetClasses = pairs;
      }
    }

    const newGeneratedRecords = [];

    // Unique days order
    const orderedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const availableDays = [...new Set(timeSlots.map((ts) => ts.day))].sort(
      (a, b) => orderedDays.indexOf(a) - orderedDays.indexOf(b)
    );

    // Generate for each target class
    for (const targetClass of targetClasses) {
      const clsName = targetClass.name;
      const clsDept = targetClass.department;
      const clsSem = targetClass.semester;

      // Filter subjects for this class's dept & semester
      const classSubjects = subjects.filter(
        (s) =>
          s.department.toLowerCase() === clsDept.toLowerCase() &&
          String(s.semester).toLowerCase() === String(clsSem).toLowerCase()
      );

      if (classSubjects.length === 0) continue;

      // Track class internal bookings for this class: array of { day, startMin, endMin }
      const thisClassBookings = [];
      // Track subject lectures scheduled: subjectCode -> count
      const subjectScheduledCount = {};

      // Prepare subject queue with weekly lecture requirements
      const lectureQueue = [];
      classSubjects.forEach((sub) => {
        const lecturesRequired = sub.weeklyLectures || sub.credits || 4;
        subjectScheduledCount[sub.code] = 0;
        for (let l = 0; l < lecturesRequired; l++) {
          lectureQueue.push(sub);
        }
      });

      // Distribute subjects: shuffle/interleave so lectures are spread across days
      // Helper to find assigned faculty for subject
      const getSubjectFaculty = (subject) => {
        if (subject.facultyId) {
          const fac = allFaculty.find((f) => String(f._id) === String(subject.facultyId));
          if (fac) return fac;
        }
        if (subject.facultyName) {
          const fac = allFaculty.find(
            (f) => f.name.toLowerCase() === subject.facultyName.toLowerCase()
          );
          if (fac) return fac;
        }
        // Match faculty by department & assigned subjects
        const matchingSubjectFac = allFaculty.find(
          (f) =>
            Array.isArray(f.assignedSubjects) &&
            (f.assignedSubjects.includes(subject.name) || f.assignedSubjects.includes(subject.code))
        );
        if (matchingSubjectFac) return matchingSubjectFac;

        // Match faculty by department
        const deptFac = allFaculty.find(
          (f) =>
            f.department &&
            f.department.toLowerCase() === (subject.department || "").toLowerCase()
        );
        if (deptFac) return deptFac;

        return allFaculty[0];
      };

      // Map subjects to their designated faculty
      const subjectFacultyMap = new Map();
      classSubjects.forEach((sub) => {
        subjectFacultyMap.set(sub.code, getSubjectFaculty(sub));
      });

      // Special handling for MCA Semester 3 Division A and Division B
      const isDivA = /div(ision)?[\s_-]*a/i.test(clsName);
      const isDivB = /div(ision)?[\s_-]*b/i.test(clsName);

      if (clsDept.toLowerCase() === "mca" && String(clsSem) === "3" && (isDivA || isDivB)) {
        const subSpring = classSubjects.find((s) => /spring/i.test(s.name)) || { name: "Spring boot", code: "MCA302" };
        const subUIUX = classSubjects.find((s) => /ui[/-]?ux/i.test(s.name)) || { name: "UI/UX", code: "MCA303" };
        const subAgile = classSubjects.find((s) => /agile/i.test(s.name)) || { name: "Agile", code: "MCA301" };
        const subFullStack = classSubjects.find((s) => /full[\s-]?stack/i.test(s.name)) || { name: "Full Stack", code: "MCA304" };

        const facSpring = getSubjectFaculty(subSpring);
        const facUIUX = getSubjectFaculty(subUIUX);
        const facAgile = getSubjectFaculty(subAgile);
        const facFullStack = getSubjectFaculty(subFullStack);

        const room101 = rooms.find((r) => /101/i.test(r.roomNumber)) || rooms[0];
        const room102 = rooms.find((r) => /102/i.test(r.roomNumber)) || rooms[0];
        const lab201 = rooms.find((r) => /201/i.test(r.roomNumber)) || rooms[1] || rooms[0];
        const lab202 = rooms.find((r) => /202/i.test(r.roomNumber)) || rooms[2] || rooms[0];

        // Sequence per user specifications (Both Div A & Div B have all 4 subjects):
        // Div A:
        // 1: Spring boot (Room 102)
        // 2: Spring boot (Room 102)
        // [Break 13:00 - 13:30]
        // 3: UI/UX (Lab 201)
        // 4: Agile (Lab 201)
        // 5: Full Stack (Lab 202)
        //
        // Div B:
        // 1: Full Stack (Lab 202)
        // 2: Full Stack (Lab 202)
        // [Break 13:00 - 13:30]
        // 3: Spring boot (Room 102)
        // 4: UI/UX (Room 101)
        // 5: Agile (Lab 201)

        // MWF (Monday, Wednesday, Friday) & TTS (Tuesday, Thursday, Saturday) schedules:
        // Guarantees:
        // - Spring boot: 9 lectures/week (Prof Asutosh Trivedi)
        // - Full Stack: 9 lectures/week (kunjan medam)
        // - Agile: 6 lectures/week (Dipti Bhatt)
        // - UI/UX: 6 lectures/week (Prof. Tinal Parikh)
        // Total = 30 lectures/week with SAME numbers in BOTH Division A and Division B!
        const planMWF = [
          { startTime: "11:00", endTime: "12:00", subject: subSpring, faculty: facSpring, room: room102 ? room102.roomNumber : "Room 102" },
          { startTime: "12:00", endTime: "13:00", subject: subSpring, faculty: facSpring, room: room102 ? room102.roomNumber : "Room 102" },
          { startTime: "13:30", endTime: "14:30", subject: subUIUX, faculty: facUIUX, room: lab201 ? lab201.roomNumber : "Lab 201" },
          { startTime: "14:30", endTime: "15:30", subject: subAgile, faculty: facAgile, room: lab201 ? lab201.roomNumber : "Lab 201" },
          { startTime: "15:30", endTime: "16:30", subject: subFullStack, faculty: facFullStack, room: lab202 ? lab202.roomNumber : "Lab 202" },
        ];

        const planTTS = [
          { startTime: "11:00", endTime: "12:00", subject: subFullStack, faculty: facFullStack, room: lab202 ? lab202.roomNumber : "Lab 202" },
          { startTime: "12:00", endTime: "13:00", subject: subFullStack, faculty: facFullStack, room: lab202 ? lab202.roomNumber : "Lab 202" },
          { startTime: "13:30", endTime: "14:30", subject: subSpring, faculty: facSpring, room: room102 ? room102.roomNumber : "Room 102" },
          { startTime: "14:30", endTime: "15:30", subject: subUIUX, faculty: facUIUX, room: room101 ? room101.roomNumber : "Room 101" },
          { startTime: "15:30", endTime: "16:30", subject: subAgile, faculty: facAgile, room: lab201 ? lab201.roomNumber : "Lab 201" },
        ];

        const mwfDays = ["Monday", "Wednesday", "Friday"];

        for (const day of availableDays) {
          const isMWF = mwfDays.includes(day);
          const dayPlan = isDivA
            ? (isMWF ? planMWF : planTTS)
            : (isMWF ? planTTS : planMWF);

          for (const item of dayPlan) {
            newGeneratedRecords.push({
              day,
              startTime: item.startTime,
              endTime: item.endTime,
              time: `${item.startTime} - ${item.endTime}`,
              subject: item.subject.name,
              subjectCode: item.subject.code || "",
              faculty: item.faculty ? item.faculty.name : "Faculty",
              facultyId: item.faculty ? item.faculty._id : null,
              facultyEmail: item.faculty ? item.faculty.email : "",
              room: item.room,
              department: clsDept,
              semester: clsSem,
              className: clsName,
              academicYear: cleanYear,
              createdAt: new Date(),
            });
          }
        }
        continue;
      }

      // Try to assign time slots for each lecture
      for (const sub of lectureQueue) {
        const fac = subjectFacultyMap.get(sub.code);
        const facIdStr = fac ? String(fac._id) : "";
        const facName = fac ? fac.name : "Faculty";
        const facEmail = fac ? fac.email : "";

        // Get availability windows for this faculty (if any exist)
        const facAvailList = allAvailability.filter(
          (a) =>
            (a.facultyId && String(a.facultyId) === facIdStr) ||
            (a.facultyName && a.facultyName.toLowerCase() === facName.toLowerCase())
        );

        // Filter valid candidate slots
        let assignedSlot = null;
        let assignedRoom = null;

        // Iterate through days, preferring days with fewer classes of this subject already scheduled
        for (const day of availableDays) {
          if (assignedSlot) break;

          const daySlots = timeSlots.filter((ts) => ts.day === day);

          for (const slot of daySlots) {
            const slotStartMin = timeToMinutes(slot.startTime);
            const slotEndMin = timeToMinutes(slot.endTime);

            // Check 1: Class conflict (Class already has a subject overlapping this slot)
            const classHasConflict = thisClassBookings.some(
              (b) => b.day === day && slotStartMin < b.endMin && slotEndMin > b.startMin
            );
            if (classHasConflict) continue;

            // Check 2: Faculty conflict (Faculty already teaching an overlapping slot)
            const facultyHasConflict = facultyBookings.some((b) => {
              if (b.day !== day) return false;
              const matchId = facIdStr && b.facultyId && b.facultyId === facIdStr;
              const matchName = facName && b.facultyName && b.facultyName === facName.trim().toLowerCase();
              if (matchId || matchName) {
                return slotStartMin < b.endMin && slotEndMin > b.startMin;
              }
              return false;
            });
            if (facultyHasConflict) continue;

            // Check 3: Faculty availability constraint (if availability defined)
            if (facAvailList.length > 0) {
              const isAvailable = facAvailList.some(
                (avail) =>
                  avail.day === day &&
                  timeToMinutes(avail.startTime) <= slotStartMin &&
                  timeToMinutes(avail.endTime) >= slotEndMin
              );
              if (!isAvailable) continue;
            }

            // Check 4: Find an unbooked Room for this slot (interval overlap check)
            const candidateRoom = rooms.find((r) => {
              const roomHasConflict = roomBookings.some(
                (b) => b.room === r.roomNumber && b.day === day && slotStartMin < b.endMin && slotEndMin > b.startMin
              );
              return !roomHasConflict;
            });
            if (!candidateRoom) continue;

            // Found valid slot & room!
            assignedSlot = slot;
            assignedRoom = candidateRoom;
            break;
          }
        }

        // If no slot satisfied availability, retry with general availability fallback
        if (!assignedSlot) {
          for (const day of availableDays) {
            if (assignedSlot) break;
            const daySlots = timeSlots.filter((ts) => ts.day === day);
            for (const slot of daySlots) {
              const slotStartMin = timeToMinutes(slot.startTime);
              const slotEndMin = timeToMinutes(slot.endTime);

              const classHasConflict = thisClassBookings.some(
                (b) => b.day === day && slotStartMin < b.endMin && slotEndMin > b.startMin
              );
              if (classHasConflict) continue;

              const facultyHasConflict = facultyBookings.some((b) => {
                if (b.day !== day) return false;
                const matchId = facIdStr && b.facultyId && b.facultyId === facIdStr;
                const matchName = facName && b.facultyName && b.facultyName === facName.trim().toLowerCase();
                if (matchId || matchName) {
                  return slotStartMin < b.endMin && slotEndMin > b.startMin;
                }
                return false;
              });
              if (facultyHasConflict) continue;

              const candidateRoom = rooms.find((r) => {
                const roomHasConflict = roomBookings.some(
                  (b) => b.room === r.roomNumber && b.day === day && slotStartMin < b.endMin && slotEndMin > b.startMin
                );
                return !roomHasConflict;
              });
              if (candidateRoom) {
                assignedSlot = slot;
                assignedRoom = candidateRoom;
                break;
              }
            }
          }
        }

        if (assignedSlot && assignedRoom) {
          const slotStartMin = timeToMinutes(assignedSlot.startTime);
          const slotEndMin = timeToMinutes(assignedSlot.endTime);

          // Mark booked intervals
          thisClassBookings.push({
            day: assignedSlot.day,
            startMin: slotStartMin,
            endMin: slotEndMin,
          });
          facultyBookings.push({
            facultyId: facIdStr || null,
            facultyName: facName.trim().toLowerCase(),
            day: assignedSlot.day,
            startMin: slotStartMin,
            endMin: slotEndMin,
          });
          roomBookings.push({
            room: assignedRoom.roomNumber,
            day: assignedSlot.day,
            startMin: slotStartMin,
            endMin: slotEndMin,
          });

          subjectScheduledCount[sub.code] = (subjectScheduledCount[sub.code] || 0) + 1;

          newGeneratedRecords.push({
            day: assignedSlot.day,
            startTime: assignedSlot.startTime,
            endTime: assignedSlot.endTime,
            time: `${assignedSlot.startTime} - ${assignedSlot.endTime}`,
            subject: sub.name,
            subjectCode: sub.code,
            faculty: facName,
            facultyId: fac ? fac._id : null,
            facultyEmail: facEmail,
            room: assignedRoom.roomNumber,
            department: clsDept,
            semester: clsSem,
            className: clsName,
            academicYear: cleanYear,
            createdAt: new Date(),
          });
        }
      }
    }

    if (newGeneratedRecords.length === 0) {
      return res.status(400).json({
        message: "Could not generate timetable slots with the given constraints. Please verify time slots and rooms.",
      });
    }

    // Clear old timetable for the generated classes or all if full generation
    if (cleanClass) {
      await Timetable.deleteMany({ className: cleanClass });
    } else if (cleanDept && cleanSem) {
      await Timetable.deleteMany({
        department: { $regex: `^\\s*${escapeRegex(cleanDept)}\\s*$`, $options: "i" },
        semester: { $regex: `^\\s*${escapeRegex(cleanSem)}\\s*$`, $options: "i" },
      });
    } else {
      await Timetable.deleteMany({});
    }

    // Insert newly generated timetable
    await Timetable.insertMany(newGeneratedRecords);

    res.status(201).json({
      success: true,
      message: cleanClass
        ? `Timetable generated successfully for ${cleanDept} - Semester ${cleanSem} - ${cleanClass}. (${newGeneratedRecords.length} lectures scheduled)`
        : `Timetable generated successfully (${newGeneratedRecords.length} lectures scheduled across ${targetClasses.length} classes).`,
      count: newGeneratedRecords.length,
      timetable: newGeneratedRecords,
    });
  } catch (error) {
    console.error("Generate Timetable Error:", error);
    res.status(500).json({
      message: "Failed to generate timetable",
      error: error.message,
    });
  }
});

// ======================================================
// 13. GET & QUERY TIMETABLES
// ======================================================

router.get("/timetable", async (req, res) => {
  try {
    const department = String(req.query.department || "").trim();
    const semester = String(req.query.semester || "").trim();
    const className = String(req.query.className || req.query.class || "").trim();
    const facultyId = String(req.query.facultyId || "").trim();
    const studentId = String(req.query.studentId || "").trim();

    const filter = {};

    // 1. Resolve Student ID if provided
    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      const student = await User.findOne({ _id: studentId, role: "student" }).lean();
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (student.department) {
        filter.department = {
          $regex: `^\\s*${escapeRegex(student.department.trim())}\\s*$`,
          $options: "i",
        };
      }
      if (student.semester) {
        filter.semester = {
          $regex: `^\\s*${escapeRegex(student.semester.trim())}\\s*$`,
          $options: "i",
        };
      }
      if (student.className) {
        filter.className = {
          $regex: `^\\s*${escapeRegex(student.className.trim())}\\s*$`,
          $options: "i",
        };
      }
    } else {
      if (department) {
        filter.department = {
          $regex: `^\\s*${escapeRegex(department)}\\s*$`,
          $options: "i",
        };
      }
      if (semester) {
        filter.semester = {
          $regex: `^\\s*${escapeRegex(semester)}\\s*$`,
          $options: "i",
        };
      }
      if (className) {
        filter.className = {
          $regex: `^\\s*${escapeRegex(className)}\\s*$`,
          $options: "i",
        };
      }
    }

    // 2. Faculty filter (handles ObjectId, email, and name)
    if (facultyId) {
      if (mongoose.Types.ObjectId.isValid(facultyId)) {
        const objId = new mongoose.Types.ObjectId(facultyId);
        const facUser = await User.findById(objId).lean();
        const orConditions = [{ facultyId: objId }, { facultyId: facultyId }];
        if (facUser) {
          if (facUser.email) orConditions.push({ facultyEmail: facUser.email });
          if (facUser.name) orConditions.push({ faculty: { $regex: `^\\s*${escapeRegex(facUser.name.trim())}\\s*$`, $options: "i" } });
        }
        filter.$or = orConditions;
      } else {
        filter.$or = [
          { facultyId: facultyId },
          { facultyEmail: facultyId },
          { faculty: { $regex: `^\\s*${escapeRegex(facultyId.trim())}\\s*$`, $options: "i" } },
        ];
      }
    }

    const timetable = await Timetable.find(filter).sort({ day: 1, startTime: 1 }).lean();

    res.status(200).json(timetable);
  } catch (error) {
    console.error("Get Timetable Error:", error);
    res.status(500).json({ message: "Failed to fetch timetable", error: error.message });
  }
});

// DELETE / CLEAR TIMETABLE
router.delete("/timetable", async (req, res) => {
  try {
    const { department, semester, className } = req.query;
    const filter = {};
    if (department) filter.department = department.trim();
    if (semester) filter.semester = String(semester).trim();
    if (className) filter.className = className.trim();

    await Timetable.deleteMany(filter);
    res.status(200).json({ success: true, message: "Timetable records cleared successfully" });
  } catch (error) {
    console.error("Clear Timetable Error:", error);
    res.status(500).json({ message: "Failed to clear timetable", error: error.message });
  }
});

module.exports = router;