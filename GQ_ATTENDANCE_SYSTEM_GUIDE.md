# 🎓 GQ-Attendance — QR & Geolocation-Based Anti-Proxy Attendance System
> **Comprehensive System Architecture, Workflow, and AI Context Document**  
> *Targeted for SRM Institute of Science & Technology and modern university environments.*

---

## 📌 Executive Summary
**GQ-Attendance** (Geo + QR) is an enterprise-grade, zero-trust smart attendance and academic scheduling system built with **Next.js 16 (App Router)**, **TypeScript**, **Drizzle ORM**, and **Supabase (PostgreSQL with Realtime WebSockets)**. 

It completely eliminates proxy attendance, WhatsApp QR screenshot forwarding, and location spoofing through a **7-Tier Anti-Proxy Engine**, while providing individual faculty members with a multi-course command center, reusable student cohorts/electives, 45-minute period scheduling, and comprehensive multi-week attendance timeline reports.

---

## 🏛️ Core System Architecture & Workflow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FACULTY COMMAND CENTER                                  │
│  1. Selects Course / Elective Preset (e.g. DBMS Core / Cloud Elective Batch B)        │
│  2. Chooses Period (1 to 8: 8am-4pm) & Venue (Classroom / Lab: e.g. TP 602, Lab 3)    │
│  3. Locks Faculty Laptop Host GPS Geotag (12.8231, 80.0441)                           │
│  4. Projector displays 10s Rotating HMAC-SHA256 QR + 10-Minute Attendance Countdown  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼ (Live Broadcast)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STUDENT CHECK-IN PROCESS                                  │
│  1. Student logs in with Registration Number (e.g. RA2412012010001) & Password         │
│  2. Scans live QR code using smartphone camera                                        │
│  3. Browser extracts high-entropy Hardware Fingerprint (Canvas 2D + WebGL + Specs)     │
│  4. Captures live Student GPS coordinates (High Accuracy Sensor)                       │
│  5. Sends single-use payload across Server Action                                      │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           7-TIER ZERO-TRUST VERIFICATION                               │
│  ✓ Tier 1: HMAC-SHA256 Token valid within active 10s rotation window?                  │
│  ✓ Tier 2: Host-to-Student Haversine GPS distance ≤ Geofence Radius (50m)?             │
│  ✓ Tier 3: Hardware fingerprint matches student's bound device?                        │
│  ✓ Tier 4: No other student checked in using this physical device during this period?  │
│  ✓ Tier 5: Cryptographic token nonce unconsumed & burned immediately?                  │
│  ✓ Tier 6: GPS accuracy radius & spoofing flags valid?                                 │
│  ✓ Tier 7: Real-time broadcast to Faculty Projector (Present / Absent / Flagged)       │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                    ATTENDANCE TIMELINE & REPORT GENERATION                             │
│  - Recorded under Academic Week (Week 1, Week 2, Week 3...), Date, Time, & Period      │
│  - One-Click CSV Export & Print/PDF Academic Register                                  │
│  - Reusable Presets saved for next week with zero re-entry                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 👨‍🏫 1. Faculty Command Center (Individual Faculty Portal)
The faculty dashboard is **not** locked to a single class; it is the **personal command center of the individual faculty member** (e.g., *Dr. K. Anitha*), who teaches multiple courses, elective groups, and lab batches across different departments.

### Key Capabilities:
1. **Course & Elective Presets (Reusable Cohorts)**:
   - Faculty configure courses once (e.g. `DBMS Core - MCA Sec F`, `Cloud Elective - Batch B`, `Full Stack Lab - Group 1`).
   - Associate enrolled students either by **picking from master roster with checkboxes** or by **uploading an elective CSV/XSV**.
   - Week after week, faculty click **"Launch Projector"** on the preset card — **zero student re-entry required**.
