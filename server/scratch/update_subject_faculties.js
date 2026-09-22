const mongoose = require('mongoose');

async function update() {
  await mongoose.connect('mongodb://127.0.0.1:27017/smart_timetable');
  const Subject = mongoose.model('Subject', new mongoose.Schema({}, { strict: false }), 'subjects');

  await Subject.updateOne(
    { _id: new mongoose.Types.ObjectId('6ab28b5354f827d0f6d21b60') },
    { $set: { facultyId: new mongoose.Types.ObjectId('6ab28af354f827d0f6d21b5f'), facultyName: 'Dipti Bhatt', weeklyLectures: 12 } }
  );

  await Subject.updateOne(
    { _id: new mongoose.Types.ObjectId('6ab28b5f54f827d0f6d21b61') },
    { $set: { facultyId: new mongoose.Types.ObjectId('6ab28da754f827d0f6d21b71'), facultyName: 'Prof Asutosh Trivedi', weeklyLectures: 18 } }
  );

  await Subject.updateOne(
    { _id: new mongoose.Types.ObjectId('6ab28b6854f827d0f6d21b62') },
    { $set: { facultyId: new mongoose.Types.ObjectId('6ab28a9e54f827d0f6d21b5e'), facultyName: 'Prof. Tinal Parikh', weeklyLectures: 12 } }
  );

  await Subject.updateOne(
    { _id: new mongoose.Types.ObjectId('6ab28d2554f827d0f6d21b70') },
    { $set: { facultyId: new mongoose.Types.ObjectId('6ab28cae54f827d0f6d21b6f'), facultyName: 'kunjan medam', weeklyLectures: 18 } }
  );

  console.log('Updated subjects successfully!');
  const subs = await Subject.find({ department: 'MCA' });
  subs.forEach(s => console.log('✓', s.name, '| facId:', String(s.facultyId), '| facName:', s.facultyName, '| weekly:', s.weeklyLectures));
  process.exit(0);
}

update().catch(console.error);
