const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_timetable";

async function run() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const Subject = mongoose.model('Subject', new mongoose.Schema({}, { strict: false }), 'subjects');
  const Timetable = mongoose.model('Timetable', new mongoose.Schema({}, { strict: false }), 'timetables');

  // 1. Update weeklyLectures in subjects: 9, 9, 6, 6
  await Subject.updateOne({ name: { $regex: "^Spring", $options: "i" } }, { $set: { weeklyLectures: 9 } });
  await Subject.updateOne({ name: { $regex: "^Full", $options: "i" } }, { $set: { weeklyLectures: 9 } });
  await Subject.updateOne({ name: { $regex: "^Agile", $options: "i" } }, { $set: { weeklyLectures: 6 } });
  await Subject.updateOne({ name: { $regex: "^UI", $options: "i" } }, { $set: { weeklyLectures: 6 } });
  console.log("✓ Updated weeklyLectures on Subjects: Spring boot: 9, Full Stack: 9, Agile: 6, UI/UX: 6");

  // 2. Fetch Faculty
  const asutosh = await User.findOne({ name: { $regex: "Asutosh", $options: "i" } });
  const kunjan = await User.findOne({ name: { $regex: "kunjan", $options: "i" } });
  const tinal = await User.findOne({ name: { $regex: "Tinal", $options: "i" } });
  const dipti = await User.findOne({ name: { $regex: "Dipti", $options: "i" } });

  // 3. Clear old timetables for Division A and Division B
  await Timetable.deleteMany({ className: { $in: ["Division A", "Division B"] } });

  const planMWF = [
    { startTime: "11:00", endTime: "12:00", subject: "Spring boot", code: "MCA302", faculty: asutosh.name, facultyId: asutosh._id, facultyEmail: asutosh.email, room: "Room 102" },
    { startTime: "12:00", endTime: "13:00", subject: "Spring boot", code: "MCA302", faculty: asutosh.name, facultyId: asutosh._id, facultyEmail: asutosh.email, room: "Room 102" },
    { startTime: "13:30", endTime: "14:30", subject: "UI/UX", code: "MCA303", faculty: tinal.name, facultyId: tinal._id, facultyEmail: tinal.email, room: "Lab 201" },
    { startTime: "14:30", endTime: "15:30", subject: "Agile", code: "MCA301", faculty: dipti.name, facultyId: dipti._id, facultyEmail: dipti.email, room: "Lab 201" },
    { startTime: "15:30", endTime: "16:30", subject: "Full Stack", code: "MCA304", faculty: kunjan.name, facultyId: kunjan._id, facultyEmail: kunjan.email, room: "Lab 202" },
  ];

  const planTTS = [
    { startTime: "11:00", endTime: "12:00", subject: "Full Stack", code: "MCA304", faculty: kunjan.name, facultyId: kunjan._id, facultyEmail: kunjan.email, room: "Lab 202" },
    { startTime: "12:00", endTime: "13:00", subject: "Full Stack", code: "MCA304", faculty: kunjan.name, facultyId: kunjan._id, facultyEmail: kunjan.email, room: "Lab 202" },
    { startTime: "13:30", endTime: "14:30", subject: "Spring boot", code: "MCA302", faculty: asutosh.name, facultyId: asutosh._id, facultyEmail: asutosh.email, room: "Room 102" },
    { startTime: "14:30", endTime: "15:30", subject: "UI/UX", code: "MCA303", faculty: tinal.name, facultyId: tinal._id, facultyEmail: tinal.email, room: "Room 101" },
    { startTime: "15:30", endTime: "16:30", subject: "Agile", code: "MCA301", faculty: dipti.name, facultyId: dipti._id, facultyEmail: dipti.email, room: "Lab 201" },
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mwf = ["Monday", "Wednesday", "Friday"];
  const allRecords = [];

  for (const day of days) {
    const isMWF = mwf.includes(day);

    // Div A: planMWF on MWF, planTTS on TTS
    const divAPlan = isMWF ? planMWF : planTTS;
    for (const item of divAPlan) {
      allRecords.push({
        day,
        startTime: item.startTime,
        endTime: item.endTime,
        time: `${item.startTime} - ${item.endTime}`,
        subject: item.subject,
        subjectCode: item.code,
        faculty: item.faculty,
        facultyId: item.facultyId,
        facultyEmail: item.facultyEmail,
        room: item.room,
        department: "MCA",
        semester: "3",
        className: "Division A",
        academicYear: "2025-2026",
        createdAt: new Date(),
      });
    }

    // Div B: planTTS on MWF, planMWF on TTS
    const divBPlan = isMWF ? planTTS : planMWF;
    for (const item of divBPlan) {
      allRecords.push({
        day,
        startTime: item.startTime,
        endTime: item.endTime,
        time: `${item.startTime} - ${item.endTime}`,
        subject: item.subject,
        subjectCode: item.code,
        faculty: item.faculty,
        facultyId: item.facultyId,
        facultyEmail: item.facultyEmail,
        room: item.room,
        department: "MCA",
        semester: "3",
        className: "Division B",
        academicYear: "2025-2026",
        createdAt: new Date(),
      });
    }
  }

  await Timetable.insertMany(allRecords);
  console.log(`✓ Inserted ${allRecords.length} timetable records total (30 for Div A, 30 for Div B).`);

  // Count verify
  const divADocs = await Timetable.find({ className: "Division A" });
  const divBDocs = await Timetable.find({ className: "Division B" });

  const countBySub = (docs) => {
    const counts = {};
    docs.forEach(d => { counts[d.subject] = (counts[d.subject] || 0) + 1; });
    return counts;
  };

  console.log("\n=== DIVISION A WEEKLY LECTURE COUNTS ===");
  console.log(countBySub(divADocs));

  console.log("\n=== DIVISION B WEEKLY LECTURE COUNTS ===");
  console.log(countBySub(divBDocs));

  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