2. **Classroom vs Lab Venue System**:
   - 3-Way Toggle: **Classroom / Theory Hall**, **Computer / Practical Lab**, **Seminar Hall / Auditorium**.
   - Custom text input to type any room/lab number (e.g., `TP 602`, `Tech Park Lab 3`, `UB 501`, `AI & ML Lab`) with 1-click campus suggestion chips.
3. **Master Roster Management (CSV / XSV / Manual)**:
   - Upload student rosters in `.csv`, `.xsv`, `.tsv`, or `.txt` format (`REGNO, NAME, EMAIL, ROLE, PHONE`).
   - Inline extraction preview table with downloadable sample template (`Roster_Upload_Template.csv`).
   - Single student quick enrolment modal and searchable roster directory.
4. **Live Projector Mode**:
   - Fullscreen projector display with dynamic 10-second rotating QR code.
   - Active **10-minute countdown clock** with a visual phase tracker bar (*35m Lecture Phase + 10m Live Attendance Phase*).
   - Live WebSocket stream of checking-in students with verified distance to faculty host and real-time proxy conflict alerts.
5. **Interactive Attendance Calendar & Weekday Matrix**:
   - **Weekly Matrix View**: Monday to Saturday grid columns × Periods 1 to 8 rows.
   - Each session card displays Subject, Room/Venue, and real-time **Present & Absent** metrics (`🟢 55 Present (95%)` • `🔴 3 Absent`).
   - **Day Agenda View**: Expanded weekday cards with daily average attendance percentages.
   - One-click **Download CSV** per session or for the entire semester.
   - Printable / PDF formatted academic register.

---

## 🎓 2. Student Portal & Authentication
- **Direct REG Number & Password Authentication**:
  - Students log in using their **Registration Number** (e.g., `RA2412012010001`) and **Password**.
  - Default password for newly uploaded roster students: `srm@<last_4_digits_of_reg>` (or user-chosen upon first login).
- **In-Browser High-Speed QR Scanner**:
  - Powered by `html5-qrcode` using native camera streams.
  - Automatically requests and validates high-accuracy GPS coordinates before initiating the scan.
- **Hardware Binding & Device Security**:
  - Automatically fingerprints the physical device and binds it to the student's registration number.
- **Instant Attendance Feedback & My Log**:
  - Displays instant check-in verification with exact distance to host (e.g., `Verified: 6m from Faculty Host`).
  - Dedicated **"My Log"** tab displaying personal attendance history, timestamps, subject names, and percentage threshold indicators (< 75% warning).

---

## 🛡️ 3. The 7-Tier Zero-Trust Anti-Proxy Shield

| Tier | Security Mechanism | How It Defeats Proxy Cheating |
|---|---|---|
| **Tier 1** | **10-Second Rotating HMAC QR** | Server generates HMAC-SHA256 tokens rotated every 10s using a random 256-bit session secret. Screenshots forwarded via WhatsApp or Telegram expire before the absent student can open them. |
| **Tier 2** | **Host-to-Student Live GPS Geofence** | Calculates the exact distance in meters between the Faculty Host's browser and the student's phone using the **Haversine formula**. Anyone outside the classroom radius (e.g. 50m) is rejected. |
| **Tier 3** | **Hardware Device Binding Lock** | Generates a high-entropy hardware signature (Canvas 2D pixel hash, WebGL renderer, screen dimensions, CPU cores, timezone). Strictly binds 1 student account to 1 physical phone. |
| **Tier 4** | **Single-Device Multi-Account Trap** | Detects if a student in class attempts to log out and log in with an absent friend's account on the same phone. Both accounts are instantly flagged with a **Proxy Breach Alert**. |
| **Tier 5** | **Single-Use Nonce Ledger** | Each scanned token hash is registered in an active cryptographic ledger. The nonce is burned immediately upon redemption, neutralizing network replay and relay attacks. |
| **Tier 6** | **GPS Mock & Spoofing Defense** | Validates sensor accuracy radius (`position.coords.accuracy`), location origin, and coordinate timestamps to defeat Fake GPS apps and developer mock locations. |
| **Tier 7** | **Real-Time Projector Conflict Telemetry** | Displays live color-coded telemetry badges on the faculty screen (`Verified (4m)` vs `Proxy Conflict Alert: Duplicate Device`). Faculty can perform 1-click manual overrides. |

