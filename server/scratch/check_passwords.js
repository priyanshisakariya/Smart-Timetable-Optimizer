const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/smart_timetable');
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  
  const emails = ['aman.mca@university.edu', 'priya.mca@university.edu', 'd@gmail.com', 'diya@gmail.com'];
  const students = await User.find({ email: { $in: emails } });

  for (const s of students) {
    console.log(`\nName: ${s.name} | Email: ${s.email}`);
    console.log(`Role: ${s.role} | Class: ${s.className}`);
    console.log(`Password Hash exists: ${Boolean(s.password)}`);
    if (s.password) {
      const isStudent123 = await bcrypt.compare('student123', s.password);
      const is123456 = await bcrypt.compare('123456', s.password);
      console.log(`  Matches 'student123': ${isStudent123}`);
      console.log(`  Matches '123456': ${is123456}`);
    }
  }
  process.exit(0);
}

check().catch(console.error);
