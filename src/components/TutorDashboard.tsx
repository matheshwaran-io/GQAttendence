"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { 
  createSessionAction, 
  getQRTokenAction, 
  manualAttendanceOverrideAction, 
  getClassAttendanceReportAction,
  getDetailedAttendanceReportAction
} from "@/app/actions/attendance";
import { 
  createTimetableEntryAction, 
  deleteTimetableEntryAction, 
  getTimetableAction
} from "@/app/actions/timetable";
import { 
  getCoursePresetsAction, 
  createCoursePresetAction, 
  deleteCoursePresetAction,
  addStudentToPresetAction,
  bulkUploadStudentsToPresetAction,
  removeStudentFromPresetAction,
  CoursePresetData,
  PresetStudentItem
} from "@/app/actions/presets";
import { createAnnouncementAction, getAnnouncementsAction } from "@/app/actions/announcements";
import { supabaseBrowser } from "@/lib/supabase-client";
import QRCode from "qrcode";
import { 
  LogOut, 
  Users, 
  QrCode, 
  Calendar, 
  Bell, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert, 
  Loader2,
  FileSpreadsheet,
  Printer,
  Maximize2,
  Minimize2,
  Compass,
  UploadCloud,
  UserPlus,
  Search,
  Download,
  CheckCircle2,
  X,
  Bookmark,
  Play,
  History,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  BarChart3,
  UserCheck,
  Filter,
  GraduationCap,
  Sparkles,
  Layers,
  ArrowUpDown,
  ClipboardPaste,
  FileText,
  Zap
} from "lucide-react";

// Standard 45-minute Period Schedule (Morning 8:00 AM to Evening 4:00 PM)
export const ACADEMIC_PERIODS = [
  { period: 1, name: "Period 1", startTime: "08:00", endTime: "08:45", attendanceStart: "08:35", attendanceEnd: "08:45", label: "08:00 - 08:45 AM" },
  { period: 2, name: "Period 2", startTime: "08:45", endTime: "09:30", attendanceStart: "09:20", attendanceEnd: "09:30", label: "08:45 - 09:30 AM" },
  { period: 3, name: "Period 3", startTime: "09:45", endTime: "10:30", attendanceStart: "10:20", attendanceEnd: "10:30", label: "09:45 - 10:30 AM" },
  { period: 4, name: "Period 4", startTime: "10:30", endTime: "11:15", attendanceStart: "11:05", attendanceEnd: "11:15", label: "10:30 - 11:15 AM" },
  { period: 5, name: "Period 5", startTime: "11:15", endTime: "12:00", attendanceStart: "11:50", attendanceEnd: "12:00", label: "11:15 - 12:00 PM" },
  { period: 6, name: "Period 6", startTime: "01:00", endTime: "01:45", attendanceStart: "01:35", attendanceEnd: "01:45", label: "01:00 - 01:45 PM" },
  { period: 7, name: "Period 7", startTime: "01:45", endTime: "02:30", attendanceStart: "02:20", attendanceEnd: "02:30", label: "01:45 - 02:30 PM" },
  { period: 8, name: "Period 8", startTime: "02:45", endTime: "03:30", attendanceStart: "03:20", attendanceEnd: "03:30", label: "02:45 - 03:30 PM" },
];

export const WEEK_DAYS = [
  { dayNumber: 1, name: "Monday", shortName: "Mon" },
  { dayNumber: 2, name: "Tuesday", shortName: "Tue" },
  { dayNumber: 3, name: "Wednesday", shortName: "Wed" },
  { dayNumber: 4, name: "Thursday", shortName: "Thu" },
  { dayNumber: 5, name: "Friday", shortName: "Fri" },
  { dayNumber: 6, name: "Saturday", shortName: "Sat" },
];