---

## 🕒 4. Standard Academic Schedule (8:00 AM – 4:00 PM)

Every class session is **45 minutes**, structured into:
1. **Teaching / Lecture Phase**: First **35 minutes**
2. **Live Attendance Window**: Last **10 minutes**

| Period | Total Slot (45 Mins) | Teaching Phase (35 Mins) | Live Attendance Window (Last 10 Mins) |
|---|---|---|---|
| **Period 1** | **08:00 AM – 08:45 AM** | 08:00 AM – 08:35 AM | **08:35 AM – 08:45 AM** |
| **Period 2** | **08:45 AM – 09:30 AM** | 08:45 AM – 09:20 AM | **09:20 AM – 09:30 AM** |
| *Morning Break* | *09:30 AM – 09:45 AM* | *15 min Interval* | — |
| **Period 3** | **09:45 AM – 10:30 AM** | 09:45 AM – 10:20 AM | **10:20 AM – 10:30 AM** |
| **Period 4** | **10:30 AM – 11:15 AM** | 10:30 AM – 11:05 AM | **11:05 AM – 11:15 AM** |
| **Period 5** | **11:15 AM – 12:00 PM** | 11:15 AM – 11:50 AM | **11:50 AM – 12:00 PM** |
| *Lunch Break* | *12:00 PM – 01:00 PM* | *60 min Lunch* | — |
| **Period 6** | **01:00 PM – 01:45 PM** | 01:00 PM – 01:35 PM | **01:35 PM – 01:45 PM** |
| **Period 7** | **01:45 PM – 02:30 PM** | 01:45 PM – 02:20 PM | **02:20 PM – 02:30 PM** |
| *Afternoon Break*| *02:30 PM – 02:45 PM* | *15 min Interval* | — |
| **Period 8** | **02:45 PM – 03:30 PM** | 02:45 PM – 03:20 PM | **03:20 PM – 03:30 PM** |

---

## 🗄️ 5. Database Schema Landscape (`src/db/schema.ts`)

| Table Name | Description | Key Fields |
|---|---|---|
| `re_users` | Core user accounts (Students, Tutors, CRs, Admins) | `id`, `email`, `role`, `name`, `regNo`, `passwordHash` |
| `re_classes` | Class sections / Batches | `id`, `name` (e.g. MCA II Year Sec F), `programmeId` |
| `re_class_roster` | Master roster of registered students in class | `id`, `classId`, `regNo`, `name`, `email`, `role`, `phone` |
| `re_class_memberships` | User to Class association mapping | `userId`, `classId`, `role` (`student`, `tutor`, `cr`) |
| `re_rooms` | Classrooms, Computer Labs, Seminar Halls | `id`, `name`, `building`, `floor`, `latitude`, `longitude` |
| `re_timetable_entries` | Weekly recurring schedule entries (Periods 1-8) | `id`, `classId`, `subjectName`, `dayOfWeek`, `startTime`, `endTime`, `roomId` |
| `re_sessions` | Live attendance sessions launched by faculty | `id`, `classId`, `name`, `facultyName`, `periodNumber`, `qrSecret`, `geofenceLat`, `geofenceLng`, `geofenceRadius`, `startTime`, `endTime` |
| `re_attendance_records`| Recorded check-in presence per student per session | `id`, `sessionId`, `studentId`, `status` (`present`/`absent`/`flagged`), `method`, `deviceFingerprint`, `latitude`, `longitude` |
| `re_course_presets` | Saved course & elective session templates | `id`, `classId`, `name`, `subjectName`, `facultyName`, `periodNumber`, `venueType`, `roomName` |
| `re_preset_students` | Enrolled student cohort per preset | `id`, `presetId`, `regNo`, `name`, `email`, `role` |
| `re_announcements` | Class & department noticeboard broadcasts | `id`, `classId`, `title`, `content`, `createdBy` |
| `re_push_subscriptions`| Web Push (PWA) notification tokens | `id`, `userId`, `subscription` (JSONB) |

