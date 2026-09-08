# 🎓 GQ-Attendance — QR & Geolocation-Based Anti-Proxy Attendance System

> **Enterprise-Grade Zero-Trust Smart Campus Attendance Platform**  
> *Targeted for SRM Institute of Science & Technology and Modern Higher-Education Institutions.*

---

## 📌 Overview

**GQ-Attendance** (Geo + QR) is a zero-trust smart attendance and academic scheduling system built with **Next.js 16 (App Router)**, **TypeScript**, **Drizzle ORM**, and **Supabase (PostgreSQL with Realtime WebSockets)**.

It eliminates proxy attendance, WhatsApp QR screenshot forwarding, and location spoofing through an unhackable **7-Tier Anti-Proxy Engine**, while providing individual faculty members with a multi-course command center, reusable student cohorts/electives, 45-minute period scheduling, and instant PDF/CSV register generation.

---

## 🛡️ The 7-Tier Zero-Trust Anti-Proxy Shield

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              7-TIER VERIFICATION PIPELINE                              │
│  ✓ Tier 1: 10-Second Rotating HMAC-SHA256 Token (Dynamic session secret)               │
│  ✓ Tier 2: Host-to-Student Haversine GPS Distance (≤ 50m Geofence envelope)            │
│  ✓ Tier 3: Hardware Fingerprint Device Binding (Canvas 2D + WebGL + Silicon Specs)     │
│  ✓ Tier 4: Single-Device Multi-Account Trap (Auto-flags buddy punching accounts)       │
│  ✓ Tier 5: Single-Use Nonce Ledger (Scanned tokens burned immediately with TTL)        │
│  ✓ Tier 6: GPS Mock & Sensor Accuracy Defense (Defeats fake location apps)             │
│  ✓ Tier 7: Real-Time Projector Telemetry (Live WebSocket feed + 1-click overrides)     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 👨‍🏫 1. Faculty Command Center
- **Reusable Course & Elective Presets**: Configure cohorts once (`DBMS Core`, `Cloud Elective Batch B`, `Full Stack Lab`), launch weekly with 1 click.
- **Classroom vs Lab Venues**: 3-way toggle (Theory Halls, Practical Labs, Seminar Halls) with campus room suggestion chips (`TP 602`, `Lab 3`, `UB 501`).
- **Live Projector HUD**: 45-minute academic period structure with **35m lecture phase** + **10m live attendance countdown clock** and rotating QR display.
- **Master Roster Management**: Bulk CSV/XSV/TSV roster parsing, inline extraction table, downloadable sample template (`Roster_Upload_Template.csv`), and single-student quick enrollment.
- **Weekly Matrix & Export**: Monday–Saturday period grid (Periods 1 to 8: 8:00 AM – 4:00 PM), 1-click CSV export, and print-ready PDF academic registers.

### 📱 2. Student Portal (Zero-Install PWA)
- **Direct Reg No & Password Authentication**: Instant login with university registration number (`RA2412012010001`).
- **In-Browser High-Speed Camera Scanner**: Powered by `html5-qrcode` with sub-second QR decoding and automatic high-accuracy GPS check.
- **Instant Verified Feedback**: Live confirmation badge (e.g. `🟢 Verified: 6m from Faculty Host`).
- **"My Log" & Debarment Protection**: Cumulative percentage tracking with alerts when approaching the mandatory 75% attendance threshold.

### 📽️ 3. Built-In Interactive Presentation Deck (`/presentation`)
- High-impact, 14-slide executive presentation accessible directly at [`http://localhost:3000/presentation`](http://localhost:3000/presentation).
- Embedded live interactive simulators:
  - ⏱️ *10-Second Rotating HMAC-SHA256 Token Simulator*
  - 📍 *Interactive Haversine Geofence Distance Slider (0m–100m)*
  - 🛡️ *Interactive 7-Tier Security Shield Explorer*
  - 🕒 *45-Minute Period Schedule Visualizer*
- Presenter keyboard shortcuts (`Space`/`Arrow` navigation, `P` for Speaker Notes, `O` for 14-slide grid overview, `F` for fullscreen, `Cmd+P` for 16:9 PDF export).
- Standalone zero-dependency offline presentation: [`presentation.html`](./presentation.html).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + Turbopack
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS v4 + Framer Motion + Lucide Icons
- **Database & ORM**: PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/)
- **Real-Time Layer**: [Supabase Realtime WebSockets](https://supabase.com/)
- **PWA & Push**: Web Push (VAPID Service Workers) + Manifest
- **Scanning & Crypto**: `html5-qrcode`, `qrcode`, Node.js `crypto` (HMAC-SHA256)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and add your database & Supabase credentials:
```bash
cp .env.example .env.local
```

### 3. Database Migration & Seeding
```bash
npm run db:migrate
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application, or [http://localhost:3000/presentation](http://localhost:3000/presentation) to view the executive slide deck.

---

## 🔑 Demo Test Accounts

| Role | Username / Identifier | Password | Capabilities |
|---|---|---|---|
| **Faculty Member** | `tutor@srmist.edu.in` | `srm@123` | Launch 45m periods, projector view, create presets, upload CSV rosters, view timeline reports. |
| **Student (CR)** | `RA2412012010001` | `srm@123` | Class representative login, QR check-in, timetable, personal log. |
| **Student 2** | `RA2412012010002` | `srm@123` | Student QR check-in, attendance stats, timetable. |
| **Student 3** | `RA2412012010003` | `srm@123` | Student QR check-in, attendance stats, timetable. |

---

## 📄 License
Maintained by the **GQ-Attendance Engineering Team**.
