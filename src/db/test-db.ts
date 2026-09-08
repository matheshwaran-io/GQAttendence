import { db } from "./index";
import { departments, programmes, rooms, classes, classRoster } from "./schema";
import { eq } from "drizzle-orm";

async function runTests() {
  console.log("=== Rolleleven Database Integration Verification ===");

  try {
    // 1. Verify Departments
    const deptList = await db.select().from(departments);
    console.log(`[PASS] Departments found: ${deptList.length}`);
    const compSci = deptList.find((d) => d.name === "School of Computing");
    if (!compSci) throw new Error("Baseline Department 'School of Computing' missing!");
    console.log(`       Verified department: ${compSci.name} (${compSci.id})`);

    // 2. Verify Programmes
    const progList = await db.select().from(programmes);
    console.log(`[PASS] Programmes found: ${progList.length}`);
    const mca = progList.find((p) => p.name === "MCA" && p.departmentId === compSci.id);
    if (!mca) throw new Error("Baseline Programme 'MCA' missing under School of Computing!");
    console.log(`       Verified programme: ${mca.name} (${mca.id})`);

    // 3. Verify Rooms
    const roomsList = await db.select().from(rooms).where(eq(rooms.departmentId, compSci.id));
    console.log(`[PASS] Classrooms found: ${roomsList.length}`);
    if (roomsList.length < 3) throw new Error("Expected at least 3 classrooms seeded!");
    roomsList.forEach((r) => {
      console.log(`       Room: ${r.name} at GPS (${r.latitude}, ${r.longitude})`);
    });

    // 4. Verify Classes
    const classesList = await db.select().from(classes).where(eq(classes.programmeId, mca.id));
    console.log(`[PASS] Classes found: ${classesList.length}`);
    const sectionF = classesList.find((c) => c.name === "Section F");
    if (!sectionF) throw new Error("Baseline Class 'Section F' missing!");
    console.log(`       Verified class: ${sectionF.name} (Batch ${sectionF.batchYear})`);

    // 5. Verify Roster Entries
    const rosterList = await db.select().from(classRoster).where(eq(classRoster.classId, sectionF.id));
    console.log(`[PASS] Roster students/tutors found: ${rosterList.length}`);
    
    const tutor = rosterList.find((r) => r.role === "tutor");
    const cr = rosterList.find((r) => r.role === "cr");
    const students = rosterList.filter((r) => r.role === "student");

    if (!tutor) throw new Error("Tutor missing from Section F roster!");
    if (!cr) throw new Error("CR missing from Section F roster!");
    if (students.length !== 57) throw new Error(`Expected exactly 57 students, found ${students.length}`);

    console.log(`       Verified Tutor: ${tutor.name} (${tutor.email})`);
    console.log(`       Verified CR: ${cr.name} (${cr.email})`);
    console.log(`       Verified Student count: ${students.length}`);

    console.log("\n=============================================");
    console.log("🟢 ALL DATABASE SCHEMAS AND DATA INTEGRATION TESTS PASSED!");
    console.log("=============================================");
    process.exit(0);
  } catch (error: any) {
    console.error("\n🔴 INTEGRATION TEST FAILED:", error.message || error);
    process.exit(1);
  }
}

runTests();
