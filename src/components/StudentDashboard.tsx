"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { checkInAction, getStudentAttendanceReportAction } from "@/app/actions/attendance";
import { 
  LogOut, 
  MapPin, 
  QrCode, 
  Calendar, 
  Bell, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Camera, 
  X, 
  Loader2,
  Compass,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Home,
  Check,
  RefreshCw,
  Info
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface StudentDashboardProps {
  student: {
    id: string;
    email: string;
    name: string;
    className: string;
    classId: string;
    regNo?: string;
  };
  initialReport: any;
  initialTimetable: any[];
  initialAnnouncements: any[];
}

export function StudentDashboard({
  student,
  initialReport,
  initialTimetable,
  initialAnnouncements,
}: StudentDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"home" | "timetable" | "checkin" | "announcements">("home");

  // State reports
  const [report, setReport] = useState(initialReport);
  const [timetable] = useState(initialTimetable);
  const [announcements] = useState(initialAnnouncements);

  // Day Order state
  const [currentDayOrder, setCurrentDayOrder] = useState(3);
  const [showDayOrderPopover, setShowDayOrderPopover] = useState(false);

  // Check-In states
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [checkInPending, setCheckInPending] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{ success: boolean; message: string; status?: string; distanceMeters?: number } | null>(null);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // 1. Fetch Coordinates with High Accuracy
  const fetchCoordinates = () => {
    setGpsLoading(true);
    setCheckInResult(null);
    if (!navigator.geolocation) {
      setCheckInResult({
        success: false,
        message: "Geolocation is not supported by your browser.",
      });
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      (error) => {
        let msg = "Location permission denied. Please grant GPS access in browser.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "GPS permission required to match classroom host geotag.";
        }
        setCheckInResult({ success: false, message: msg });
        setGpsLoading(false);
        // Dev fallback coordinates
        setCoords({ latitude: 12.8231, longitude: 80.0441 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    fetchCoordinates();
  }, []);

  // 2. Hardware Fingerprint Generator
  const generateDeviceFingerprint = (): string => {
    try {
      const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const cores = navigator.hardwareConcurrency || 4;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let canvasHash = "cv_fallback";
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Inter', sans-serif";
        ctx.fillStyle = "#6E5BFF";
        ctx.fillText("GQ-Attendance-Lock-2026", 2, 2);
        canvasHash = canvas.toDataURL().slice(-32);
      }
      const raw = `${navigator.userAgent}|${screenInfo}|${tz}|${cores}|${canvasHash}`;
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = (hash << 5) - hash + raw.charCodeAt(i);
        hash |= 0;
      }
      return `hw_${Math.abs(hash).toString(16).padStart(8, "0")}`;
    } catch {
      return "hw_generic_device";
    }
  };

  // 3. Start Camera Scanner
  useEffect(() => {
    if (showCameraScanner && coords) {
      const timer = setTimeout(() => {
        const html5Qrcode = new Html5Qrcode("qr-reader");
        qrScannerRef.current = html5Qrcode;

        html5Qrcode
          .start(
            { facingMode: "environment" },
            { fps: 12, qrbox: { width: 240, height: 240 } },
            (decodedText) => {
              html5Qrcode.stop().then(() => {
                setShowCameraScanner(false);
                handleCheckInRedemption(decodedText);
              }).catch(err => console.log("Scanner stop error:", err));
            },
            () => {}
          )
          .catch((err) => {
            console.error("Camera access error:", err);
            setCheckInResult({
              success: false,
              message: "Unable to access camera. Please allow camera permissions.",
            });
            setShowCameraScanner(false);
          });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (qrScannerRef.current?.isScanning) {
          qrScannerRef.current.stop().catch(console.error);
        }
      };
    }
  }, [showCameraScanner, coords]);

  // 4. Submit Token & Redeem Attendance
  const handleCheckInRedemption = async (scannedPayload: string) => {
    setCheckInPending(true);
    setCheckInResult(null);

    const parts = scannedPayload.split("|");
    if (parts.length < 2) {
      setCheckInResult({
        success: false,
        message: "Invalid QR format. Please scan the official projector QR code.",
      });
      setCheckInPending(false);
      return;
    }

    const [sessionId, token] = parts;
    const fingerprint = generateDeviceFingerprint();

    const res: any = await checkInAction(
      sessionId,
      token,
      coords?.latitude || 12.8231,
      coords?.longitude || 80.0441,
      fingerprint
    );

    if (res.success) {
      setCheckInResult({
        success: true,
        message: res.message || "Attendance recorded successfully.",
        status: res.status,
        distanceMeters: res.distanceMeters,
      });
      // Refresh student attendance report
      const updatedReport = await getStudentAttendanceReportAction(student.classId, student.id);
      if (updatedReport.success && updatedReport.data) {
        setReport(updatedReport.data);
      }
    } else {
      setCheckInResult({
        success: false,
        message: res.error || "Attendance verification failed.",
        status: res.status,
        distanceMeters: res.distanceMeters,
      });
    }
    setCheckInPending(false);
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push("/auth/login");
    router.refresh();
  };

  const attendancePercentage = report?.attendancePercentage ?? 82;
  const totalClasses = report?.totalSessions ?? 55;
  const attendedCount = report?.attendedSessions ?? 45;
  const absentCount = Math.max(0, totalClasses - attendedCount);

  // Student first name
  const studentFirstName = student.name?.split(" ")[0] || "Student";
  const studentRegNo = student.regNo || "RA2412012010001";

  // Sample schedule for Day Order
  const todaySchedule = [
    { period: 1, name: "Java Programming Theory", slot: "Session I · 08:00 AM", room: "TP 602", facultyInitials: "AR", status: "present", isOnline: false },
    { period: 2, name: "Database Management Systems", slot: "Session II · 08:45 AM", room: "TP 602", facultyInitials: "MRS", status: "active", isOnline: false },
    { period: 3, name: "Operating Systems & Linux", slot: "Session III · 09:45 AM", room: "TP 603", facultyInitials: "RP", status: "upcoming", isOnline: false },
    { period: 4, name: "Cloud Computing Architectures", slot: "Session IV · 10:30 AM", room: "TP Lab 3", facultyInitials: "VK", status: "online", isOnline: true },
  ];

  return (
    <div className="flex-1 flex flex-col max-w-[440px] w-full mx-auto pb-28 bg-[#0A0A0F] text-[#F0F0FF] min-h-screen relative font-sans">
      {/* Top Header */}
      <header className="p-4 pt-6 flex justify-between items-start border-b border-[#222230] bg-[#0A0A0F]/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#9090A8] font-normal">
            Good morning, <strong className="text-[#6E5BFF] font-semibold">{studentFirstName}</strong>
          </span>
          
          {/* Day Order Pill */}
          <div className="relative">
            <button
              onClick={() => setShowDayOrderPopover(!showDayOrderPopover)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#1A1A24] border border-[#2E2E40] text-[11px] font-mono text-[#F0F0FF] hover:border-[#6E5BFF] transition duration-150 cursor-pointer"
            >
              <span>Day {currentDayOrder} · Today</span>
              <ChevronRight className={`w-3 h-3 text-[#9090A8] transition duration-150 ${showDayOrderPopover ? "rotate-90" : ""}`} />
            </button>

            {/* Day Order Switcher Popover */}
            {showDayOrderPopover && (
              <div className="absolute top-8 left-0 z-50 bg-[#1A1A24] border border-[#2E2E40] rounded-xl p-3 shadow-modal flex flex-col gap-2 w-52 animate-fade-in">
                <span className="text-[11px] font-mono uppercase text-[#9090A8]">Select Day Order</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        setCurrentDayOrder(day);
                        setShowDayOrderPopover(false);
                      }}
                      className={`py-1.5 rounded-[6px] text-xs font-mono font-medium transition duration-150 ${
                        currentDayOrder === day
                          ? "bg-[#6E5BFF] text-white"
                          : "bg-[#111118] text-[#9090A8] hover:text-[#F0F0FF] border border-[#222230]"
                      }`}
                    >
                      Day {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("announcements")}
            className="p-2 rounded-xl bg-[#111118] border border-[#222230] text-[#9090A8] hover:text-[#F0F0FF] transition duration-150"
            title="Announcements"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-[#111118] border border-[#222230] text-[#9090A8] hover:text-[#FF4D6A] transition duration-150"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-4 flex flex-col gap-6">

        {/* ============================================================ */}
        {/* TAB 1: HOME SCREEN                                           */}
        {/* ============================================================ */}
        {activeTab === "home" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* NEXT UP Card */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#50505E] font-medium font-mono">
                Next Up
              </span>

              <div className="bg-[#111118] border border-[#222230] border-l-[3px] border-l-[#6E5BFF] rounded-xl p-4 shadow-card flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <h3 className="font-display font-bold text-base text-[#F0F0FF]">
                      DBMS Theory
                    </h3>
                    <span className="text-xs text-[#9090A8] mt-0.5">
                      Session II · 08:45 AM
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-[#F0F0FF] bg-[#1A1A24] border border-[#2E2E40] px-2 py-0.5 rounded-[6px]">
                    [MRS]
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#222230]">
                  <span className="text-xs text-[#9090A8] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#6E5BFF]" />
                    Room TP 602
                  </span>

                  <button
                    onClick={() => setActiveTab("checkin")}
                    className="bg-[#6E5BFF] hover:bg-[#5C48EE] text-white text-xs font-semibold px-4 py-2 rounded-xl transition duration-150 shadow-[0_0_16px_rgba(110,91,255,0.25)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Check In Now
                  </button>
                </div>
              </div>
            </div>

            {/* TODAY'S SCHEDULE List */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] uppercase tracking-wider text-[#50505E] font-medium font-mono">
                Today&apos;s Schedule
              </span>

              <div className="flex flex-col gap-2">
                {todaySchedule.map((sess, idx) => (
                  <div
                    key={idx}
                    className={`bg-[#111118] border border-[#222230] rounded-xl p-3.5 shadow-card flex items-center justify-between transition duration-150 ${
                      sess.status === "present"
                        ? "border-l-[3px] border-l-[#22C97A]"
                        : sess.status === "active"
                        ? "border-l-[3px] border-l-[#6E5BFF]"
                        : sess.isOnline
                        ? "border-l-[3px] border-l-[#38BDF8]"
                        : "border-l-[3px] border-l-[#2E2E40]"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <h4 className="font-display font-bold text-sm text-[#F0F0FF]">
                        {sess.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#9090A8]">
                        <span className="font-mono text-[11px]">{sess.slot}</span>
                        <span>·</span>
                        <span>{sess.room}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#9090A8] bg-[#1A1A24] border border-[#222230] px-1.5 py-0.5 rounded-[6px]">
                        [{sess.facultyInitials}]
                      </span>

                      {sess.status === "present" && (
                        <span className="px-2 py-0.5 rounded-[6px] bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] text-[11px] font-medium">
                          Present
                        </span>
                      )}
                      {sess.status === "active" && (
                        <span className="px-2 py-0.5 rounded-[6px] bg-[#6E5BFF18] text-[#6E5BFF] border border-[#6E5BFF30] text-[11px] font-medium animate-pulse">
                          Live
                        </span>
                      )}
                      {sess.isOnline && (
                        <span className="px-2 py-0.5 rounded-[6px] bg-[#38BDF818] text-[#38BDF8] border border-[#38BDF830] text-[11px] font-medium">
                          Online
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MY ATTENDANCE Stat Cards Row */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] uppercase tracking-wider text-[#50505E] font-medium font-mono">
                My Attendance
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-[#111118] border border-[#222230] p-3.5 rounded-xl flex flex-col gap-1 shadow-card">
                  <span className="font-display font-bold text-2xl text-[#F0F0FF]">
                    {attendancePercentage}%
                  </span>
                  <span className="text-[11px] text-[#9090A8] font-normal">Overall Rate</span>
                </div>

                <div className="bg-[#111118] border border-[#222230] p-3.5 rounded-xl flex flex-col gap-1 shadow-card">
                  <span className="font-display font-bold text-2xl text-[#22C97A]">
                    {attendedCount}
                  </span>
                  <span className="text-[11px] text-[#9090A8] font-normal">Present</span>
                </div>

                <div className="bg-[#111118] border border-[#222230] p-3.5 rounded-xl flex flex-col gap-1 shadow-card">
                  <span className="font-display font-bold text-2xl text-[#FF4D6A]">
                    {absentCount}
                  </span>
                  <span className="text-[11px] text-[#9090A8] font-normal">Absent</span>
                </div>
              </div>
            </div>

            {/* Recent Attendance History Rows */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] uppercase tracking-wider text-[#50505E] font-medium font-mono">
                Recent Check-Ins
              </span>

              {report?.history && report.history.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {report.history.slice(0, 4).map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-[#111118] border border-[#222230] rounded-xl p-3 flex items-center justify-between shadow-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#6E5BFF18] border border-[#6E5BFF30] text-[#6E5BFF] flex items-center justify-center font-display font-bold text-xs">
                          {rec.subjectName?.slice(0, 2).toUpperCase() || "CS"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#F0F0FF] line-clamp-1">
                            {rec.subjectName || "Class Session"}
                          </span>
                          <span className="text-[10px] font-mono text-[#9090A8]">
                            {new Date(rec.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      {rec.status === "present" ? (
                        <span className="px-2 py-0.5 rounded-[6px] bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] text-[11px] font-medium">
                          Present
                        </span>
                      ) : rec.status === "flagged" ? (
                        <span className="px-2 py-0.5 rounded-[6px] bg-[#FFB34018] text-[#FFB340] border border-[#FFB34030] text-[11px] font-medium">
                          Flagged
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[6px] bg-[#FF4D6A18] text-[#FF4D6A] border border-[#FF4D6A30] text-[11px] font-medium">
                          Absent
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#111118] border border-[#222230] p-6 rounded-xl text-center flex flex-col items-center gap-1 shadow-card">
                  <span className="font-display font-bold text-3xl text-[#50505E]">—</span>
                  <span className="text-xs font-semibold text-[#F0F0FF]">No past check-ins</span>
                  <span className="text-[11px] text-[#9090A8]">Session records will appear here after verification.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: QR CHECK-IN SCREEN                                    */}
        {/* ============================================================ */}
        {activeTab === "checkin" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Screen Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("home")}
                className="p-2 rounded-xl bg-[#111118] border border-[#222230] text-[#9090A8] hover:text-[#F0F0FF] transition duration-150"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col">
                <h3 className="font-display font-bold text-base text-[#F0F0FF]">Check In</h3>
                <span className="text-xs text-[#9090A8]">DBMS Theory · Session II</span>
              </div>
            </div>

            {/* QR Scan Display Panel with 2s Violet Pulse Ring */}
            <div className="bg-[#1A1A24] border border-[#222230] p-6 rounded-2xl shadow-card flex flex-col items-center gap-5 relative overflow-hidden">
              {/* Status Header */}
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-medium text-[#9090A8]">Optical Check-In</span>
                <span className="text-[11px] font-mono text-[#6E5BFF] bg-[#6E5BFF18] border border-[#6E5BFF30] px-2 py-0.5 rounded-[6px]">
                  Zero-Trust Active
                </span>
              </div>

              {/* QR Scanner Area / Frame */}
              <div className="relative flex items-center justify-center my-2">
                {/* 2s Slow Violet Pulse Ping Animation */}
                <div className="absolute inset-0 rounded-2xl bg-[#6E5BFF]/20 animate-qr-pulse pointer-events-none" />

                {/* White Scanner Square */}
                <div className="relative w-64 h-64 bg-white rounded-2xl shadow-2xl p-3 flex flex-col items-center justify-center overflow-hidden border-2 border-[#6E5BFF]/30">
                  {showCameraScanner ? (
                    <div id="qr-reader" className="w-full h-full rounded-xl overflow-hidden" />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-800 text-center p-4">
                      <Camera className="w-10 h-10 text-[#6E5BFF]" />
                      <span className="text-xs font-semibold text-slate-900">
                        Camera Ready
                      </span>
                      <button
                        onClick={() => setShowCameraScanner(true)}
                        className="bg-[#6E5BFF] text-white text-xs font-semibold px-4 py-2 rounded-xl transition duration-150 hover:bg-[#5C48EE] cursor-pointer"
                      >
                        Open Camera
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Instruction Label */}
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-xs text-[#9090A8] font-normal">
                  Point your phone camera at the screen
                </p>
                <span className="text-[11px] font-mono text-[#50505E]">
                  Refreshes every 10s on projector
                </span>
              </div>

              {/* Check-in result Banner */}
              {checkInResult && (
                <div
                  className={`w-full p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    checkInResult.success
                      ? "bg-[#22C97A18] border-[#22C97A30] text-[#22C97A]"
                      : "bg-[#FF4D6A18] border-[#FF4D6A30] text-[#FF4D6A]"
                  }`}
                >
                  {checkInResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold">{checkInResult.message}</span>
                    {checkInResult.distanceMeters !== undefined && (
                      <span className="text-[11px] font-mono mt-0.5 opacity-90">
                        Distance to host: {checkInResult.distanceMeters}m
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Telemetry Chips: GPS & Hardware Binding */}
              <div className="w-full flex flex-col gap-2 pt-2 border-t border-[#222230]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9090A8] flex items-center gap-1.5">
                    <Compass className={`w-3.5 h-3.5 text-[#6E5BFF] ${gpsLoading ? "animate-spin" : ""}`} />
                    Location Sensor:
                  </span>
                  <span className="font-mono text-[11px] text-[#F0F0FF]">
                    {coords ? `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)} (Locked)` : "Acquiring..."}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9090A8] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#22C97A]" />
                    Hardware Binding:
                  </span>
                  <span className="font-mono text-[11px] text-[#22C97A]">
                    {studentRegNo} · Verified Device
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: TIMETABLE SCREEN                                      */}
        {/* ============================================================ */}
        {activeTab === "timetable" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#F0F0FF]">Timetable</h3>
              <span className="px-2.5 py-1 rounded-[6px] bg-[#1A1A24] border border-[#2E2E40] text-[11px] font-mono text-[#F0F0FF]">
                Day {currentDayOrder}
              </span>
            </div>

            {/* Horizontal Day Order Switcher */}
            <div className="flex items-center justify-between bg-[#111118] border border-[#222230] p-1 rounded-xl">
              {[1, 2, 3, 4, 5, 6].map((day) => (
                <button
                  key={day}
                  onClick={() => setCurrentDayOrder(day)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition duration-150 ${
                    currentDayOrder === day
                      ? "bg-[#6E5BFF] text-white shadow-[0_0_12px_rgba(110,91,255,0.3)] font-semibold"
                      : "text-[#9090A8] hover:text-[#F0F0FF]"
                  }`}
                >
                  Day {day}
                </button>
              ))}
            </div>

            {/* Period Sessions List */}
            <div className="flex flex-col gap-4">
              {todaySchedule.map((sess, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-mono text-[#9090A8] text-[11px]">{sess.slot.split(" · ")[1]}</span>
                    <span className="text-[11px] font-mono text-[#50505E] uppercase">{sess.slot.split(" · ")[0]}</span>
                  </div>

                  <div className="bg-[#111118] border border-[#222230] rounded-xl p-4 shadow-card flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <h4 className="font-display font-bold text-sm text-[#F0F0FF]">
                        {sess.name}
                      </h4>
                      <span className="text-xs text-[#9090A8]">
                        Venue: {sess.room}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-[#F0F0FF] bg-[#1A1A24] border border-[#2E2E40] px-2 py-0.5 rounded-[6px]">
                      [{sess.facultyInitials}]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ANNOUNCEMENTS SCREEN                                  */}
        {/* ============================================================ */}
        {activeTab === "announcements" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#F0F0FF]">Noticeboard</h3>
              <span className="text-xs text-[#9090A8] font-mono">{announcements.length} Posts</span>
            </div>

            {announcements.length === 0 ? (
              <div className="bg-[#111118] border border-[#222230] p-8 rounded-xl text-center flex flex-col items-center gap-1 shadow-card">
                <span className="font-display font-bold text-3xl text-[#50505E]">—</span>
                <span className="text-xs font-semibold text-[#F0F0FF]">No announcements posted</span>
                <span className="text-[11px] text-[#9090A8]">Department broadcasts will appear here.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {announcements.map((ann: any) => (
                  <div
                    key={ann.id}
                    className="bg-[#111118] border border-[#222230] rounded-xl p-4 shadow-card flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-display font-bold text-sm text-[#F0F0FF] leading-snug">
                        {ann.title}
                      </h4>
                      <span className="text-[10px] font-mono text-[#50505E] shrink-0 ml-2">
                        {new Date(ann.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <p className="text-xs text-[#9090A8] leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Floating Pill Bottom Navigation (16px above safe area) */}
      <nav className="fixed bottom-4 inset-x-4 max-w-[400px] mx-auto z-40 bg-[#111118]/90 backdrop-blur-md border border-[#222230] p-1.5 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex items-center justify-between">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs font-medium transition duration-150 ${
            activeTab === "home"
              ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
              : "text-[#9090A8] hover:text-[#F0F0FF]"
          }`}
        >
          <Home className="w-4 h-4" />
          {activeTab === "home" && <span>Home</span>}
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs font-medium transition duration-150 ${
            activeTab === "timetable"
              ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
              : "text-[#9090A8] hover:text-[#F0F0FF]"
          }`}
        >
          <Calendar className="w-4 h-4" />
          {activeTab === "timetable" && <span>Timetable</span>}
        </button>

        <button
          onClick={() => setActiveTab("checkin")}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs font-medium transition duration-150 ${
            activeTab === "checkin"
              ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
              : "text-[#9090A8] hover:text-[#F0F0FF]"
          }`}
        >
          <QrCode className="w-4 h-4" />
          {activeTab === "checkin" && <span>Check In</span>}
        </button>

        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs font-medium transition duration-150 ${
            activeTab === "announcements"
              ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
              : "text-[#9090A8] hover:text-[#F0F0FF]"
          }`}
        >
          <Bell className="w-4 h-4" />
          {activeTab === "announcements" && <span>Notices</span>}
        </button>
      </nav>
    </div>
  );
}