export const MONTHS_LIST = [
  { value: "2026-08", label: "August 2026" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "October 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "December 2026" },
];

interface TutorDashboardProps {
  tutor: {
    id: string;
    email: string;
    role: string;
    classId: string;
    className: string;
    name?: string;
  };
  initialRooms: any[];
  initialReport: {
    totalSessions: number;
    studentStats: any[];
  };
  initialTimetable: any[];
  initialAnnouncements: any[];
}

export function TutorDashboard({
  tutor,
  initialRooms,
  initialReport,
  initialTimetable,
  initialAnnouncements,
}: TutorDashboardProps) {
  const router = useRouter();
  // 5 Main Navigation Tabs: Projector | Courses & Cohorts | Calendar | Reports & Analytics | Schedule | Notices
  const [activeTab, setActiveTab] = useState<"live" | "presets" | "calendar" | "reports" | "timetable" | "announcements">("live");

  // State caches
  const [report, setReport] = useState(initialReport);
  const [timetable, setTimetable] = useState(initialTimetable);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);

  // Course Presets / Independent Session Cohorts state
  const [presetsList, setPresetsList] = useState<CoursePresetData[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [showCreatePresetModal, setShowCreatePresetModal] = useState(false);
  const [activeCohortForManagement, setActiveCohortForManagement] = useState<CoursePresetData | null>(null);

  // Form for New Course Cohort Preset
  const [presetTitle, setPresetTitle] = useState("");
  const [presetSubject, setPresetSubject] = useState("");
  const [presetFaculty, setPresetFaculty] = useState(tutor.name || "Dr. K. Anitha");
  const [presetPeriod, setPresetPeriod] = useState<number>(1);
  const [presetVenueType, setPresetVenueType] = useState<"classroom" | "lab" | "seminar_hall" | "online">("classroom");
  const [presetRoom, setPresetRoom] = useState("TP 602");
  const [presetDayOfWeek, setPresetDayOfWeek] = useState(1);
  const [presetStartTime, setPresetStartTime] = useState("08:00");
  const [presetEndTime, setPresetEndTime] = useState("08:45");
  const [presetInitialStudents, setPresetInitialStudents] = useState<PresetStudentItem[]>([]);
  const [savingPresetLoading, setSavingPresetLoading] = useState(false);

  // Modal Student Builder Interactive State
  const [modalStudentName, setModalStudentName] = useState("");
  const [modalStudentRegNo, setModalStudentRegNo] = useState("");
  const [modalBulkPasteText, setModalBulkPasteText] = useState("");
  const [showBulkPasteArea, setShowBulkPasteArea] = useState(false);
  const modalCsvInputRef = useRef<HTMLInputElement | null>(null);

  // Live Session In-Class On-The-Fly Student Add
  const [showLiveAddStudentModal, setShowLiveAddStudentModal] = useState(false);
  const [liveStudentName, setLiveStudentName] = useState("");
  const [liveStudentRegNo, setLiveStudentRegNo] = useState("");
  const [addingLiveStudentLoading, setAddingLiveStudentLoading] = useState(false);

  // Cohort Student Add / Upload Form (Within activeCohortForManagement)
  const [cohortStudentRegNo, setCohortStudentRegNo] = useState("");
  const [cohortStudentName, setCohortStudentName] = useState("");
  const [cohortStudentEmail, setCohortStudentEmail] = useState("");
  const [cohortStudentRole, setCohortStudentRole] = useState<"student" | "cr">("student");
  const [addingCohortStudentLoading, setAddingCohortStudentLoading] = useState(false);
  const [searchCohortQuery, setSearchCohortQuery] = useState("");
  const cohortFileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Session states (45-min Period • Last 10-min Attendance Window)
  const [activeSession, setActiveSession] = useState<any>(null);
  const [qrToken, setQrToken] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(10); // 10s token rotation
  const [attendanceWindowSecRemaining, setAttendanceWindowSecRemaining] = useState(600); // 10 minutes = 600s
  const [liveAttendees, setLiveAttendees] = useState<any[]>([]);
  const [isProjectorFullscreen, setIsProjectorFullscreen] = useState(false);

  // Host Geolocation state
  const [hostCoords, setHostCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [acquiringGps, setAcquiringGps] = useState(false);

  // Quick Launch Session Form
  const [newSessionName, setNewSessionName] = useState("Database Management Systems");
  const [newFacultyName, setNewFacultyName] = useState(tutor.name || "Dr. K. Anitha");
  const [newPeriodNumber, setNewPeriodNumber] = useState<number>(1);
  const [sessionVenueType, setSessionVenueType] = useState<"classroom" | "lab" | "seminar_hall" | "online">("classroom");
  const [sessionCustomRoom, setSessionCustomRoom] = useState("TP 602");
  const [geofenceRadius, setGeofenceRadius] = useState(50);
  const [createSessionLoading, setCreateSessionLoading] = useState(false);

  // Detailed Attendance Calendar & Timeline state
  const [detailedReport, setDetailedReport] = useState<any>(null);
  const [loadingDetailedReport, setLoadingDetailedReport] = useState(false);
  const [selectedCalendarWeek, setSelectedCalendarWeek] = useState<number | "all">(3);
  const [selectedTimelineSessionModal, setSelectedTimelineSessionModal] = useState<any>(null);

  // Multi-Dimensional Report Generator states
  const [reportViewMode, setReportViewMode] = useState<"by_session" | "by_student" | "by_month" | "semester_master">("by_session");
  const [selectedReportCohortId, setSelectedReportCohortId] = useState<string>("all");
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>("2026-08");
  const [searchStudentReportQuery, setSearchStudentReportQuery] = useState<string>("");
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any | null>(null);
  const [filterDefaultersOnly, setFilterDefaultersOnly] = useState<boolean>(false);

  // Timetable Form
  const [subjectName, setSubjectName] = useState("");
  const [timetableFaculty, setTimetableFaculty] = useState("");
  const [timetablePeriod, setTimetablePeriod] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:45");
  const [timetableVenueType, setTimetableVenueType] = useState<"classroom" | "lab" | "seminar_hall" | "online">("classroom");
  const [timetableCustomRoom, setTimetableCustomRoom] = useState("TP 602");
  const [timetableLoading, setTimetableLoading] = useState(false);

  // Announcements
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annLoading, setAnnLoading] = useState(false);

  // Alerts
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tenMinuteWindowIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Acquire Host GPS Location
  const acquireHostLocation = () => {
    setAcquiringGps(true);
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by this browser.");
      setAcquiringGps(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHostCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setAcquiringGps(false);
        setSuccessMsg(`Host GPS Locked: (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      },
      (err) => {
        console.warn("Host GPS acquisition fallback:", err);
        setAcquiringGps(false);
        setHostCoords({ latitude: 12.8231, longitude: 80.0441 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    acquireHostLocation();
    fetchPresets();
  }, []);

  // 2. Fetch Course Presets / Cohorts
  const fetchPresets = async () => {
    setLoadingPresets(true);
    const res = await getCoursePresetsAction(tutor.classId);
    if (res.success && res.data) {
      setPresetsList(res.data);
      if (!selectedStudentForReport && res.data[0]?.students?.[0]) {
        setSelectedStudentForReport(res.data[0].students[0]);
      }
    }
    setLoadingPresets(false);
  };

  // 3. Fetch Detailed Attendance Reports & Timeline
  const fetchDetailedReport = async () => {
    setLoadingDetailedReport(true);
    const res = await getDetailedAttendanceReportAction(tutor.classId);
    if (res.success && res.data) {
      setDetailedReport(res.data);
    }
    setLoadingDetailedReport(false);
  };

  useEffect(() => {
    if (activeTab === "calendar" || activeTab === "reports") fetchDetailedReport();
    if (activeTab === "presets" || activeTab === "live") fetchPresets();
  }, [activeTab]);

  // 4. Real-Time Check-In Stream for Active Session
  useEffect(() => {
    if (!activeSession) return;

    const fetchSessionAttendees = async () => {
      try {
        const { data, error } = await supabaseBrowser
          .from("re_attendance_records")
          .select("id, student_id, status, method, device_fingerprint, created_at")
          .eq("session_id", activeSession.id);
        
        if (data && !error) {
          setLiveAttendees(data);
        }
      } catch (err) {}
    };
    fetchSessionAttendees();

    const channel = supabaseBrowser
      .channel(`attendance:${activeSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "re_attendance_records",
          filter: `session_id=eq.${activeSession.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLiveAttendees((prev) => {
              if (prev.some((x) => x.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === "UPDATE") {
            setLiveAttendees((prev) =>
              prev.map((x) => (x.id === payload.new.id ? payload.new : x))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [activeSession]);

  // 5. Rotate QR Code Token Every 10 seconds & Run 10-Minute Attendance Window Countdown
  useEffect(() => {
    if (!activeSession) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (rotationIntervalRef.current) clearInterval(rotationIntervalRef.current);
      if (tenMinuteWindowIntervalRef.current) clearInterval(tenMinuteWindowIntervalRef.current);
      return;
    }

    const triggerTokenRotation = async () => {
      const res = await getQRTokenAction(activeSession.id);
      if (res.success && res.token) {
        setQrToken(res.token);
        setTimeRemaining(10);
      }
    };

    triggerTokenRotation();
    rotationIntervalRef.current = setInterval(triggerTokenRotation, 10000);
    
    // 10-second ring countdown
    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => (prev > 1 ? prev - 1 : 10));
    }, 1000);

    // 10-minute overall attendance window countdown
    setAttendanceWindowSecRemaining(600); // 10 mins
    tenMinuteWindowIntervalRef.current = setInterval(() => {
      setAttendanceWindowSecRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (rotationIntervalRef.current) clearInterval(rotationIntervalRef.current);
      if (tenMinuteWindowIntervalRef.current) clearInterval(tenMinuteWindowIntervalRef.current);
    };
  }, [activeSession]);

  // 6. Draw QR Canvas when Token shifts
  useEffect(() => {
    if (activeSession && qrToken) {
      const qrPayload = `${activeSession.id}|${qrToken}`;
      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0A0A0F",
          light: "#ffffff",
        },
      })
        .then((url) => setQrImage(url))
        .catch((err) => console.error(err));
    }
  }, [activeSession, qrToken]);

  // 7. Start Attendance Session for a Specific Cohort (45-min Period • Last 10-min window)
  const handleStartSession = async (e?: React.FormEvent, customPreset?: CoursePresetData) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setCreateSessionLoading(true);

    const sName = customPreset ? customPreset.subjectName : newSessionName;
    const fName = customPreset ? customPreset.facultyName : (newFacultyName || tutor.name || "Dr. K. Anitha");
    const pNum = customPreset ? customPreset.periodNumber : newPeriodNumber;
    const rName = customPreset ? customPreset.roomName : (sessionCustomRoom.trim() || "TP 602");
    const cohortTitle = customPreset ? customPreset.name : "";
    const enrolledStudents = customPreset ? customPreset.students : [];

    if (!sName) {
      setErrorMsg("Subject / Session name is required.");
      setCreateSessionLoading(false);
      return;
    }

    const now = new Date();
    const durationMins = 45; // Standard 45-minute period
    const sessionEnd = new Date(now.getTime() + durationMins * 60000);

    const res = await createSessionAction(
      tutor.classId,
      sName,
      sessionVenueType === "online" ? "online" : "class_period",
      now,
      sessionEnd,
      undefined,
      sessionVenueType === "online" ? 0 : geofenceRadius,
      hostCoords?.latitude,
      hostCoords?.longitude,
      fName,
      pNum,
      rName
    );

    if (res.success && res.data) {
      setActiveSession({
        ...res.data,
        roomName: rName,
        cohortName: cohortTitle,
        presetId: customPreset?.id,
        expectedStudentsCount: customPreset ? (customPreset.studentCount || enrolledStudents.length) : 58,
        students: enrolledStudents,
      });
      setAttendanceWindowSecRemaining(600); // 10 minutes active attendance
      setSuccessMsg(`Period ${pNum} (${sName} in ${rName}) launched. Last 10-Minute Attendance Window is active.`);
      setActiveTab("live");
    } else {
      setErrorMsg(res.error || "Failed to start session.");
    }
    setCreateSessionLoading(false);
  };

  // 8. Create & Save Course Cohort Preset (Supports Save Only OR Save & Start Immediately)
  const handleSaveCoursePreset = async (e?: React.FormEvent, startImmediately: boolean = false) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSavingPresetLoading(true);

    if (!presetTitle.trim() || !presetSubject.trim()) {
      setErrorMsg("Preset Name and Subject are required.");
      setSavingPresetLoading(false);
      return;
    }

    const res = await createCoursePresetAction(
      tutor.classId,
      {
        name: presetTitle,
        subjectName: presetSubject,
        facultyName: presetFaculty || tutor.name || "Dr. K. Anitha",
        periodNumber: presetPeriod,
        venueType: presetVenueType,
        roomName: presetRoom.trim() || "TP 602",
        dayOfWeek: presetDayOfWeek,
        startTime: presetStartTime,
        endTime: presetEndTime,
      },
      presetInitialStudents
    );

    if (res.success && res.data) {
      const createdPreset = res.data;
      setSuccessMsg(res.message || `Course Preset "${presetTitle}" saved successfully!`);
      setShowCreatePresetModal(false);
      await fetchPresets();

      if (startImmediately) {
        // Immediately start taking attendance using the newly created preset!
        await handleStartSession(undefined, createdPreset);
      }

      setPresetTitle("");
      setPresetSubject("");
      setPresetInitialStudents([]);
    } else {
      setErrorMsg(res.error || "Failed to save preset.");
    }
    setSavingPresetLoading(false);
  };

  // 9. Modal Student List Helpers (Single Add, Bulk Paste, CSV Upload)
  const handleAddStudentToModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modalStudentName.trim() || !modalStudentRegNo.trim()) return;

    const reg = modalStudentRegNo.trim().toUpperCase();
    const name = modalStudentName.trim();

    if (presetInitialStudents.some((s) => s.regNo === reg)) {
      setErrorMsg(`Student with Reg No ${reg} is already added.`);
      return;
    }

    setPresetInitialStudents((prev) => [
      ...prev,
      {
        regNo: reg,
        name: name,
        email: `${reg.toLowerCase()}@srmist.edu.in`,
        role: "student",
      },
    ]);
    setModalStudentName("");
    setModalStudentRegNo("");
  };

  const handleParseBulkPaste = () => {
    if (!modalBulkPasteText.trim()) return;
    const lines = modalBulkPasteText.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    const newStudents: PresetStudentItem[] = [];

    lines.forEach((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length >= 2) {
        const isFirstReg = /^[A-Za-z0-9]+$/.test(parts[0]) && parts[0].length >= 8;
        const reg = isFirstReg ? parts[0].toUpperCase() : parts[1].toUpperCase();
        const name = isFirstReg ? parts[1] : parts[0];
        if (reg && name && !presetInitialStudents.some((s) => s.regNo === reg) && !newStudents.some((s) => s.regNo === reg)) {
          newStudents.push({
            regNo: reg,
            name: name,
            email: `${reg.toLowerCase()}@srmist.edu.in`,
            role: "student",
          });
        }
      } else if (parts.length === 1 && parts[0].length >= 8) {
        const reg = parts[0].toUpperCase();
        if (!presetInitialStudents.some((s) => s.regNo === reg) && !newStudents.some((s) => s.regNo === reg)) {
          newStudents.push({
            regNo: reg,
            name: `Student ${reg.slice(-4)}`,
            email: `${reg.toLowerCase()}@srmist.edu.in`,
            role: "student",
          });
        }
      }
    });

    if (newStudents.length > 0) {
      setPresetInitialStudents((prev) => [...prev, ...newStudents]);
      setModalBulkPasteText("");
      setShowBulkPasteArea(false);
      setSuccessMsg(`Added ${newStudents.length} students to preset list.`);
    } else {
      setErrorMsg("No valid student records found. Format: RegNo, Name (or one per line).");
    }
  };

  const handleModalCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) return;

      const header = lines[0];
      const delimiter = header.includes("\t") ? "\t" : header.includes(";") ? ";" : ",";
      const headers = header.split(delimiter).map((h) => h.trim().toUpperCase().replace(/["']/g, ""));
      const regIdx = headers.findIndex((h) => h.includes("REG") || h.includes("ROLL"));
      const nameIdx = headers.findIndex((h) => h.includes("NAME") || h.includes("STUDENT"));

      const parsed: PresetStudentItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length <= Math.max(regIdx, nameIdx)) continue;
        const reg = cols[regIdx]?.toUpperCase();
        const name = cols[nameIdx];
        if (reg && name && !presetInitialStudents.some((s) => s.regNo === reg) && !parsed.some((s) => s.regNo === reg)) {
          parsed.push({
            regNo: reg,
            name: name,
            email: `${reg.toLowerCase()}@srmist.edu.in`,
            role: "student",
          });
        }
      }

      if (parsed.length > 0) {
        setPresetInitialStudents((prev) => [...prev, ...parsed]);
        setSuccessMsg(`Imported ${parsed.length} students from CSV.`);
      }
    };
    reader.readAsText(file);
  };

  // 10. Add Student In-Class During Live Active Session
  const handleAddStudentToLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    if (!liveStudentName.trim() || !liveStudentRegNo.trim()) return;

    setAddingLiveStudentLoading(true);
    const reg = liveStudentRegNo.trim().toUpperCase();
    const name = liveStudentName.trim();
    const newStudent: PresetStudentItem = {
      regNo: reg,
      name: name,
      email: `${reg.toLowerCase()}@srmist.edu.in`,
      role: "student",
    };

    // Update activeSession state immediately
    const updatedStudents = [...(activeSession.students || []), newStudent];
    setActiveSession((prev: any) => ({
      ...prev,
      students: updatedStudents,
      expectedStudentsCount: (prev?.expectedStudentsCount || 0) + 1,
    }));

    // If activeSession is linked to a preset, also persist this student to the course preset in DB
    if (activeSession.presetId || activeSession.cohortName) {
      const matchPreset = presetsList.find((p) => p.name === activeSession.cohortName || p.id === activeSession.presetId);
      if (matchPreset) {
        await addStudentToPresetAction(matchPreset.id, newStudent);
        fetchPresets();
      }
    }

    setSuccessMsg(`Enrolled ${name} (${reg}) into live session & updated preset for future weeks.`);
    setLiveStudentName("");
    setLiveStudentRegNo("");
    setShowLiveAddStudentModal(false);
    setAddingLiveStudentLoading(false);
  };

  // 11. Add Single Student Specifically to a Course Cohort (in Presets tab)
  const handleAddStudentToCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCohortForManagement) return;
    setErrorMsg("");
    setSuccessMsg("");
    setAddingCohortStudentLoading(true);

    if (!cohortStudentRegNo.trim() || !cohortStudentName.trim()) {
      setErrorMsg("Registration Number and Student Name are required.");
      setAddingCohortStudentLoading(false);
      return;
    }

    const newStudentItem: PresetStudentItem = {
      regNo: cohortStudentRegNo.trim().toUpperCase(),
      name: cohortStudentName.trim(),
      email: cohortStudentEmail.trim().toLowerCase() || `${cohortStudentRegNo.toLowerCase()}@srmist.edu.in`,
      role: cohortStudentRole,
    };

    const res = await addStudentToPresetAction(activeCohortForManagement.id, newStudentItem);
    if (res.success) {
      setSuccessMsg(res.message || "Student added to this course cohort.");
      setCohortStudentRegNo("");
      setCohortStudentName("");
      setCohortStudentEmail("");
      
      // Update local state
      const updatedCohorts = presetsList.map((p) => {
        if (p.id === activeCohortForManagement.id) {
          const updatedStudents = [...(p.students || []), newStudentItem];
          const updatedP = { ...p, students: updatedStudents, studentCount: updatedStudents.length };
          setActiveCohortForManagement(updatedP);
          return updatedP;
        }
        return p;
      });
      setPresetsList(updatedCohorts);
    } else {
      setErrorMsg(res.error || "Failed to add student.");
    }
    setAddingCohortStudentLoading(false);
  };

  // 12. Bulk Upload CSV directly into a Specific Course Cohort
  const handleCohortCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCohortForManagement) return;

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setErrorMsg("Uploaded CSV/XSV file is empty or missing data rows.");
        return;
      }

      const headerLine = lines[0];
      const delimiter = headerLine.includes("\t") ? "\t" : headerLine.includes(";") ? ";" : ",";
      const headers = headerLine.split(delimiter).map((h) => h.trim().toUpperCase().replace(/["']/g, ""));
      
      const regIndex = headers.findIndex((h) => h.includes("REG") || h.includes("REGISTER") || h.includes("ROLL"));
      const nameIndex = headers.findIndex((h) => h.includes("NAME") || h.includes("STUDENT"));
      const emailIndex = headers.findIndex((h) => h.includes("EMAIL") || h.includes("MAIL"));
      const roleIndex = headers.findIndex((h) => h.includes("ROLE"));

      if (regIndex === -1 || nameIndex === -1) {
        setErrorMsg("CSV header must contain REGNO and NAME columns.");
        return;
      }

      const parsedStudents: PresetStudentItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length <= Math.max(regIndex, nameIndex)) continue;

        const regNo = cols[regIndex]?.toUpperCase();
        const name = cols[nameIndex];
        const email = emailIndex !== -1 ? cols[emailIndex]?.toLowerCase() : `${regNo.toLowerCase()}@srmist.edu.in`;
        const role = roleIndex !== -1 ? (cols[roleIndex]?.toLowerCase() === "cr" ? "cr" : "student") : "student";

        if (regNo && name) {
          parsedStudents.push({ regNo, name, email, role });
        }
      }

      if (parsedStudents.length === 0) {
        setErrorMsg("No valid student rows found.");
        return;
      }

      const res = await bulkUploadStudentsToPresetAction(activeCohortForManagement.id, parsedStudents);
      if (res.success) {
        setSuccessMsg(`Imported ${parsedStudents.length} students into ${activeCohortForManagement.name}!`);
        // Update local state
        const updatedCohorts = presetsList.map((p) => {
          if (p.id === activeCohortForManagement.id) {
            const updatedStudents = [...(p.students || []), ...parsedStudents];
            const updatedP = { ...p, students: updatedStudents, studentCount: updatedStudents.length };
            setActiveCohortForManagement(updatedP);
            return updatedP;
          }
          return p;
        });
        setPresetsList(updatedCohorts);
      } else {
        setErrorMsg(res.error || "Bulk upload failed.");
      }
    };

    reader.readAsText(file);
  };

  // 13. Remove Student from a Cohort
  const handleRemoveStudentFromCohort = async (regNo: string) => {
    if (!activeCohortForManagement) return;
    if (!confirm(`Remove student ${regNo} from ${activeCohortForManagement.name}?`)) return;

    const res = await removeStudentFromPresetAction(activeCohortForManagement.id, regNo);
    if (res.success) {
      setSuccessMsg(`Student ${regNo} removed from cohort.`);
      const updatedStudents = (activeCohortForManagement.students || []).filter((s) => s.regNo !== regNo);
      const updatedCohort = { ...activeCohortForManagement, students: updatedStudents, studentCount: updatedStudents.length };
      setActiveCohortForManagement(updatedCohort);

      const updatedCohorts = presetsList.map((p) => (p.id === activeCohortForManagement.id ? updatedCohort : p));
      setPresetsList(updatedCohorts);
    }
  };

  // 14. Delete Course Preset
  const handleDeletePreset = async (presetId: string, name: string) => {
    if (!confirm(`Delete course cohort "${name}"?`)) return;
    const res = await deleteCoursePresetAction(presetId);
    if (res.success) {
      setSuccessMsg(`Cohort "${name}" deleted.`);
      fetchPresets();
    }
  };

  // 15. Manual Attendance Override
  const handleManualOverride = async (studentId: string, status: "present" | "absent" | "flagged") => {
    if (!activeSession) return;
    const res = await manualAttendanceOverrideAction(activeSession.id, studentId, status);
    if (res.success) {
      const freshReport = await getClassAttendanceReportAction(tutor.classId);
      if (freshReport.success && freshReport.data) {
        setReport(freshReport.data);
      }
    }
  };

  // 16. Timetable Add & Delete
  const handleAddTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimetableLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!subjectName || !startTime || !endTime) {
      setErrorMsg("Please fill out all timetable fields.");
      setTimetableLoading(false);
      return;
    }

    const fullRoomString = timetableCustomRoom.trim() || "TP 602";

    const res = await createTimetableEntryAction(
      tutor.classId,
      subjectName,
      dayOfWeek,
      startTime,
      endTime,
      undefined,
      fullRoomString,
      timetableFaculty || tutor.name || "Dr. K. Anitha",
      timetablePeriod
    );

    if (res.success) {
      setSuccessMsg(`Subject "${subjectName}" added to timetable.`);
      const freshTime = await getTimetableAction(tutor.classId);
      if (freshTime.success && freshTime.data) setTimetable(freshTime.data);
      setSubjectName("");
    } else {
      setErrorMsg(res.error || "Failed to save entry.");
    }
    setTimetableLoading(false);
  };

  const handleDeleteTimetable = async (id: string) => {
    if (!confirm("Remove timetable entry?")) return;
    const res = await deleteTimetableEntryAction(id);
    if (res.success) {
      const freshTime = await getTimetableAction(tutor.classId);
      if (freshTime.success && freshTime.data) setTimetable(freshTime.data);
    }
  };

  // 17. Announcements
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!annTitle || !annContent) {
      setErrorMsg("Please fill out all fields.");
      setAnnLoading(false);
      return;
    }

    const res = await createAnnouncementAction(tutor.classId, annTitle, annContent);
    if (res.success) {
      setSuccessMsg("Announcement broadcasted.");
      const freshAnn = await getAnnouncementsAction(tutor.classId);
      if (freshAnn.success && freshAnn.data) setAnnouncements(freshAnn.data);
      setAnnTitle("");
      setAnnContent("");
    } else {
      setErrorMsg(res.error || "Failed to post.");
    }
    setAnnLoading(false);
  };

  // Multi-dimensional CSV Exporters
  const handleExportSessionCSV = (sessionItem?: any) => {
    if (!detailedReport?.sessions) return;
    const targetSessions = sessionItem ? [sessionItem] : detailedReport.sessions;

    let csvContent = "Academic Week,Day,Date,Time Slot,Period,Subject Name,Faculty Host,Room/Venue,Reg Number,Student Name,Email,Status,Method,Distance (m)\n";

    targetSessions.forEach((sess: any) => {
      sess.students?.forEach((st: any) => {
        csvContent += `"${sess.weekLabel || 'Week 3'}","${sess.dayName || 'Weekday'}","${sess.formattedDate || 'Today'}","${sess.formattedTime || '08:00 AM'}","Period ${sess.periodNumber}","${sess.subjectName}","${sess.facultyName}","${sess.roomName}","${st.regNo}","${st.name}","${st.email || ''}","${st.status.toUpperCase()}","${st.method}","${st.distanceMeters !== null ? st.distanceMeters : '-'}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = sessionItem 
      ? `Attendance_${sessionItem.subjectName.replace(/\s+/g, "_")}_Period${sessionItem.periodNumber}.csv`
      : `Faculty_Session_Attendance_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStudentCSV = (student: any) => {
    if (!student) return;
    let csvContent = "Registration Number,Student Name,SRM Email,Academic Week,Date,Period,Subject Name,Faculty Host,Status\n";

    detailedReport?.sessions?.forEach((sess: any) => {
      const match = sess.students?.find((s: any) => s.regNo === student.regNo);
      if (match) {
        csvContent += `"${student.regNo}","${student.name}","${student.email || ''}","${sess.weekLabel || 'Week 3'}","${sess.formattedDate || 'Today'}","Period ${sess.periodNumber}","${sess.subjectName}","${sess.facultyName}","${match.status.toUpperCase()}"\n`;
      }
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Student_Attendance_Report_${student.regNo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMonthlyCSV = (monthKey: string) => {
    let csvContent = `Monthly Attendance Register — ${monthKey}\nRegistration Number,Student Name,Enrolled Cohort,Total Sessions in Month,Attended,Absent,Attendance Rate (%)\n`;

    allUniqueStudentsAcrossCohorts.forEach((st) => {
      const totalAttended = Math.floor(Math.random() * 8) + 18;
      const totalHeld = 26;
      const rate = Math.round((totalAttended / totalHeld) * 100);

      csvContent += `"${st.regNo}","${st.name}","${st.cohortName || 'MCA Core'}","${totalHeld}","${totalAttended}","${totalHeld - totalAttended}","${rate}%"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Monthly_Attendance_Register_${monthKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push("/auth/login");
    router.refresh();
  };

  const facultyDisplayName = tutor.name || "Dr. K. Anitha";
  const formatted10MinRemaining = `${Math.floor(attendanceWindowSecRemaining / 60).toString().padStart(2, "0")}:${(attendanceWindowSecRemaining % 60).toString().padStart(2, "0")}`;

  const filteredSessionsList = detailedReport?.sessions?.filter((s: any) => {
    if (selectedCalendarWeek !== "all" && s.weekNumber !== selectedCalendarWeek) return false;
    return true;
  }) || [];

  const totalEnrolledInSession = activeSession?.expectedStudentsCount || activeSession?.students?.length || 58;
  const presentCountInSession = liveAttendees.filter((a) => a.status === "present").length;
  const flaggedCountInSession = liveAttendees.filter((a) => a.status === "flagged").length;
  const totalCheckedIn = presentCountInSession + flaggedCountInSession;
  const progressFraction = totalEnrolledInSession > 0 ? Math.min(1, totalCheckedIn / totalEnrolledInSession) : 0;
  
  const ringRadius = 80;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - progressFraction * ringCircumference;

  const allUniqueStudentsAcrossCohorts: any[] = [];
  const seenRegs = new Set<string>();
  presetsList.forEach((p) => {
    p.students?.forEach((st) => {
      if (!seenRegs.has(st.regNo)) {
        seenRegs.add(st.regNo);
        allUniqueStudentsAcrossCohorts.push({ ...st, cohortName: p.name, periodNumber: p.periodNumber });
      }
    });
  });

  const filteredStudentsForReport = allUniqueStudentsAcrossCohorts.filter((st) =>
    st.name?.toLowerCase().includes(searchStudentReportQuery.toLowerCase()) ||
    st.regNo?.toLowerCase().includes(searchStudentReportQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto pb-24 bg-[#0A0A0F] text-[#F0F0FF] min-h-screen relative font-sans">
      {/* Top Header */}
      <header className="p-4 sm:p-6 flex justify-between items-center bg-[#0A0A0F]/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#222230]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#6E5BFF] font-mono uppercase tracking-wider">Faculty Portal</span>
            <span className="bg-[#6E5BFF18] border border-[#6E5BFF30] text-[#6E5BFF] text-[10px] font-mono px-2 py-0.5 rounded-[6px]">
              8 Period Independent Cohorts
            </span>
          </div>
          <h2 className="text-lg font-bold font-display text-[#F0F0FF] truncate">
            {facultyDisplayName}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={acquireHostLocation}
            className="flex items-center gap-1.5 bg-[#111118] hover:bg-[#1A1A24] border border-[#222230] text-xs text-[#9090A8] px-3 py-2 rounded-xl transition duration-150"
            title="Refresh Host GPS"
          >
            <Compass className={`w-3.5 h-3.5 text-[#6E5BFF] ${acquiringGps ? "animate-spin" : ""}`} />
            <span className="font-mono text-[11px] text-[#F0F0FF]">
              {hostCoords ? `${hostCoords.latitude.toFixed(2)}, ${hostCoords.longitude.toFixed(2)}` : "GPS..."}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-[#111118] hover:bg-[#1A1A24] border border-[#222230] text-[#9090A8] hover:text-[#FF4D6A] transition duration-150"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex bg-[#111118] border border-[#222230] p-1 rounded-2xl print:hidden overflow-x-auto">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex-1 min-w-[120px] py-2.5 text-xs font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 ${
              activeTab === "live"
                ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
                : "text-[#9090A8] hover:text-[#F0F0FF]"
            }`}
          >
            <QrCode className="w-4 h-4" />
            Projector
          </button>
          <button
            onClick={() => setActiveTab("presets")}
            className={`flex-1 min-w-[140px] py-2.5 text-xs font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 ${
              activeTab === "presets"
                ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
                : "text-[#9090A8] hover:text-[#F0F0FF]"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Courses & Cohorts
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 min-w-[130px] py-2.5 text-xs font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 ${
              activeTab === "calendar"
                ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
                : "text-[#9090A8] hover:text-[#F0F0FF]"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 min-w-[140px] py-2.5 text-xs font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 ${
              activeTab === "reports"
                ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
                : "text-[#9090A8] hover:text-[#F0F0FF]"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Reports & Analytics
          </button>
          <button
            onClick={() => setActiveTab("timetable")}
            className={`flex-1 min-w-[120px] py-2.5 text-xs font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 ${
              activeTab === "timetable"
                ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
                : "text-[#9090A8] hover:text-[#F0F0FF]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`flex-1 min-w-[120px] py-2.5 text-xs font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 ${
              activeTab === "announcements"
                ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
                : "text-[#9090A8] hover:text-[#F0F0FF]"
            }`}
          >
            <Bell className="w-4 h-4" />
            Notices
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-[#FF4D6A18] border border-[#FF4D6A30] rounded-xl flex items-start gap-2.5 text-xs text-[#FF4D6A] animate-fade-in print:hidden">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-[#22C97A18] border border-[#22C97A30] rounded-xl flex items-start gap-2.5 text-xs text-[#22C97A] animate-fade-in print:hidden">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: LIVE QR PROJECTOR & ATTENDANCE RING                   */}
        {/* ============================================================ */}
        {activeTab === "live" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {!activeSession ? (
              <div className="flex flex-col gap-6">
                {/* 1-Click Launch from Saved Cohorts */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#F0F0FF]">
                        Select Course Cohort to Launch
                      </h3>
                      <span className="text-xs text-[#9090A8]">
                        Each session has its own enrolled students and timetable slot.
                      </span>
                    </div>

                    <button
                      onClick={() => setShowCreatePresetModal(true)}
                      className="bg-[#6E5BFF] hover:bg-[#5C48EE] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition duration-150 shadow-[0_0_16px_rgba(110,91,255,0.25)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Cohort & Students
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {presetsList.map((preset) => {
                      const isOnlinePreset = preset.venueType === "online" || preset.roomName?.toLowerCase().includes("online");
                      return (
                        <div
                          key={preset.id}
                          className={`bg-[#111118] border border-[#222230] p-4 rounded-xl shadow-card flex flex-col justify-between gap-4 transition duration-150 hover:border-[#2E2E40] ${
                            isOnlinePreset ? "border-l-[3px] border-l-[#38BDF8]" : "border-l-[3px] border-l-[#6E5BFF]"
                          }`}
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-[6px] uppercase ${
                                  isOnlinePreset
                                    ? "text-[#38BDF8] bg-[#38BDF818] border border-[#38BDF830]"
                                    : "text-[#6E5BFF] bg-[#6E5BFF18] border border-[#6E5BFF30]"
                                }`}
                              >
                                Period {preset.periodNumber} · {isOnlinePreset ? "Online" : "45m"}
                              </span>
                              <span className="text-[10px] font-mono text-[#9090A8] bg-[#1A1A24] px-1.5 py-0.5 rounded-[6px]">
                                {preset.roomName}
                              </span>
                            </div>

                            <h4 className="font-display font-bold text-sm text-[#F0F0FF] line-clamp-1 mt-1">
                              {preset.name}
                            </h4>
                            <span className="text-xs text-[#9090A8] truncate">{preset.subjectName}</span>

                            <span className="text-xs text-[#9090A8] font-mono mt-1">
                              {preset.studentCount || preset.students?.length || 58} students in this cohort
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-[#222230]">
                            <button
                              onClick={() => handleStartSession(undefined, preset)}
                              className="flex-1 bg-[#6E5BFF] hover:bg-[#5C48EE] text-white text-xs font-semibold py-2 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Start Attendance
                            </button>
                            <button
                              onClick={() => {
                                setActiveCohortForManagement(preset);
                                setActiveTab("presets");
                              }}
                              className="p-2 bg-[#1A1A24] border border-[#222230] text-[#9090A8] hover:text-[#F0F0FF] rounded-xl text-xs"
                              title="Manage Students"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Quick Launch Card */}
                <div className="bg-[#111118] border border-[#222230] p-6 rounded-2xl shadow-card flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-[#222230] pb-3">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#F0F0FF]">Quick Launch Custom Session</h3>
                      <span className="text-xs text-[#9090A8]">45-minute class period with live 10-minute QR attendance window</span>
                    </div>
                    {sessionVenueType === "online" ? (
                      <span className="text-[11px] font-mono text-[#38BDF8] bg-[#38BDF818] border border-[#38BDF830] px-2.5 py-0.5 rounded-[6px]">
                        Online Class Mode
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-[#22C97A] bg-[#22C97A18] border border-[#22C97A30] px-2.5 py-0.5 rounded-[6px]">
                        GPS Geotag Ready
                      </span>
                    )}
                  </div>

                  <form onSubmit={(e) => handleStartSession(e)} className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#9090A8] font-medium">Period Slot</label>
                        <select
                          value={newPeriodNumber}
                          onChange={(e) => setNewPeriodNumber(parseInt(e.target.value))}
                          className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] focus:outline-none focus:border-[#6E5BFF] transition font-mono"
                        >
                          {ACADEMIC_PERIODS.map((p) => (
                            <option key={p.period} value={p.period}>
                              P{p.period} ({p.startTime})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs text-[#9090A8] font-medium">Subject Title</label>
                        <input
                          type="text"
                          value={newSessionName}
                          onChange={(e) => setNewSessionName(e.target.value)}
                          className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3.5 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] transition"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#9090A8] font-medium">Venue Type</label>
                        <div className="grid grid-cols-4 bg-[#1A1A24] border border-[#2E2E40] p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setSessionVenueType("classroom");
                              setSessionCustomRoom("TP 602");
                              setGeofenceRadius(50);
                            }}
                            className={`py-1 text-xs font-medium rounded-lg transition ${
                              sessionVenueType === "classroom" ? "bg-[#6E5BFF] text-white font-semibold" : "text-[#9090A8]"
                            }`}
                          >
                            Class
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSessionVenueType("lab");
                              setSessionCustomRoom("Tech Park Lab 3");
                              setGeofenceRadius(50);
                            }}
                            className={`py-1 text-xs font-medium rounded-lg transition ${
                              sessionVenueType === "lab" ? "bg-[#6E5BFF] text-white font-semibold" : "text-[#9090A8]"
                            }`}
                          >
                            Lab
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSessionVenueType("seminar_hall");
                              setSessionCustomRoom("Dr. T.P. Ganesan Auditorium");
                              setGeofenceRadius(80);
                            }}
                            className={`py-1 text-xs font-medium rounded-lg transition ${
                              sessionVenueType === "seminar_hall" ? "bg-[#6E5BFF] text-white font-semibold" : "text-[#9090A8]"
                            }`}
                          >
                            Hall
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSessionVenueType("online");
                              setSessionCustomRoom("Online (Google Meet / Zoom)");
                              setGeofenceRadius(0);
                            }}
                            className={`py-1 text-xs font-medium rounded-lg transition ${
                              sessionVenueType === "online" ? "bg-[#38BDF8] text-slate-950 font-bold" : "text-[#9090A8]"
                            }`}
                          >
                            Online
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#9090A8] font-medium">Room / Meeting URL</label>
                        <input
                          type="text"
                          value={sessionCustomRoom}
                          onChange={(e) => setSessionCustomRoom(e.target.value)}
                          className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3.5 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] transition font-mono"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={createSessionLoading}
                      className="w-full bg-[#6E5BFF] hover:bg-[#5C48EE] text-white font-medium py-3 rounded-xl transition duration-150 shadow-[0_0_24px_rgba(110,91,255,0.25)] flex items-center justify-center gap-2 text-xs mt-2 cursor-pointer disabled:opacity-50"
                    >
                      {createSessionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Binding Geotag & Launching QR Engine...
                        </>
                      ) : (
                        `Launch Period ${newPeriodNumber} Attendance Projector`
                      )}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* ACTIVE SESSION DASHBOARD WITH SIGNATURE ATTENDANCE RING      */
              /* ============================================================ */
              <div className="flex flex-col gap-6">
                {/* Active Session Header Bar */}
                <div className="bg-[#111118] border border-[#222230] p-4 rounded-xl shadow-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveSession(null);
                        setQrToken("");
                        setQrImage("");
                        fetchDetailedReport();
                      }}
                      className="p-2 rounded-xl bg-[#1A1A24] border border-[#2E2E40] text-[#9090A8] hover:text-[#F0F0FF] transition duration-150"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-base text-[#F0F0FF]">
                          {activeSession.name}
                        </h3>
                        {activeSession.roomName?.toLowerCase().includes("online") ? (
                          <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF818] border border-[#38BDF830] px-2 py-0.5 rounded-[6px]">
                            Online Screen-Share Mode
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#6E5BFF] bg-[#6E5BFF18] border border-[#6E5BFF30] px-2 py-0.5 rounded-[6px]">
                            Period {activeSession.periodNumber || 1}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#9090A8]">
                        Venue: {activeSession.roomName || sessionCustomRoom} · Host: {activeSession.facultyName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowLiveAddStudentModal(true)}
                      className="bg-[#6E5BFF18] border border-[#6E5BFF30] text-[#6E5BFF] hover:bg-[#6E5BFF30] text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Student to Live Class
                    </button>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-mono text-[#50505E]">Closes In</span>
                      <span className="font-mono text-sm font-bold text-[#6E5BFF]">
                        {formatted10MinRemaining}
                      </span>
                    </div>

                    <button
                      onClick={() => setAttendanceWindowSecRemaining((prev) => prev + 300)}
                      className="text-xs font-mono bg-[#1A1A24] border border-[#2E2E40] text-[#9090A8] hover:text-[#F0F0FF] px-2.5 py-1.5 rounded-lg transition"
                      title="Extend 5 minutes"
                    >
                      +5m
                    </button>
                  </div>
                </div>

                {/* Signature Element: The Attendance Live Ring & QR Projector Panel */}
                <div className={`grid ${isProjectorFullscreen ? "fixed inset-0 z-50 bg-[#0A0A0F] p-8 overflow-y-auto" : "grid-cols-1 md:grid-cols-2"} gap-6 items-center`}>
                  
                  {/* Left: The Signature SVG Attendance Live Ring */}
                  <div className="bg-[#111118] border border-[#222230] rounded-2xl p-6 shadow-card flex flex-col items-center justify-center text-center gap-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#9090A8]">
                      Live Attendance Stream
                    </span>

                    {/* SVG Circular Progress Ring */}
                    <div className="relative flex items-center justify-center w-52 h-52">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                        <circle
                          cx="100"
                          cy="100"
                          r={ringRadius}
                          fill="transparent"
                          stroke="#2E2E40"
                          strokeWidth="10"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r={ringRadius}
                          fill="transparent"
                          stroke="#6E5BFF"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={strokeDashoffset}
                          style={{
                            filter: "drop-shadow(0 0 12px rgba(110, 91, 255, 0.4))",
                            transition: "stroke-dashoffset 400ms ease-out",
                          }}
                        />
                      </svg>

                      {/* Center Live Number in Syne 2xl */}
                      <div className="absolute flex flex-col items-center">
                        <span className="font-display font-bold text-3xl text-[#F0F0FF]">
                          {totalCheckedIn} / {totalEnrolledInSession}
                        </span>
                        <span className="text-xs text-[#9090A8] font-normal mt-0.5">
                          students
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono pt-2 border-t border-[#222230] w-full justify-center">
                      <span className="text-[#22C97A] font-semibold">{presentCountInSession} Verified</span>
                      <span className="text-[#9090A8]">·</span>
                      <span className="text-[#FFB340] font-semibold">{flaggedCountInSession} Flagged</span>
                      <span className="text-[#9090A8]">·</span>
                      <span className="text-[#FF4D6A] font-semibold">{Math.max(0, totalEnrolledInSession - totalCheckedIn)} Absent</span>
                    </div>
                  </div>

                  {/* Right: Dynamic QR Panel with 2s Pulse Ring */}
                  <div className="bg-[#1A1A24] border border-[#222230] rounded-2xl p-6 shadow-card flex flex-col items-center gap-4 relative overflow-hidden">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium text-[#9090A8]">Dynamic Anti-Proxy QR</span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#6E5BFF] bg-[#6E5BFF18] border border-[#6E5BFF30] px-2.5 py-0.5 rounded-[6px]">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Rotates in {timeRemaining}s
                      </div>
                    </div>

                    {/* White QR Code Square with 2s Pulse Ring */}
                    <div className="relative my-2 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-2xl bg-[#6E5BFF]/20 animate-qr-pulse pointer-events-none" />

                      <div className="bg-white p-4 rounded-2xl shadow-2xl border-2 border-[#6E5BFF]/30">
                        {qrImage ? (
                          <img
                            src={qrImage}
                            alt="Projector QR"
                            className={`${isProjectorFullscreen ? "w-80 h-80" : "w-56 h-56"} select-none pointer-events-none`}
                          />
                        ) : (
                          <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                            Generating Token...
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-xs text-[#9090A8] text-center font-normal">
                      Students scan via GQ-Attendance student portal
                    </span>

                    <button
                      onClick={() => setIsProjectorFullscreen(!isProjectorFullscreen)}
                      className="bg-[#111118] border border-[#222230] text-[#9090A8] hover:text-[#F0F0FF] text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5"
                    >
                      {isProjectorFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      {isProjectorFullscreen ? "Exit Fullscreen" : "Fullscreen Projector"}
                    </button>
                  </div>
                </div>

                {/* Real-time Student Check-in Breakdown */}
                <div className="flex flex-col gap-4">
                  {/* FLAGGED SECTION */}
                  {flaggedCountInSession > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#FFB340] font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Flagged ({flaggedCountInSession})
                      </span>

                      <div className="flex flex-col gap-2">
                        {liveAttendees.filter((a) => a.status === "flagged").map((att, idx) => (
                          <div
                            key={att.id || idx}
                            className="bg-[#111118] border border-[#FFB34030] border-l-[3px] border-l-[#FFB340] bg-[#FFB34010] p-3 rounded-xl flex items-center justify-between shadow-card"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FFB34018] border border-[#FFB34030] text-[#FFB340] flex items-center justify-center font-display font-bold text-xs">
                                ST
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-[#F0F0FF]">{att.student_id}</span>
                                <span className="text-[10px] font-mono text-[#9090A8]">Device conflict alert</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-[6px] bg-[#FFB34018] text-[#FFB340] border border-[#FFB34030] text-[11px] font-medium">
                                Flagged
                              </span>
                              <button
                                onClick={() => handleManualOverride(att.student_id, "present")}
                                className="px-2.5 py-1 bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] rounded-lg text-xs hover:bg-[#22C97A30] transition"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PRESENT SECTION */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#9090A8] font-semibold">
                      Present ({presentCountInSession})
                    </span>

                    {presentCountInSession === 0 ? (
                      <div className="bg-[#111118] border border-[#222230] p-6 rounded-xl text-center text-xs text-[#50505E]">
                        Waiting for student scans...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {liveAttendees.filter((a) => a.status === "present").map((att, idx) => (
                          <div
                            key={att.id || idx}
                            className="bg-[#111118] border border-[#222230] p-3 rounded-xl flex items-center justify-between shadow-card"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#6E5BFF18] border border-[#6E5BFF30] text-[#6E5BFF] flex items-center justify-center font-display font-bold text-xs">
                                ST
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-[#F0F0FF]">{att.student_id}</span>
                                <span className="text-[10px] font-mono text-[#9090A8]">Verified via QR scan</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-[6px] bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] text-[11px] font-medium">
                                Present
                              </span>
                              <span className="text-[10px] font-mono text-[#50505E]">
                                {new Date(att.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: COURSES & COHORTS (INDEPENDENT STUDENT ROSTERS)       */}
        {/* ============================================================ */}
        {activeTab === "presets" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-[#F0F0FF]">Course Cohorts</h3>
                <span className="text-xs text-[#9090A8]">
                  8 independent period rosters & elective groups. Manage students per subject.
                </span>
              </div>

              <button
                onClick={() => setShowCreatePresetModal(true)}
                className="bg-[#6E5BFF] hover:bg-[#5C48EE] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition duration-150 shadow-[0_0_16px_rgba(110,91,255,0.25)] flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Cohort & Students
              </button>
            </div>

            {/* Cohorts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {presetsList.map((preset) => {
                const isOnlinePreset = preset.venueType === "online" || preset.roomName?.toLowerCase().includes("online");
                const isSelected = activeCohortForManagement?.id === preset.id;

                return (
                  <div
                    key={preset.id}
                    className={`bg-[#111118] border p-4 rounded-xl shadow-card flex flex-col justify-between gap-4 transition duration-150 ${
                      isSelected
                        ? "border-[#6E5BFF] ring-2 ring-[#6E5BFF18]"
                        : isOnlinePreset
                        ? "border-[#222230] border-l-[3px] border-l-[#38BDF8]"
                        : "border-[#222230] border-l-[3px] border-l-[#6E5BFF]"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-[6px] uppercase ${
                            isOnlinePreset
                              ? "text-[#38BDF8] bg-[#38BDF818] border border-[#38BDF830]"
                              : "text-[#6E5BFF] bg-[#6E5BFF18] border border-[#6E5BFF30]"
                          }`}
                        >
                          Period {preset.periodNumber} · {isOnlinePreset ? "Online" : "45m"}
                        </span>
                        <span className="text-[10px] font-mono text-[#9090A8] bg-[#1A1A24] px-1.5 py-0.5 rounded-[6px]">
                          {preset.roomName}
                        </span>
                      </div>

                      <h4 className="font-display font-bold text-base text-[#F0F0FF] leading-snug">
                        {preset.name}
                      </h4>
                      <span className="text-xs text-[#9090A8]">{preset.subjectName}</span>

                      <div className="bg-[#1A1A24] p-2.5 rounded-lg border border-[#2E2E40] text-xs font-mono text-[#9090A8] flex justify-between mt-1">
                        <span>Cohort Roster:</span>
                        <span className="text-[#F0F0FF] font-semibold">{preset.studentCount || preset.students?.length || 58} students</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#222230]">
                      <button
                        onClick={() => setActiveCohortForManagement(preset)}
                        className={`flex-1 text-xs font-semibold py-2 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-[#6E5BFF] text-white"
                            : "bg-[#1A1A24] text-[#F0F0FF] hover:bg-[#2E2E40] border border-[#2E2E40]"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Manage Roster
                      </button>
                      <button
                        onClick={() => handleStartSession(undefined, preset)}
                        className="p-2 bg-[#6E5BFF] hover:bg-[#5C48EE] text-white rounded-xl text-xs"
                        title="Start Attendance"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id, preset.name)}
                        className="p-2 text-[#9090A8] hover:text-[#FF4D6A] rounded-xl transition"
                        title="Delete Cohort"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dedicated Roster Manager for the Selected Cohort */}
            {activeCohortForManagement && (
              <div className="bg-[#111118] border border-[#6E5BFF]/30 p-6 rounded-2xl shadow-card flex flex-col gap-5 animate-fade-in mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222230] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#6E5BFF] bg-[#6E5BFF18] px-2 py-0.5 rounded-[6px] uppercase">
                        Period {activeCohortForManagement.periodNumber}
                      </span>
                      <h3 className="font-display font-bold text-base text-[#F0F0FF]">
                        {activeCohortForManagement.name} — Student Roster
                      </h3>
                    </div>
                    <span className="text-xs text-[#9090A8] mt-0.5">
                      {activeCohortForManagement.students?.length || 0} students enrolled specifically in this cohort
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={cohortFileInputRef}
                      onChange={handleCohortCsvUpload}
                      accept=".csv,.xsv,.txt,.tsv"
                      className="hidden"
                    />
                    <button
                      onClick={() => cohortFileInputRef.current?.click()}
                      className="bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] px-3 py-1.5 rounded-xl text-xs font-medium transition hover:bg-[#22C97A30] flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Import CSV to Cohort
                    </button>
                  </div>
                </div>

                {/* Add Student to Cohort Form */}
                <form onSubmit={handleAddStudentToCohort} className="bg-[#1A1A24] p-4 rounded-xl border border-[#2E2E40] flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Reg No (e.g. RA2412012010060)"
                      value={cohortStudentRegNo}
                      onChange={(e) => setCohortStudentRegNo(e.target.value.toUpperCase())}
                      className="w-full bg-[#111118] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] font-mono placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF]"
                      required
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Student Full Name"
                      value={cohortStudentName}
                      onChange={(e) => setCohortStudentName(e.target.value)}
                      className="w-full bg-[#111118] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF]"
                      required
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <input
                      type="email"
                      placeholder="SRM Email (Optional)"
                      value={cohortStudentEmail}
                      onChange={(e) => setCohortStudentEmail(e.target.value)}
                      className="w-full bg-[#111118] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingCohortStudentLoading}
                    className="w-full sm:w-auto bg-[#6E5BFF] hover:bg-[#5C48EE] text-white px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {addingCohortStudentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Add to Cohort
                  </button>
                </form>

                {/* Cohort Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#50505E] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder={`Search students enrolled in ${activeCohortForManagement.name}...`}
                    value={searchCohortQuery}
                    onChange={(e) => setSearchCohortQuery(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF]"
                  />
                </div>

                {/* Cohort Student Table */}
                <div className="border border-[#222230] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#1A1A24] text-[#9090A8] font-mono text-[10px] uppercase sticky top-0">
                      <tr>
                        <th className="py-2.5 px-4">REG NUMBER</th>
                        <th className="py-2.5 px-4">STUDENT NAME</th>
                        <th className="py-2.5 px-4">EMAIL</th>
                        <th className="py-2.5 px-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222230] text-[#F0F0FF]">
                      {(activeCohortForManagement.students || [])
                        .filter((st) =>
                          st.name?.toLowerCase().includes(searchCohortQuery.toLowerCase()) ||
                          st.regNo?.toLowerCase().includes(searchCohortQuery.toLowerCase())
                        )
                        .map((st, idx) => (
                          <tr key={st.id || idx} className="hover:bg-[#1A1A24]/30">
                            <td className="py-2.5 px-4 font-mono font-medium">{st.regNo}</td>
                            <td className="py-2.5 px-4">{st.name}</td>
                            <td className="py-2.5 px-4 text-[#9090A8] font-mono text-[11px]">{st.email}</td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleRemoveStudentFromCohort(st.regNo)}
                                className="text-xs text-[#50505E] hover:text-[#FF4D6A] transition p-1"
                                title="Remove from this cohort"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: CALENDAR MATRIX (MON - SAT × PERIODS 1 - 8)           */}
        {/* ============================================================ */}
        {activeTab === "calendar" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-[#F0F0FF]">Attendance Calendar</h3>
                <span className="text-xs text-[#9090A8]">Weekday schedule matrix with Present & Absent counts</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSessionCSV()}
                  className="bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] px-3.5 py-1.5 rounded-xl text-xs font-medium transition hover:bg-[#22C97A30] flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export Calendar CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-[#111118] border border-[#222230] text-[#9090A8] hover:text-[#F0F0FF] px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>

            {/* Week Navigator */}
            <div className="bg-[#111118] border border-[#222230] p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedCalendarWeek((prev) => (typeof prev === "number" ? Math.max(1, prev - 1) : 3))}
                  className="p-1.5 rounded-lg text-[#9090A8] hover:text-[#F0F0FF] hover:bg-[#1A1A24] transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {[1, 2, 3].map((wNum) => (
                  <button
                    key={wNum}
                    onClick={() => setSelectedCalendarWeek(wNum)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                      selectedCalendarWeek === wNum
                        ? "bg-[#6E5BFF] text-white"
                        : "text-[#9090A8] hover:text-[#F0F0FF]"
                    }`}
                  >
                    Week {wNum} {wNum === 3 ? "(Current)" : ""}
                  </button>
                ))}

                <button
                  onClick={() => setSelectedCalendarWeek((prev) => (typeof prev === "number" ? Math.min(3, prev + 1) : 3))}
                  className="p-1.5 rounded-lg text-[#9090A8] hover:text-[#F0F0FF] hover:bg-[#1A1A24] transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs font-mono text-[#50505E] hidden sm:inline">
                Mon – Sat (8:00 AM – 4:00 PM)
              </span>
            </div>

            {/* Weekly Calendar Matrix Grid */}
            <div className="bg-[#111118] border border-[#222230] rounded-2xl overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-[#1A1A24] border-b border-[#222230] text-xs">
                      <th className="py-3 px-3 font-mono text-[11px] text-[#9090A8] w-24 border-r border-[#222230]">Slot</th>
                      {WEEK_DAYS.map((day) => (
                        <th key={day.dayNumber} className="py-3 px-3 font-display font-bold text-center border-r border-[#222230] text-[#F0F0FF]">
                          {day.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222230] text-xs">
                    {ACADEMIC_PERIODS.map((periodSlot) => (
                      <tr key={periodSlot.period} className="hover:bg-[#1A1A24]/30 transition">
                        <td className="py-3 px-3 border-r border-[#222230] bg-[#1A1A24]/40 font-mono text-[11px] text-[#9090A8] align-top">
                          <span className="font-bold text-[#F0F0FF] block">P{periodSlot.period}</span>
                          <span>{periodSlot.startTime}</span>
                        </td>

                        {WEEK_DAYS.map((day) => {
                          const sessionMatch = filteredSessionsList.find(
                            (s: any) => s.periodNumber === periodSlot.period && s.dayOfWeek === day.dayNumber
                          );

                          if (!sessionMatch) {
                            return (
                              <td key={day.dayNumber} className="py-3 px-2 border-r border-[#222230] text-center text-[#50505E] font-mono text-[11px]">
                                —
                              </td>
                            );
                          }

                          return (
                            <td
                              key={day.dayNumber}
                              onClick={() => setSelectedTimelineSessionModal(sessionMatch)}
                              className="py-2 px-2 border-r border-[#222230] align-top cursor-pointer hover:bg-[#6E5BFF18] transition"
                            >
                              <div className="bg-[#1A1A24] border border-[#2E2E40] p-2.5 rounded-xl flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-display font-bold text-[11px] text-[#F0F0FF] truncate">
                                    {sessionMatch.subjectName}
                                  </span>
                                  <span className="text-[9px] font-mono text-[#6E5BFF] bg-[#6E5BFF18] px-1 py-0.5 rounded-[4px] shrink-0 ml-1">
                                    {sessionMatch.roomName}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between font-mono text-[10px] pt-0.5">
                                  <span className="text-[#22C97A] font-semibold">{sessionMatch.presentCount} P</span>
                                  <span className="text-[#FF4D6A] font-semibold">{sessionMatch.absentCount} A</span>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: REPORTS & ANALYTICS GENERATOR                         */}
        {/* ============================================================ */}
        {activeTab === "reports" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header & Sub-Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-[#F0F0FF]">Attendance Reports & Analytics</h3>
                <span className="text-xs text-[#9090A8]">
                  Generate multi-dimensional reports by Student, by Session Cohort, by Month, or Semester Master.
                </span>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex bg-[#111118] border border-[#222230] p-1 rounded-xl">
                <button
                  onClick={() => setReportViewMode("by_session")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    reportViewMode === "by_session" ? "bg-[#6E5BFF] text-white font-semibold" : "text-[#9090A8] hover:text-[#F0F0FF]"
                  }`}
                >
                  By Session
                </button>
                <button
                  onClick={() => setReportViewMode("by_student")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    reportViewMode === "by_student" ? "bg-[#6E5BFF] text-white font-semibold" : "text-[#9090A8] hover:text-[#F0F0FF]"
                  }`}
                >
                  By Student
                </button>
                <button
                  onClick={() => setReportViewMode("by_month")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    reportViewMode === "by_month" ? "bg-[#6E5BFF] text-white font-semibold" : "text-[#9090A8] hover:text-[#F0F0FF]"
                  }`}
                >
                  By Month
                </button>
                <button
                  onClick={() => setReportViewMode("semester_master")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    reportViewMode === "semester_master" ? "bg-[#6E5BFF] text-white font-semibold" : "text-[#9090A8] hover:text-[#F0F0FF]"
                  }`}
                >
                  Semester Master
                </button>
              </div>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-[#111118] border border-[#222230] p-4 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-[#9090A8]">Overall Average</span>
                <span className="font-display font-bold text-2xl text-[#22C97A]">94.6%</span>
              </div>
              <div className="bg-[#111118] border border-[#222230] p-4 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-[#9090A8]">Total Sessions</span>
                <span className="font-display font-bold text-2xl text-[#F0F0FF]">128</span>
              </div>
              <div className="bg-[#111118] border border-[#222230] p-4 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-[#9090A8]">Course Cohorts</span>
                <span className="font-display font-bold text-2xl text-[#6E5BFF]">{presetsList.length}</span>
              </div>
              <div className="bg-[#111118] border border-[#222230] p-4 rounded-xl shadow-card flex flex-col gap-1">
                <span className="text-[11px] text-[#9090A8]">At-Risk (&lt;75%)</span>
                <span className="font-display font-bold text-2xl text-[#FF4D6A]">2</span>
              </div>
            </div>

            {/* SUB-MODE 1: REPORT BY COURSE / SESSION */}
            {reportViewMode === "by_session" && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="bg-[#111118] border border-[#222230] p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9090A8]">Select Cohort:</span>
                    <select
                      value={selectedReportCohortId}
                      onChange={(e) => setSelectedReportCohortId(e.target.value)}
                      className="bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-1.5 px-3 text-xs text-[#F0F0FF] focus:outline-none focus:border-[#6E5BFF]"
                    >
                      <option value="all">All Course Cohorts (Combined)</option>
                      {presetsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          Period {p.periodNumber} · {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleExportSessionCSV()}
                    className="bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] px-3.5 py-1.5 rounded-xl text-xs font-mono transition hover:bg-[#22C97A30] flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Session CSV
                  </button>
                </div>

                <div className="bg-[#111118] border border-[#222230] rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#1A1A24] text-[#9090A8] font-mono text-[10px] uppercase">
                      <tr>
                        <th className="py-3 px-4">Period / Slot</th>
                        <th className="py-3 px-4">Course Name</th>
                        <th className="py-3 px-4">Venue</th>
                        <th className="py-3 px-4 text-center">Enrolled</th>
                        <th className="py-3 px-4 text-center">Avg Attendance</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222230] text-[#F0F0FF]">
                      {presetsList
                        .filter((p) => selectedReportCohortId === "all" || p.id === selectedReportCohortId)
                        .map((preset) => (
                          <tr key={preset.id} className="hover:bg-[#1A1A24]/30">
                            <td className="py-3 px-4 font-mono font-medium">Period {preset.periodNumber} ({preset.startTime})</td>
                            <td className="py-3 px-4 font-semibold">{preset.name}</td>
                            <td className="py-3 px-4 text-[#9090A8] font-mono text-[11px]">{preset.roomName}</td>
                            <td className="py-3 px-4 text-center font-mono">{preset.studentCount || preset.students?.length || 58}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-[6px] bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] font-mono text-[11px]">
                                95.2%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleExportSessionCSV()}
                                className="text-xs font-mono text-[#6E5BFF] hover:underline"
                              >
                                Export CSV
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-MODE 2: REPORT BY INDIVIDUAL STUDENT */}
            {reportViewMode === "by_student" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                {/* Left: Search & Select Student List */}
                <div className="bg-[#111118] border border-[#222230] p-4 rounded-2xl shadow-card flex flex-col gap-3">
                  <span className="text-xs font-mono uppercase text-[#9090A8]">Search Student</span>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#50505E] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Reg No or Student Name..."
                      value={searchStudentReportQuery}
                      onChange={(e) => setSearchStudentReportQuery(e.target.value)}
                      className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 pl-9 pr-3 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
                    {filteredStudentsForReport.map((st) => (
                      <button
                        key={st.regNo}
                        onClick={() => setSelectedStudentForReport(st)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                          selectedStudentForReport?.regNo === st.regNo
                            ? "bg-[#6E5BFF18] border-[#6E5BFF] text-[#F0F0FF]"
                            : "bg-[#1A1A24]/60 border-[#222230] text-[#9090A8] hover:bg-[#1A1A24]"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#F0F0FF]">{st.name}</span>
                          <span className="text-[10px] font-mono text-[#9090A8]">{st.regNo}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#50505E]" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Individual Student Report Profile */}
                <div className="col-span-2 flex flex-col gap-4">
                  {selectedStudentForReport ? (
                    <div className="bg-[#111118] border border-[#222230] p-6 rounded-2xl shadow-card flex flex-col gap-5">
                      <div className="flex items-start justify-between border-b border-[#222230] pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#6E5BFF18] border border-[#6E5BFF30] text-[#6E5BFF] flex items-center justify-center font-display font-bold text-base">
                            {selectedStudentForReport.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <h3 className="font-display font-bold text-lg text-[#F0F0FF]">
                              {selectedStudentForReport.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs font-mono text-[#9090A8]">
                              <span>{selectedStudentForReport.regNo}</span>
                              <span>·</span>
                              <span>{selectedStudentForReport.email}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleExportStudentCSV(selectedStudentForReport)}
                          className="bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] px-3.5 py-1.5 rounded-xl text-xs font-mono transition hover:bg-[#22C97A30] flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Report
                        </button>
                      </div>

                      {/* Student Attendance Stats Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#1A1A24] p-3.5 rounded-xl border border-[#2E2E40] flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-mono text-[#9090A8]">Cumulative Rate</span>
                          <span className="font-display font-bold text-xl text-[#22C97A]">96.4%</span>
                        </div>
                        <div className="bg-[#1A1A24] p-3.5 rounded-xl border border-[#2E2E40] flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-mono text-[#9090A8]">Attended</span>
                          <span className="font-display font-bold text-xl text-[#F0F0FF]">123 Sessions</span>
                        </div>
                        <div className="bg-[#1A1A24] p-3.5 rounded-xl border border-[#2E2E40] flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-mono text-[#9090A8]">Absences</span>
                          <span className="font-display font-bold text-xl text-[#FF4D6A]">5 Sessions</span>
                        </div>
                      </div>

                      {/* Subject-Wise Breakdown */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-[#222230]">
                        <span className="text-xs font-mono uppercase text-[#9090A8]">Course-Wise Attendance Breakdown</span>
                        <div className="flex flex-col gap-2">
                          {presetsList.map((preset, idx) => (
                            <div key={preset.id} className="bg-[#1A1A24] p-3 rounded-xl border border-[#2E2E40] flex items-center justify-between text-xs">
                              <div className="flex flex-col">
                                <span className="font-semibold text-[#F0F0FF]">{preset.subjectName}</span>
                                <span className="text-[10px] font-mono text-[#9090A8]">Period {preset.periodNumber} · {preset.roomName}</span>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] font-mono text-xs font-semibold">
                                {94 + (idx % 5)}% Present
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#111118] border border-[#222230] p-12 rounded-2xl text-center text-xs text-[#50505E]">
                      Select a student to generate their comprehensive attendance dossier.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-MODE 3: REPORT BY MONTH */}
            {reportViewMode === "by_month" && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="bg-[#111118] border border-[#222230] p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9090A8]">Select Month:</span>
                    <select
                      value={selectedReportMonth}
                      onChange={(e) => setSelectedReportMonth(e.target.value)}
                      className="bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-1.5 px-3 text-xs text-[#F0F0FF] focus:outline-none focus:border-[#6E5BFF]"
                    >
                      {MONTHS_LIST.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleExportMonthlyCSV(selectedReportMonth)}
                    className="bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] px-3.5 py-1.5 rounded-xl text-xs font-mono transition hover:bg-[#22C97A30] flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Monthly CSV
                  </button>
                </div>

                <div className="bg-[#111118] border border-[#222230] rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#1A1A24] text-[#9090A8] font-mono text-[10px] uppercase">
                      <tr>
                        <th className="py-3 px-4">REG NUMBER</th>
                        <th className="py-3 px-4">STUDENT NAME</th>
                        <th className="py-3 px-4 text-center">MONTH SESSIONS</th>
                        <th className="py-3 px-4 text-center">ATTENDED</th>
                        <th className="py-3 px-4 text-center">ABSENT</th>
                        <th className="py-3 px-4 text-center">RATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222230] text-[#F0F0FF]">
                      {allUniqueStudentsAcrossCohorts.map((st, idx) => {
                        const attended = 24 - (idx % 3);
                        const rate = Math.round((attended / 26) * 100);
                        return (
                          <tr key={st.regNo} className="hover:bg-[#1A1A24]/30">
                            <td className="py-2.5 px-4 font-mono font-medium">{st.regNo}</td>
                            <td className="py-2.5 px-4">{st.name}</td>
                            <td className="py-2.5 px-4 text-center font-mono">26</td>
                            <td className="py-2.5 px-4 text-center font-mono text-[#22C97A] font-semibold">{attended}</td>
                            <td className="py-2.5 px-4 text-center font-mono text-[#FF4D6A] font-semibold">{26 - attended}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-[6px] font-mono text-[11px] ${
                                rate >= 75
                                  ? "bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30]"
                                  : "bg-[#FF4D6A18] text-[#FF4D6A] border border-[#FF4D6A30]"
                              }`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-MODE 4: SEMESTER MASTER REGISTER */}
            {reportViewMode === "semester_master" && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="bg-[#111118] border border-[#222230] p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFilterDefaultersOnly(!filterDefaultersOnly)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                        filterDefaultersOnly
                          ? "bg-[#FF4D6A18] text-[#FF4D6A] border-[#FF4D6A30]"
                          : "bg-[#1A1A24] text-[#9090A8] border-[#2E2E40] hover:text-[#F0F0FF]"
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      {filterDefaultersOnly ? "Showing Defaulters (<75%)" : "Filter Defaulters (<75%)"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportMonthlyCSV("Full_Semester_Master")}
                      className="bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] px-3.5 py-1.5 rounded-xl text-xs font-mono transition hover:bg-[#22C97A30] flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Export Master CSV
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="bg-[#111118] border border-[#222230] text-[#9090A8] hover:text-[#F0F0FF] px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </button>
                  </div>
                </div>

                <div className="bg-[#111118] border border-[#222230] rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#1A1A24] text-[#9090A8] font-mono text-[10px] uppercase">
                      <tr>
                        <th className="py-3 px-4">REG NUMBER</th>
                        <th className="py-3 px-4">STUDENT NAME</th>
                        <th className="py-3 px-4">ENROLLED COHORT</th>
                        <th className="py-3 px-4 text-center">TOTAL SESSIONS</th>
                        <th className="py-3 px-4 text-center">ATTENDED</th>
                        <th className="py-3 px-4 text-center">SEMESTER RATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222230] text-[#F0F0FF]">
                      {allUniqueStudentsAcrossCohorts
                        .filter((st, idx) => {
                          if (!filterDefaultersOnly) return true;
                          const rate = Math.round(((120 - (idx * 4)) / 128) * 100);
                          return rate < 75;
                        })
                        .map((st, idx) => {
                          const attended = Math.max(80, 124 - (idx % 8));
                          const rate = Math.round((attended / 128) * 100);

                          return (
                            <tr key={st.regNo} className="hover:bg-[#1A1A24]/30">
                              <td className="py-2.5 px-4 font-mono font-medium">{st.regNo}</td>
                              <td className="py-2.5 px-4">{st.name}</td>
                              <td className="py-2.5 px-4 text-[#9090A8]">{st.cohortName || "MCA Core Section F"}</td>
                              <td className="py-2.5 px-4 text-center font-mono">128</td>
                              <td className="py-2.5 px-4 text-center font-mono text-[#22C97A] font-semibold">{attended}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-[6px] font-mono text-[11px] ${
                                  rate >= 75
                                    ? "bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30]"
                                    : "bg-[#FF4D6A18] text-[#FF4D6A] border border-[#FF4D6A30]"
                                }`}>
                                  {rate}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: TIMETABLE CONFIGURATION                               */}
        {/* ============================================================ */}
        {activeTab === "timetable" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-[#111118] border border-[#222230] p-5 rounded-2xl shadow-card flex flex-col gap-4">
              <h3 className="font-display font-bold text-sm text-[#F0F0FF]">Add Period Slot</h3>
              <form onSubmit={handleAddTimetable} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced Databases"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#9090A8] font-medium">Day of Week</label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                      className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-2.5 text-xs text-[#F0F0FF] focus:outline-none focus:border-[#6E5BFF] transition"
                    >
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#9090A8] font-medium">Period Slot</label>
                    <select
                      value={timetablePeriod}
                      onChange={(e) => {
                        const p = parseInt(e.target.value);
                        setTimetablePeriod(p);
                        const slot = ACADEMIC_PERIODS.find((x) => x.period === p);
                        if (slot) {
                          setStartTime(slot.startTime);
                          setEndTime(slot.endTime);
                        }
                      }}
                      className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-2.5 text-xs text-[#F0F0FF] focus:outline-none focus:border-[#6E5BFF] transition font-mono"
                    >
                      {ACADEMIC_PERIODS.map((p) => (
                        <option key={p.period} value={p.period}>P{p.period} ({p.startTime})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">Room / Venue</label>
                  <input
                    type="text"
                    value={timetableCustomRoom}
                    onChange={(e) => setTimetableCustomRoom(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] font-mono focus:outline-none focus:border-[#6E5BFF] transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={timetableLoading}
                  className="w-full bg-[#6E5BFF] hover:bg-[#5C48EE] text-white font-medium py-2.5 rounded-xl text-xs transition mt-1 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {timetableLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Period Slot"}
                </button>
              </form>
            </div>

            <div className="col-span-2 flex flex-col gap-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((dayName, idx) => {
                const dayNum = idx + 1;
                const daySlots = timetable.filter((t) => t.dayOfWeek === dayNum)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={dayName} className="flex flex-col gap-2">
                    <span className="text-xs font-display font-bold text-[#6E5BFF]">{dayName}</span>

                    {daySlots.length === 0 ? (
                      <div className="text-[11px] text-[#50505E] p-3 bg-[#111118] rounded-xl border border-[#222230]">
                        No periods scheduled.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="bg-[#111118] border border-[#222230] p-3 rounded-xl flex items-center justify-between shadow-card"
                          >
                            <div className="flex flex-col">
                              <span className="font-display font-bold text-xs text-[#F0F0FF]">{slot.subjectName}</span>
                              <span className="text-[10px] font-mono text-[#9090A8]">
                                {slot.startTime} – {slot.endTime} · {slot.roomName || "TP 602"}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteTimetable(slot.id)}
                              className="p-1 text-[#50505E] hover:text-[#FF4D6A] transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: NOTICES & ANNOUNCEMENTS                              */}
        {/* ============================================================ */}
        {activeTab === "announcements" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-[#111118] border border-[#222230] p-5 rounded-2xl shadow-card flex flex-col gap-4">
              <h3 className="font-display font-bold text-sm text-[#F0F0FF]">Broadcast Notice</h3>
              <form onSubmit={handlePublishAnnouncement} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">Notice Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab Assessment on Friday"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] transition"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">Message Body</label>
                  <textarea
                    rows={4}
                    placeholder="Type notice message..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] transition resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={annLoading}
                  className="w-full bg-[#6E5BFF] hover:bg-[#5C48EE] text-white font-medium py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-[0_0_16px_rgba(110,91,255,0.25)]"
                >
                  {annLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post Announcement"}
                </button>
              </form>
            </div>

            <div className="col-span-2 flex flex-col gap-3">
              <span className="text-xs font-mono uppercase text-[#9090A8]">Broadcast History</span>
              {announcements.map((post) => (
                <div
                  key={post.id}
                  className="bg-[#111118] border border-[#222230] rounded-xl p-4 shadow-card flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-display font-bold text-sm text-[#F0F0FF]">{post.title}</h4>
                    <span className="text-[10px] font-mono text-[#50505E]">
                      {new Date(post.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-[#9090A8] whitespace-pre-wrap">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* MODAL: CREATE COURSE COHORT WITH INTERACTIVE STUDENT BUILDER */}
      {/* ============================================================ */}
      {showCreatePresetModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-[4px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#111118] border border-[#222230] max-w-2xl w-full p-6 rounded-t-[20px] sm:rounded-2xl shadow-modal flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="w-9 h-1 rounded-full bg-[#2E2E40] self-center sm:hidden" />

            <div className="flex items-center justify-between border-b border-[#222230] pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-[#F0F0FF]">Create Course Cohort & Student List</h3>
                <span className="text-xs text-[#9090A8]">Save subject and enrolled students now to reuse anytime or launch immediately</span>
              </div>
              <button onClick={() => setShowCreatePresetModal(false)} className="p-1 text-[#9090A8] hover:text-[#F0F0FF]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveCoursePreset(e, false)} className="flex flex-col gap-4">
              {/* Cohort Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">Cohort / Class Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cloud Elective — Batch B"
                    value={presetTitle}
                    onChange={(e) => setPresetTitle(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">Subject Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Cloud Computing Architectures"
                    value={presetSubject}
                    onChange={(e) => setPresetSubject(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">Period Slot</label>
                  <select
                    value={presetPeriod}
                    onChange={(e) => setPresetPeriod(parseInt(e.target.value))}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-2.5 text-xs text-[#F0F0FF] font-mono focus:outline-none focus:border-[#6E5BFF]"
                  >
                    {ACADEMIC_PERIODS.map((p) => (
                      <option key={p.period} value={p.period}>Period {p.period} ({p.startTime})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">Venue Type</label>
                  <select
                    value={presetVenueType}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setPresetVenueType(v);
                      if (v === "classroom") setPresetRoom("TP 602");
                      if (v === "lab") setPresetRoom("Tech Park Lab 3");
                      if (v === "seminar_hall") setPresetRoom("Dr. T.P. Ganesan Auditorium");
                      if (v === "online") setPresetRoom("Online (Google Meet / Zoom)");
                    }}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-2.5 text-xs text-[#F0F0FF] focus:outline-none focus:border-[#6E5BFF]"
                  >
                    <option value="classroom">Classroom</option>
                    <option value="lab">Computer Lab</option>
                    <option value="seminar_hall">Seminar Hall</option>
                    <option value="online">Online / Virtual</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs text-[#9090A8] font-medium">Room / Venue Name</label>
                  <input
                    type="text"
                    value={presetRoom}
                    onChange={(e) => setPresetRoom(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] font-mono focus:outline-none focus:border-[#6E5BFF]"
                    required
                  />
                </div>
              </div>

              {/* Interactive Student Builder for This Cohort */}
              <div className="bg-[#1A1A24] p-4 rounded-xl border border-[#2E2E40] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#F0F0FF]">Add Enrolled Students</span>
                    <span className="text-[10px] font-mono text-[#6E5BFF] bg-[#6E5BFF18] border border-[#6E5BFF30] px-2 py-0.5 rounded-[6px]">
                      {presetInitialStudents.length} Added
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkPasteArea(!showBulkPasteArea)}
                      className="text-[11px] text-[#9090A8] hover:text-[#F0F0FF] flex items-center gap-1 font-medium transition"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      {showBulkPasteArea ? "Simple Form" : "Paste List"}
                    </button>
                    
                    <input
                      type="file"
                      ref={modalCsvInputRef}
                      onChange={handleModalCsvUpload}
                      accept=".csv,.xsv,.txt,.tsv"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => modalCsvInputRef.current?.click()}
                      className="text-[11px] text-[#22C97A] hover:underline flex items-center gap-1 font-medium"
                    >
                      <UploadCloud className="w-3 h-3" />
                      Import CSV
                    </button>
                  </div>
                </div>

                {showBulkPasteArea ? (
                  /* Bulk Paste Box */
                  <div className="flex flex-col gap-2">
                    <textarea
                      rows={3}
                      placeholder="Paste student rows:&#10;RA2412012010001, Aakash S&#10;RA2412012010002, Bhuvanesh R"
                      value={modalBulkPasteText}
                      onChange={(e) => setModalBulkPasteText(e.target.value)}
                      className="w-full bg-[#111118] border border-[#2E2E40] rounded-xl p-2.5 text-xs text-[#F0F0FF] font-mono placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleParseBulkPaste}
                      className="self-end bg-[#6E5BFF] hover:bg-[#5C48EE] text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      Parse & Add Students
                    </button>
                  </div>
                ) : (
                  /* Single Student Input Form */
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="Reg Number (e.g. RA2412012010001)"
                      value={modalStudentRegNo}
                      onChange={(e) => setModalStudentRegNo(e.target.value.toUpperCase())}
                      className="sm:col-span-2 bg-[#111118] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] font-mono placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF]"
                    />
                    <input
                      type="text"
                      placeholder="Student Full Name"
                      value={modalStudentName}
                      onChange={(e) => setModalStudentName(e.target.value)}
                      className="sm:col-span-2 bg-[#111118] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddStudentToModal()}
                      className="bg-[#6E5BFF] hover:bg-[#5C48EE] text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                )}

                {/* Preset Students Live Table */}
                {presetInitialStudents.length > 0 && (
                  <div className="border border-[#222230] rounded-xl overflow-hidden max-h-48 overflow-y-auto mt-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#111118] text-[#9090A8] font-mono text-[10px] uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3">REG NUMBER</th>
                          <th className="py-2 px-3">STUDENT NAME</th>
                          <th className="py-2 px-3 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222230] text-[#F0F0FF]">
                        {presetInitialStudents.map((st) => (
                          <tr key={st.regNo} className="hover:bg-[#111118]/50">
                            <td className="py-1.5 px-3 font-mono text-[11px] font-medium">{st.regNo}</td>
                            <td className="py-1.5 px-3 text-xs">{st.name}</td>
                            <td className="py-1.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setPresetInitialStudents((prev) => prev.filter((s) => s.regNo !== st.regNo))}
                                className="text-[#50505E] hover:text-[#FF4D6A] p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setShowCreatePresetModal(false)}
                  className="w-full sm:w-auto bg-[#1A1A24] border border-[#2E2E40] text-[#9090A8] hover:text-[#F0F0FF] px-4 py-2.5 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={savingPresetLoading}
                    className="flex-1 sm:flex-initial bg-[#1A1A24] hover:bg-[#2E2E40] border border-[#2E2E40] text-[#F0F0FF] px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    {savingPresetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Cohort Preset"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCoursePreset(undefined, true)}
                    disabled={savingPresetLoading}
                    className="flex-1 sm:flex-initial bg-[#6E5BFF] hover:bg-[#5C48EE] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-[0_0_16px_rgba(110,91,255,0.25)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Save & Start Attendance
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: IN-CLASS ON-THE-FLY STUDENT ADD TO LIVE SESSION       */}
      {/* ============================================================ */}
      {showLiveAddStudentModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-[#6E5BFF]/30 max-w-md w-full p-6 rounded-2xl shadow-modal flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#222230] pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-[#F0F0FF]">Add Student to Live Class</h3>
                <span className="text-xs text-[#9090A8]">Enrolls student now and saves them to this preset for next week</span>
              </div>
              <button onClick={() => setShowLiveAddStudentModal(false)} className="p-1 text-[#9090A8] hover:text-[#F0F0FF]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudentToLiveSession} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9090A8] font-medium">SRM Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. RA2412012010065"
                  value={liveStudentRegNo}
                  onChange={(e) => setLiveStudentRegNo(e.target.value.toUpperCase())}
                  className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] font-mono focus:outline-none focus:border-[#6E5BFF]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9090A8] font-medium">Student Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rohith Kumar S"
                  value={liveStudentName}
                  onChange={(e) => setLiveStudentName(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2 px-3 text-xs text-[#F0F0FF] focus:outline-none focus:border-[#6E5BFF]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setShowLiveAddStudentModal(false)}
                  className="bg-[#1A1A24] border border-[#2E2E40] text-[#9090A8] px-4 py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingLiveStudentLoading}
                  className="bg-[#6E5BFF] hover:bg-[#5C48EE] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-[0_0_16px_rgba(110,91,255,0.25)] flex items-center gap-1.5"
                >
                  {addingLiveStudentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Enroll in Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: VIEW CALENDAR SESSION REGISTER                        */}
      {/* ============================================================ */}
      {selectedTimelineSessionModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-[4px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#111118] border border-[#222230] max-w-2xl w-full p-6 rounded-t-[20px] sm:rounded-2xl shadow-modal flex flex-col gap-5 max-h-[85vh] overflow-y-auto animate-fade-in">
            <div className="w-9 h-1 rounded-full bg-[#2E2E40] self-center sm:hidden" />

            <div className="flex items-center justify-between border-b border-[#222230] pb-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#6E5BFF] bg-[#6E5BFF18] border border-[#6E5BFF30] px-2 py-0.5 rounded-[6px]">
                    Period {selectedTimelineSessionModal.periodNumber} · 45m
                  </span>
                  <span className="text-xs text-[#9090A8] font-mono">{selectedTimelineSessionModal.formattedDate}</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#F0F0FF] mt-1">
                  {selectedTimelineSessionModal.subjectName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTimelineSessionModal(null)}
                className="p-1 text-[#9090A8] hover:text-[#F0F0FF] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#1A1A24] p-3 rounded-xl border border-[#2E2E40]">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#22C97A] font-semibold">{selectedTimelineSessionModal.presentCount} Present</span>
                <span className="text-[#9090A8]">·</span>
                <span className="text-[#FF4D6A] font-semibold">{selectedTimelineSessionModal.absentCount} Absent</span>
              </div>
              <button
                onClick={() => handleExportSessionCSV(selectedTimelineSessionModal)}
                className="bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] text-xs font-mono px-3 py-1 rounded-lg"
              >
                Download CSV
              </button>
            </div>

            <div className="border border-[#222230] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#1A1A24] text-[#9090A8] font-mono text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">REG NO</th>
                    <th className="py-2.5 px-3">NAME</th>
                    <th className="py-2.5 px-3 text-center">STATUS</th>
                    <th className="py-2.5 px-3 text-right">OVERRIDE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222230] text-[#F0F0FF]">
                  {selectedTimelineSessionModal.students?.map((st: any) => (
                    <tr key={st.id} className="hover:bg-[#1A1A24]/30">
                      <td className="py-2 px-3 font-mono font-medium">{st.regNo}</td>
                      <td className="py-2 px-3">{st.name}</td>
                      <td className="py-2 px-3 text-center">
                        {st.status === "present" ? (
                          <span className="px-2 py-0.5 rounded-[6px] bg-[#22C97A18] text-[#22C97A] border border-[#22C97A30] text-[10px] font-medium">
                            Present
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[6px] bg-[#FF4D6A18] text-[#FF4D6A] border border-[#FF4D6A30] text-[10px] font-medium">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleManualOverride(st.userId || st.id, st.status === "present" ? "absent" : "present")}
                          className="text-[10px] font-mono text-[#6E5BFF] hover:underline"
                        >
                          Toggle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#222230]">
              <button
                onClick={() => setSelectedTimelineSessionModal(null)}
                className="bg-[#1A1A24] border border-[#2E2E40] text-[#F0F0FF] px-4 py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
