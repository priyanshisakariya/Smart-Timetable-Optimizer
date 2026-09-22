async function runTest() {
  console.log("=== 1. TEST ADD STUDENT WITHOUT PASSWORD (DEFAULT) ===");
  const testStudent1 = {
    name: "Test Student Default",
    email: `testdefault_${Date.now()}@example.com`,
    enrollmentNo: `ENR_${Date.now()}`,
    department: "MCA",
    semester: "3",
    className: "Division A",
    mobileNo: "9876543210"
  };

  const addRes1 = await fetch("http://localhost:5000/api/auth/add-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testStudent1)
  });
  const addData1 = await addRes1.json();
  console.log("Add default student response:", addData1.message, addData1.loginCredentials);

  // Now login with default password
  console.log("--> Testing login with student123...");
  const loginRes1 = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testStudent1.email,
      password: "student123"
    })
  });
  const loginData1 = await loginRes1.json();
  console.log("Login with student123 success?", loginData1.success, "User role:", loginData1.user?.role);

  console.log("\n=== 2. TEST ADD STUDENT WITH CUSTOM PASSWORD ===");
  const testStudent2 = {
    name: "Test Student Custom",
    email: `testcustom_${Date.now()}@example.com`,
    enrollmentNo: `ENR_CUST_${Date.now()}`,
    department: "MCA",
    semester: "3",
    className: "Division B",
    mobileNo: "9876543211",
    password: "mySecretPassword123"
  };

  const addRes2 = await fetch("http://localhost:5000/api/auth/add-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testStudent2)
  });
  const addData2 = await addRes2.json();
  console.log("Add custom student response:", addData2.message, addData2.loginCredentials);

  // Now login with custom password
  console.log("--> Testing login with mySecretPassword123...");
  const loginRes2 = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testStudent2.email,
      password: "mySecretPassword123"
    })
  });
  const loginData2 = await loginRes2.json();
  console.log("Login with mySecretPassword123 success?", loginData2.success, "User role:", loginData2.user?.role);

  // Clean up test students
  const mongoose = require('mongoose');
  await mongoose.connect("mongodb://127.0.0.1:27017/smart_timetable");
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  await User.deleteMany({ email: { $in: [testStudent1.email, testStudent2.email] } });
  console.log("\nCleaned up test students from DB.");
  process.exit(0);
}

runTest().catch(console.error);
