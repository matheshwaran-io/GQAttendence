import { pgTable, uuid, text, integer, doublePrecision, timestamp, jsonb, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums (represented as text constraints or explicit pgEnum)
export const roleEnum = pgEnum("re_user_role", ["tutor", "cr", "student"]);
export const sessionTypeEnum = pgEnum("re_session_type", ["class_period", "event"]);
export const attendanceStatusEnum = pgEnum("re_attendance_status", ["present", "absent", "flagged"]);
export const attendanceMethodEnum = pgEnum("re_attendance_method", ["qr_scan", "manual"]);
export const eventParticipantStatusEnum = pgEnum("re_event_participant_status", ["invited", "registered"]);

// 1. Departments Table
export const departments = pgTable("re_departments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Programmes Table
export const programmes = pgTable("re_programmes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: uuid("department_id")
    .references(() => departments.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Rooms Table
export const rooms = pgTable("re_rooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: uuid("department_id")
    .references(() => departments.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Classes Table
export const classes = pgTable("re_classes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  programmeId: uuid("programme_id")
    .references(() => programmes.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  batchYear: integer("batch_year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Class Memberships Table
export const classMemberships = pgTable(
  "re_class_memberships",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull(), // Links to auth.users in Supabase
    classId: uuid("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(), // 'tutor' | 'cr' | 'student'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("re_class_membership_user_class_idx").on(table.classId, table.userId),
  ]
);

// 6. Class Roster Table (Pre-loaded list of students)
export const classRoster = pgTable(
  "re_class_roster",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    classId: uuid("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    regNo: text("reg_no").notNull(),
    phone: text("phone"),
    password: text("password"), // Optional hashed / default password for direct student REG login
    role: text("role").default("student").notNull(), // 'tutor' | 'cr' | 'student'
    userId: uuid("user_id"), // Linked auth.users.id when student registers
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("re_class_roster_email_idx").on(table.classId, table.email),
    uniqueIndex("re_class_roster_reg_no_idx").on(table.classId, table.regNo),
  ]
);

// 7. Timetable Entries Table
export const timetableEntries = pgTable("re_timetable_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: uuid("class_id")
    .references(() => classes.id, { onDelete: "cascade" })
    .notNull(),
  subjectName: text("subject_name").notNull(),
  facultyName: text("faculty_name"), // Faculty member assigned to this period
  periodNumber: integer("period_number"), // Period 1 to 6
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Sessions Table (Attendance Sessions)
export const sessions = pgTable("re_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: uuid("class_id")
    .references(() => classes.id, { onDelete: "cascade" })
    .notNull(),
  timetableEntryId: uuid("timetable_entry_id").references(() => timetableEntries.id, { onDelete: "set null" }),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  sessionType: text("session_type").notNull(), // 'class_period' | 'event'
  name: text("name").notNull(), // Subject name or Event name
  facultyName: text("faculty_name"), // Host Faculty Name for this session
  periodNumber: integer("period_number"), // Period 1 to 6
  hostUserId: uuid("host_user_id"), // Faculty Host User ID
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  geofenceLat: doublePrecision("geofence_lat"), // Host live Latitude
  geofenceLng: doublePrecision("geofence_lng"), // Host live Longitude
  geofenceRadius: integer("geofence_radius").default(50).notNull(), // default 50 meters
  qrSecret: text("qr_secret").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Event Participants Table
export const eventParticipants = pgTable("re_event_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  studentId: uuid("student_id").notNull(), // References auth.users
  status: text("status").notNull(), // 'invited' | 'registered'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 10. Attendance Records Table
export const attendanceRecords = pgTable(
  "re_attendance_records",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id").notNull(), // References auth.users
    status: text("status").notNull(), // 'present' | 'absent' | 'flagged'
    method: text("method").notNull(), // 'qr_scan' | 'manual'
    deviceFingerprint: text("device_fingerprint"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    markedBy: uuid("marked_by"), // References auth.users (nullable, for manual edit override)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("re_attendance_session_student_idx").on(table.sessionId, table.studentId),
  ]
);

// 11. Announcements Table
export const announcements = pgTable("re_announcements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: uuid("class_id")
    .references(() => classes.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: uuid("created_by").notNull(), // References auth.users
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Push Subscriptions Table
export const pushSubscriptions = pgTable("re_push_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(), // References auth.users
  subscription: jsonb("subscription").notNull(), // Stores PushSubscription JSON object
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 13. Course / Session Presets (for Electives, Batches, and Weekly recurring classes)
export const coursePresets = pgTable("re_course_presets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: uuid("class_id")
    .references(() => classes.id, { onDelete: "cascade" })
    .notNull(),
  facultyName: text("faculty_name").notNull(),
  name: text("name").notNull(), // e.g. "Cloud Computing Elective - Group B", "DBMS Core - Sec F"
  subjectName: text("subject_name").notNull(),
  periodNumber: integer("period_number").default(1).notNull(), // 1 to 6
  venueType: text("venue_type").default("classroom").notNull(), // 'classroom' | 'lab' | 'seminar_hall'
  roomName: text("room_name").default("TP 602").notNull(),
  dayOfWeek: integer("day_of_week"), // 1=Mon, ..., 6=Sat
  startTime: text("start_time"),
  endTime: text("end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14. Preset Students Table (Student Cohorts / Elective Enrolments)
export const presetStudents = pgTable(
  "re_preset_students",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    presetId: uuid("preset_id")
      .references(() => coursePresets.id, { onDelete: "cascade" })
      .notNull(),
    regNo: text("reg_no").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role").default("student").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("re_preset_student_reg_idx").on(table.presetId, table.regNo),
  ]
);

