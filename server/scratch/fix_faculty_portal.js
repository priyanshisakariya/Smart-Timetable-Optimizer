const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_timetable";

async function run() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const Subject = mongoose.model('Subject', new mongoose.Schema({}, { strict: false }), 'subjects');
  const Availability = mongoose.model('Availability', new mongoose.Schema({}, { strict: false }), 'availability');

  // 1. Fetch & Update Faculty in Users
  const asutosh = await User.findOne({ email: "asutosh@gmail.com" });
  if (asutosh) {
    asutosh.name = "Prof Asutosh Trivedi";
    asutosh.assignedSubjects = ["Spring boot"];
    await asutosh.save();
    console.log("✓ Asutosh user updated:", asutosh._id, asutosh.name);
  }

  const kunjan = await User.findOne({ email: "kunjan@gmail.com" });
  if (kunjan) {
    kunjan.name = "kunjan medam";
    kunjan.assignedSubjects = ["Full Stack"];
    await kunjan.save();
    console.log("✓ Kunjan user updated:", kunjan._id, kunjan.name);
  }

  const tinal = await User.findOne({ email: "tinalparikh@gmail.com" });
  if (tinal) {
    tinal.name = "Prof. Tinal Parikh";
    tinal.assignedSubjects = ["UI/UX"];
    await tinal.save();
    console.log("✓ Tinal user updated:", tinal._id, tinal.name);
  }

  const dipti = await User.findOne({ email: "dbhatt@gmail.com" });
  if (dipti) {
    dipti.name = "Dipti Bhatt";
    dipti.assignedSubjects = ["Agile"];
    await dipti.save();
    console.log("✓ Dipti user updated:", dipti._id, dipti.name);
  }

  // 2. Link facultyId and accurate weeklyLectures on Subjects
  const subjectUpdates = [
    { name: "Spring boot", fac: asutosh, weekly: 18 },
    { name: "Full Stack", fac: kunjan, weekly: 18 },
    { name: "UI/UX", fac: tinal, weekly: 12 },
    { name: "Agile", fac: dipti, weekly: 12 },
  ];

  for (const su of subjectUpdates) {
    if (!su.fac) continue;
    const sub = await Subject.findOne({ name: { $regex: `^${su.name}$`, $options: "i" } });
    if (sub) {
      sub.facultyId = su.fac._id;
      sub.facultyName = su.fac.name;
      sub.weeklyLectures = su.weekly;
      await sub.save();
      console.log(`✓ Subject ${su.name} linked to ${su.fac.name} (ID: ${su.fac._id}) | Weekly: ${su.weekly}`);
    }
  }

  // 3. Drop duplicate collection 'availabilities' if exists
  try {
    await mongoose.connection.db.dropCollection('availabilities');
    console.log("✓ Dropped duplicate collection 'availabilities'");
  } catch (e) {
    // collection might not exist
  }

  // 4. Clean & Populate 'availability' collection
  await Availability.deleteMany({});

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const activeFacultyList = [asutosh, kunjan, tinal, dipti].filter(Boolean);
  const newAvailDocs = [];

  for (const fac of activeFacultyList) {
    for (const day of days) {
      newAvailDocs.push({
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

  await Availability.insertMany(newAvailDocs);
  console.log(`✓ Inserted ${newAvailDocs.length} clean availability records into 'availability' collection.`);

  console.log("\nAll database fixes completed!");
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
