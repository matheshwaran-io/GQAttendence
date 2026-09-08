import { db } from "./index";
import { departments, programmes, rooms, classes, classRoster } from "./schema";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("Seeding database...");

  // 1. Seed Department
  let dept = await db.query.departments.findFirst({
    where: eq(departments.name, "School of Computing"),
  });
  if (!dept) {
    const inserted = await db.insert(departments).values({
      name: "School of Computing",
    }).returning();
    dept = inserted[0];
    console.log("Seeded Department: School of Computing");
  } else {
    console.log("Department already exists");
  }

  // 2. Seed Programme
  let prog = await db.query.programmes.findFirst({
    where: and(
      eq(programmes.name, "MCA"),
      eq(programmes.departmentId, dept.id)
    ),
  });
  if (!prog) {
    const inserted = await db.insert(programmes).values({
      name: "MCA",
      departmentId: dept.id,
    }).returning();
    prog = inserted[0];
    console.log("Seeded Programme: MCA");
  } else {
    console.log("Programme already exists");
  }

  // 3. Seed Rooms
  const srmRooms = [
    { name: "TP 602", latitude: 12.823123, longitude: 80.044123 },
    { name: "TP 603", latitude: 12.823250, longitude: 80.044250 },
    { name: "TP 701", latitude: 12.823350, longitude: 80.044350 },
  ];

  for (const r of srmRooms) {
    const existing = await db.query.rooms.findFirst({
      where: and(
        eq(rooms.name, r.name),
        eq(rooms.departmentId, dept.id)
      ),
    });
    if (!existing) {
      await db.insert(rooms).values({
        departmentId: dept.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
      });
      console.log(`Seeded Room: ${r.name}`);
    }
  }

  // 4. Seed Class
  let cls = await db.query.classes.findFirst({
    where: and(
      eq(classes.name, "Section F"),
      eq(classes.programmeId, prog.id),
      eq(classes.batchYear, 2026)
    ),
  });
  if (!cls) {
    const inserted = await db.insert(classes).values({
      name: "Section F",
      programmeId: prog.id,
      batchYear: 2026,
    }).returning();
    cls = inserted[0];
    console.log("Seeded Class: MCA Section F (Batch 2026)");
  } else {
    console.log("Class already exists");
  }

  // 5. Seed Roster (Tutor, CR, and Students)
  console.log("Seeding Roster...");

  // Seed Tutor
  const tutorEmail = "tutor@srmist.edu.in";
  const tutorRegNo = "TUTOR01";
  const existingTutor = await db.query.classRoster.findFirst({
    where: and(
      eq(classRoster.classId, cls.id),
      eq(classRoster.email, tutorEmail)
    ),
  });
  if (!existingTutor) {
    await db.insert(classRoster).values({
      classId: cls.id,
      name: "Dr. K. Anitha",
      email: tutorEmail,
      regNo: tutorRegNo,
      role: "tutor",
    });
    console.log("Seeded Tutor in roster");
  }

  // Seed CR
  const crEmail = "cr@srmist.edu.in";
  const crRegNo = "RA2412012010001";
  const existingCr = await db.query.classRoster.findFirst({
    where: and(
      eq(classRoster.classId, cls.id),
      eq(classRoster.email, crEmail)
    ),
  });
  if (!existingCr) {
    await db.insert(classRoster).values({
      classId: cls.id,
      name: "Aakash S",
      email: crEmail,
      regNo: crRegNo,
      role: "cr",
    });
    console.log("Seeded CR in roster");
  }

  // Seed 58 Students
  let studentCount = 0;
  for (let i = 2; i <= 58; i++) {
    const numStr = String(i).padStart(4, "0");
    const regNo = `RA241201201${numStr}`;
    const email = `student${i}@srmist.edu.in`;
    const name = `Student ${i}`;

    const existingStudent = await db.query.classRoster.findFirst({
      where: and(
        eq(classRoster.classId, cls.id),
        eq(classRoster.email, email)
      ),
    });

    if (!existingStudent) {
      await db.insert(classRoster).values({
        classId: cls.id,
        name,
        email,
        regNo,
        role: "student",
      });
      studentCount++;
    }
  }

  if (studentCount > 0) {
    console.log(`Seeded ${studentCount} students in roster`);
  } else {
    console.log("Students already exist in roster");
  }

  console.log("Seeding completed successfully!");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
