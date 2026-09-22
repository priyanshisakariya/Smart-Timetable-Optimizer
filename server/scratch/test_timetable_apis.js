async function test() {
  console.log("=== 1. TEST GET TIMETABLE FOR DIVISION A ===");
  const resDivA = await fetch("http://localhost:5000/api/auth/timetable?department=MCA&semester=3&className=Division%20A");
  const dataDivA = await resDivA.json();
  console.log("Division A record count:", dataDivA.length);
  const mondayDivA = dataDivA.filter(d => d.day === "Monday");
  console.log("Monday Div A Schedule:");
  mondayDivA.forEach(m => console.log(`  ${m.time} | ${m.subject} | ${m.faculty} | ${m.room}`));

  console.log("\n=== 2. TEST GET TIMETABLE FOR DIVISION B ===");
  const resDivB = await fetch("http://localhost:5000/api/auth/timetable?department=MCA&semester=3&className=Division%20B");
  const dataDivB = await resDivB.json();
  console.log("Division B record count:", dataDivB.length);
  const mondayDivB = dataDivB.filter(d => d.day === "Monday");
  console.log("Monday Div B Schedule:");
  mondayDivB.forEach(m => console.log(`  ${m.time} | ${m.subject} | ${m.faculty} | ${m.room}`));

  console.log("\n=== 3. TEST GENERATE TIMETABLE ENDPOINT (MCA SEM 3) ===");
  const genRes = await fetch("http://localhost:5000/api/auth/generate-timetable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      department: "MCA",
      semester: "3",
      className: "Division A",
      academicYear: "2025-2026"
    })
  });
  const genData = await genRes.json();
  console.log("Generate API response message:", genData.message);
  console.log("Generated records count:", genData.count || genData.timetable?.length);

  console.log("\n=== 4. TEST STUDENT TIMETABLE (Priya Patel, Div A) ===");
  const studRes = await fetch("http://localhost:5000/api/auth/students");
  const studData = await studRes.json();
  const priya = (studData.students || studData).find(s => s.email === "priya.mca@university.edu" || s.name === "Priya Patel");
  if (priya) {
    const pRes = await fetch(`http://localhost:5000/api/auth/timetable?studentId=${priya._id}`);
    const pData = await pRes.json();
    console.log(`Priya (${priya.className}) timetable entries:`, pData.length);
  }

  console.log("\n=== 5. TEST FACULTY TIMETABLE (Asutosh Sir) ===");
  const facRes = await fetch("http://localhost:5000/api/auth/faculty");
  const facData = await facRes.json();
  const asutosh = (facData.faculty || facData).find(f => /asutosh/i.test(f.name));
  if (asutosh) {
    const aRes = await fetch(`http://localhost:5000/api/auth/timetable?facultyId=${asutosh._id}`);
    const aData = await aRes.json();
    console.log(`Prof Asutosh Trivedi timetable entries:`, aData.length);
  }
}

test().catch(console.error);
