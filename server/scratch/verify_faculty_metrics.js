async function test() {
  const facs = [
    { name: 'Prof Asutosh Trivedi', id: '6ab28da754f827d0f6d21b71', email: 'asutosh@gmail.com' },
    { name: 'kunjan medam', id: '6ab28cae54f827d0f6d21b6f', email: 'kunjan@gmail.com' },
    { name: 'Prof. Tinal Parikh', id: '6ab28a9e54f827d0f6d21b5e', email: 'tinalparikh@gmail.com' },
    { name: 'Dipti Bhatt', id: '6ab28af354f827d0f6d21b5f', email: 'dbhatt@gmail.com' }
  ];

  for (const f of facs) {
    console.log('\n=============================================');
    console.log('FACULTY:', f.name, '(' + f.email + ')');
    
    // 1. Availability check
    const aRes = await fetch('http://localhost:5000/api/auth/availability?facultyId=' + f.id);
    const aData = await aRes.json();
    console.log('1. Availability slots count:', aData.length);

    // 2. Timetable check
    const tRes = await fetch('http://localhost:5000/api/auth/timetable?facultyId=' + f.id);
    const tData = await tRes.json();
    console.log('2. Total scheduled classes in Timetable:', tData.length);
    const assignedInTT = [...new Set(tData.map(d => d.subject))];
    console.log('   Assigned subjects in Timetable (Dashboard count):', assignedInTT.length, assignedInTT);

    // 3. Subjects check (My Subjects)
    const sRes = await fetch('http://localhost:5000/api/auth/subjects');
    const allSubs = await sRes.json();
    const mySubs = allSubs.filter(s => s.facultyId === f.id);
    console.log('3. My Subjects count (MySubjects page):', mySubs.length, mySubs.map(s => s.name + ' (' + s.weeklyLectures + ' Lect/wk)'));
  }
}

test().catch(console.error);