---

## 📁 6. File & Directory Guide

```
GQ-Attendance/
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   ├── attendance.ts    # Session launch, QR validation, 7-tier check-in, timeline reports
│   │   │   ├── auth.ts          # Student REG/password & faculty authentication, cookies
│   │   │   ├── presets.ts       # Course/elective presets & reusable weekly cohorts
│   │   │   ├── roster.ts        # Bulk CSV/XSV student upload & single student enrollment
│   │   │   ├── timetable.ts     # 45-min timetable slots & dynamic room/lab creation
│   │   │   ├── announcements.ts # Broadcast announcements
│   │   │   └── push.ts          # Web Push notification subscriptions (PWA)
│   │   ├── auth/
│   │   │   └── login/page.tsx   # Login page (REG No / Email + Password)
│   │   ├── presentation/
│   │   │   └── page.tsx         # Interactive Executive Presentation Deck (/presentation)
│   │   ├── tutor/page.tsx       # Faculty Portal Server Page
│   │   ├── student/page.tsx     # Student Portal Server Page
│   │   └── layout.tsx           # Root layout with fonts, PWA registration, & theme
│   ├── components/
│   │   ├── TutorDashboard.tsx   # Faculty Command Center (Live Projector, Presets, Roster, Timeline)
│   │   ├── StudentDashboard.tsx # Student Check-in (QR Scanner, Hardware Fingerprint, My Log)
│   │   └── PWARegistration.tsx  # Service Worker & Web Push registration
│   ├── db/
│   │   ├── schema.ts            # Drizzle ORM PostgreSQL schema
│   │   ├── index.ts             # Database connection instance
│   │   └── seed.ts              # SRM database seeding script
│   └── lib/
│       ├── attendance.ts        # HMAC-SHA256 QR generator, nonce ledger, Haversine GPS, device binding
│       ├── push.ts              # Webpush notification dispatch
│       └── supabase-client.ts   # Supabase client with Realtime WebSockets
├── public/
│   ├── presentation.html        # Standalone HTML5 Executive Presentation Deck
│   ├── sw.js                    # Progressive Web App Service Worker
│   └── manifest.json            # PWA Web Manifest
├── presentation.html            # Standalone Presentation Deck
├── PRESENTATION_DECK.md         # Slide-by-slide speaker notes & delivery script
├── README.md                    # Project overview & documentation
└── GQ_ATTENDANCE_SYSTEM_GUIDE.md # This comprehensive system guide
```

---

## 🔑 7. Verified Test Accounts & Credentials

| Role | Login Identifier | Password | Primary Capabilities |
|---|---|---|---|
| **Faculty Member** | `tutor@srmist.edu.in` | `srm@123` | Launch 45-min periods, projector view, create presets, upload CSV rosters, view weekly timeline reports. |
| **Student 1 (CR)** | `RA2412012010001` | `srm@123` | Class Representative login, QR check-in, student timetable, attendance log. |
| **Student 2** | `RA2412012010002` | `srm@123` | Student QR check-in, personal attendance stats, timetable. |
| **Student 3** | `RA2412012010003` | `srm@123` | Student QR check-in, personal attendance stats, timetable. |

---

## ⚙️ 8. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript compilation check
npx tsc --noEmit

# 3. Start Next.js Development Server (Turbopack)
npm run dev

# 4. View Presentation Deck
# Visit: http://localhost:3000/presentation

# 5. Run Production Build
npm run build
```

---
*Document Version: 2.1.0 • Maintained by the GQ-Attendance Engineering Team*
