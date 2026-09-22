const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_timetable";

async function run() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const Subject = mongoose.model('Subject', new mongoose.Schema({}, { strict: false }), 'subjects');
  const Room = mongoose.model('Room', new mongoose.Schema({}, { strict: false }), 'rooms');
  const TimeSlot = mongoose.model('TimeSlot', new mongoose.Schema({}, { strict: false }), 'timeslots');
  const Class = mongoose.model('Class', new mongoose.Schema({}, { strict: false }), 'classes');
  const Timetable = mongoose.model('Timetable', new mongoose.Schema({}, { strict: false }), 'timetables');
  const Availability = mongoose.model('Availability', new mongoose.Schema({}, { strict: false }), 'availabilities');

  // 1. Ensure Faculty Records
  let asutosh = await User.findOne({ email: "asutosh@gmail.com" });
  if (!asutosh) {
    asutosh = await User.findOne({ name: { $regex: "Asutosh", $options: "i" } });
  }
  if (asutosh) {
    asutosh.name = "Prof Asutosh Trivedi";
    asutosh.department = "MCA";
    asutosh.assignedSubjects = ["Spring boot"];
    await asutosh.save();
    console.log("Updated Asutosh:", asutosh._id, asutosh.name);
  }

  let kunjan = await User.findOne({ email: "kunjan@gmail.com" });
  if (!kunjan) {
    kunjan = await User.findOne({ name: { $regex: "kunjan", $options: "i" } });
  }
  if (kunjan) {
    kunjan.name = "kunjan medam";
    kunjan.department = "MCA";
    kunjan.assignedSubjects = ["Full Stack"];
    await kunjan.save();
    console.log("Updated Kunjan:", kunjan._id, kunjan.name);
  }

  let tinal = await User.findOne({ email: "tinalparikh@gmail.com" });
  if (!tinal) {
    tinal = await User.findOne({ name: { $regex: "Tinal", $options: "i" } });
  }
  if (tinal) {
    tinal.name = "Prof. Tinal Parikh";
    tinal.department = "MCA";
    tinal.assignedSubjects = ["UI/UX"];
    await tinal.save();
    console.log("Updated Tinal:", tinal._id, tinal.name);
  }

  let dipti = await User.findOne({ email: "dbhatt@gmail.com" });
  if (!dipti) {
    dipti = await User.findOne({ name: { $regex: "Dipti", $options: "i" } });
  }
  if (dipti) {
    dipti.name = "Dipti Bhatt";
    dipti.department = "MCA";
    dipti.assignedSubjects = ["Agile"];
    await dipti.save();
    console.log("Updated Dipti:", dipti._id, dipti.name);
  }

  // 2. Ensure Subjects
  const subjectConfigs = [
    {
      name: "Spring boot",
      code: "MCA302",
      department: "MCA",
      semester: "3",
      credits: 4,
      weeklyLectures: 4,
      facultyId: asutosh ? asutosh._id : null,
      facultyName: asutosh ? asutosh.name : "Prof Asutosh Trivedi",
      status: "active"
    },
    {
      name: "Full Stack",
      code: "MCA304",
      department: "MCA",
      semester: "3",
      credits: 4,
      weeklyLectures: 4,
      facultyId: kunjan ? kunjan._id : null,
      facultyName: kunjan ? kunjan.name : "kunjan medam",
      status: "active"
    },
    {
      name: "UI/UX",
      code: "MCA303",
      department: "MCA",
      semester: "3",
      credits: 4,
      weeklyLectures: 4,
      facultyId: tinal ? tinal._id : null,
      facultyName: tinal ? tinal.name : "Prof. Tinal Parikh",
      status: "active"
    },
    {
      name: "Agile",
      code: "MCA301",
      department: "MCA",
      semester: "3",
      credits: 4,
      weeklyLectures: 4,
      facultyId: dipti ? dipti._id : null,
      facultyName: dipti ? dipti.name : "Dipti Bhatt",
      status: "active"
    }
  ];

  for (const sc of subjectConfigs) {
    const existing = await Subject.findOne({
      department: "MCA",
      semester: "3",
      name: { $regex: `^${sc.name}$`, $options: "i" }
    });
    if (existing) {
      existing.facultyId = sc.facultyId;
      existing.facultyName = sc.facultyName;
      existing.status = "active";
      await existing.save();
      console.log(`Updated subject: ${sc.name}`);
    } else {
      await Subject.create(sc);
      console.log(`Created subject: ${sc.name}`);
    }
  }

  // 3. Ensure Rooms
  const roomList = [
    { roomNumber: "Room 101", capacity: 60, type: "classroom", status: "active" },
    { roomNumber: "Room 102", capacity: 60, type: "classroom", status: "active" },
    { roomNumber: "Lab 201", capacity: 40, type: "lab", status: "active" },
    { roomNumber: "Lab 202", capacity: 40, type: "lab", status: "active" },
  ];
  for (const r of roomList) {
    const ex = await Room.findOne({ roomNumber: r.roomNumber });
    if (!ex) {
      await Room.create(r);
      console.log(`Created room: ${r.roomNumber}`);
    }
  }

  // 4. Standardize TimeSlots (Mon-Sat, 5 slots each)
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const slotTimes = [
    { startTime: "11:00", endTime: "12:00" },
    { startTime: "12:00", endTime: "13:00" },
    { startTime: "13:30", endTime: "14:30" },
    { startTime: "14:30", endTime: "15:30" },
    { startTime: "15:30", endTime: "16:30" },
  ];

  // Remove existing Monday buggy slots and ensure all days have these 5 slots
  await TimeSlot.deleteMany({});
  const newSlots = [];
  for (const day of days) {
    for (const st of slotTimes) {
      newSlots.push({
        day,
        startTime: st.startTime,
        endTime: st.endTime,
        isBreak: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  await TimeSlot.insertMany(newSlots);
  console.log(`Inserted ${newSlots.length} standardized time slots across Mon-Sat.`);

  // 5. Ensure Faculty Availability for all 4 faculty (Mon-Sat, 11:00-16:30)
  await Availability.deleteMany({});
  const availRecords = [];
  const activeFaculties = [asutosh, kunjan, tinal, dipti].filter(Boolean);
  for (const fac of activeFaculties) {
    for (const day of days) {
      availRecords.push({
        facultyId: fac._id,
        facultyName: fac.name,
        facultyEmail: fac.email,
        day,
        startTime: "11:00",
        endTime: "16:30",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  await Availability.insertMany(availRecords);
  console.log(`Inserted ${availRecords.length} faculty availability records.`);

  // 6. Ensure Classes exist
  const classesToEnsure = [
    { name: "Division A", department: "MCA", semester: "3", status: "active" },
    { name: "Division B", department: "MCA", semester: "3", status: "active" }
  ];
  for (const c of classesToEnsure) {
    const ex = await Class.findOne({ name: c.name, department: c.department, semester: c.semester });
    if (!ex) {
      await Class.create(c);
      console.log(`Created class: ${c.name}`);
    }
  }

  // 7. Update Student Classes
  await User.updateMany(
    { role: "student", className: { $in: ["MCA lab 1 Div A", "Division A"] } },
    { $set: { className: "Division A", department: "MCA", semester: "3" } }
  );
  await User.updateMany(
    { role: "student", className: { $in: ["MCA lab 2 / Div b", "Division B"] } },
    { $set: { className: "Division B", department: "MCA", semester: "3" } }
  );
  console.log("Updated student class names to Division A and Division B.");

  // 8. GENERATE THE EXACT REQUESTED TIMETABLE FOR DIVISION A & DIVISION B
  // Div A:
  // - Slot 1 (11:00-12:00): Spring boot (Prof Asutosh Trivedi, Room 102)
  // - Slot 2 (12:00-13:00): Spring boot (Prof Asutosh Trivedi, Room 102)
  // - [Break 13:00-13:30]
  // - Slot 3 (13:30-14:30): UI/UX (Prof. Tinal Parikh, Lab 201)
  // - Slot 4 (14:30-15:30): Agile (Dipti Bhatt, Lab 201)
  // - Slot 5 (15:30-16:30): Full Stack (kunjan medam, Lab 202)
  //
  // Div B:
  // - Slot 1 (11:00-12:00): Full Stack (kunjan medam, Lab 202)
  // - Slot 2 (12:00-13:00): Full Stack (kunjan medam, Lab 202)
  // - [Break 13:00-13:30]
  // - Slot 3 (13:30-14:30): Spring boot (Prof Asutosh Trivedi, Room 102)
  // - Slot 4 (14:30-15:30): Spring boot (Prof Asutosh Trivedi, Room 102)
  // - Slot 5 (15:30-16:30): UI/UX (Prof. Tinal Parikh, Lab 201)

  await Timetable.deleteMany({
    department: "MCA",
    semester: "3",
    className: { $in: ["Division A", "Division B", "MCA lab 1 Div A", "MCA lab 2 / Div b"] }
  });

  const timetableRecords = [];

  for (const day of days) {
    // Division A
    timetableRecords.push({
      day,
      startTime: "11:00",
      endTime: "12:00",
      time: "11:00 - 12:00",
      subject: "Spring boot",
      subjectCode: "MCA302",
      faculty: asutosh ? asutosh.name : "Prof Asutosh Trivedi",
      facultyId: asutosh ? asutosh._id : null,
      facultyEmail: asutosh ? asutosh.email : "asutosh@gmail.com",
      room: "Room 102",
      department: "MCA",
      semester: "3",
      className: "Division A",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });

    timetableRecords.push({
      day,
      startTime: "12:00",
      endTime: "13:00",
      time: "12:00 - 13:00",
      subject: "Spring boot",
      subjectCode: "MCA302",
      faculty: asutosh ? asutosh.name : "Prof Asutosh Trivedi",
      facultyId: asutosh ? asutosh._id : null,
      facultyEmail: asutosh ? asutosh.email : "asutosh@gmail.com",
      room: "Room 102",
      department: "MCA",
      semester: "3",
      className: "Division A",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });

    timetableRecords.push({
      day,
      startTime: "13:30",
      endTime: "14:30",
      time: "13:30 - 14:30",
      subject: "UI/UX",
      subjectCode: "MCA303",
      faculty: tinal ? tinal.name : "Prof. Tinal Parikh",
      facultyId: tinal ? tinal._id : null,
      facultyEmail: tinal ? tinal.email : "tinalparikh@gmail.com",
      room: "Lab 201",
      department: "MCA",
      semester: "3",
      className: "Division A",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });

    timetableRecords.push({
      day,
      startTime: "14:30",
      endTime: "15:30",
      time: "14:30 - 15:30",
      subject: "Agile",
      subjectCode: "MCA301",
      faculty: dipti ? dipti.name : "Dipti Bhatt",
      facultyId: dipti ? dipti._id : null,
      facultyEmail: dipti ? dipti.email : "dbhatt@gmail.com",
      room: "Lab 201",
      department: "MCA",
      semester: "3",
      className: "Division A",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });

    timetableRecords.push({
      day,
      startTime: "15:30",
      endTime: "16:30",
      time: "15:30 - 16:30",
      subject: "Full Stack",
      subjectCode: "MCA304",
      faculty: kunjan ? kunjan.name : "kunjan medam",
      facultyId: kunjan ? kunjan._id : null,
      facultyEmail: kunjan ? kunjan.email : "kunjan@gmail.com",
      room: "Lab 202",
      department: "MCA",
      semester: "3",
      className: "Division A",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });

    // Division B
    timetableRecords.push({
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

    timetableRecords.push({
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

    timetableRecords.push({
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

    timetableRecords.push({
      day,
      startTime: "14:30",
      endTime: "15:30",
      time: "14:30 - 15:30",
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

    timetableRecords.push({
      day,
      startTime: "15:30",
      endTime: "16:30",
      time: "15:30 - 16:30",
      subject: "UI/UX",
      subjectCode: "MCA303",
      faculty: tinal ? tinal.name : "Prof. Tinal Parikh",
      facultyId: tinal ? tinal._id : null,
      facultyEmail: tinal ? tinal.email : "tinalparikh@gmail.com",
      room: "Lab 201",
      department: "MCA",
      semester: "3",
      className: "Division B",
      academicYear: "2025-2026",
      createdAt: new Date(),
    });
  }

  await Timetable.insertMany(timetableRecords);
  console.log(`Inserted ${timetableRecords.length} conflict-free timetable entries (30 for Div A, 30 for Div B).`);

  console.log("Setup completed successfully!");
  process.exit(0);
}

run().catch(err => {
  console.error("Setup error:", err);
  process.exit(1);
});
