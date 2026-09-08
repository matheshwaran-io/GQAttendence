"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  QrCode, 
  Lock, 
  Smartphone, 
  MapPin, 
  Radio, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Layers, 
  Cpu, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Grid, 
  Play, 
  Pause, 
  RotateCcw, 
  ExternalLink, 
  ArrowRight, 
  Server, 
  Database, 
  Zap, 
  Check, 
  X,
  Compass,
  FileSpreadsheet,
  Printer,
  Sliders,
  Shield,
  Fingerprint,
  RefreshCw,
  Award,
  BookOpen
} from "lucide-react";

// ==========================================
// 14 Slide Definitions
// ==========================================

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOverview, setShowOverview] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTier, setActiveTier] = useState<number>(1);
  const [simulatedDistance, setSimulatedDistance] = useState<number>(18);
  const [qrCountdown, setQrCountdown] = useState<number>(10);
  const [qrToken, setQrToken] = useState<string>("8f9a2b7c4d1e0f3a6b5c8d7e9f0a1b2c");
  const [deviceBound, setDeviceBound] = useState<boolean>(true);
  const [simulatedAccounts, setSimulatedAccounts] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const TOTAL_SLIDES = 14;

  // 10s QR Simulation Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          // Generate new fake hash
          const chars = "0123456789abcdef";
          let token = "";
          for (let i = 0; i < 32; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
          }
          setQrToken(token);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Autoplay handler
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev < TOTAL_SLIDES - 1 ? prev + 1 : 0));
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        setShowOverview((prev) => !prev);
      } else if (e.key === "n" || e.key === "N" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        setShowNotes((prev) => !prev);
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentSlide(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentSlide(TOTAL_SLIDES - 1);
      } else if (e.key === "Escape") {
        setShowOverview(false);
      }
    },
    [TOTAL_SLIDES]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ==========================================
  // Speaker Notes Data
  // ==========================================
  const speakerNotes = [
    "Welcome the audience. Introduce QAttendance as the next-generation Zero-Trust Smart Attendance System designed specifically for university environments like SRM Institute of Science & Technology.",
    "Explain the 4 fatal vulnerabilities of existing campus attendance: WhatsApp QR forwarding, buddy punching on one phone, mock GPS spoofing, and the 20% lost lecture time.",
    "Introduce the Zero-Trust philosophy: 'Never Trust, Always Verify'. Explain why credentials alone are not enough in high-stakes academic grading.",
    "Deep dive into the 7-Tier Anti-Proxy Engine. Click through each tier to demonstrate how independent cryptographic and hardware layers create an impenetrable defense.",
    "Explain the HMAC-SHA256 mathematical algorithm. Mention 10-second rotation and the single-use nonce ledger that immediately burns scanned tokens.",
    "Explain Dual-Node Haversine GPS geofencing. Show how the live slider works and emphasize that the faculty laptop's live location acts as the dynamic anchor point.",
    "Explain Canvas 2D + WebGL Hardware Fingerprinting. Explain how 1 student is permanently bound to 1 phone, defeating account sharing.",
    "Showcase the Faculty Command Center. Emphasize Reusable Course Presets (DBMS, Cloud Electives, Lab batches) configured once and launched weekly with zero re-entry.",
    "Walk through the 45-minute academic structure: 35-minute focused teaching phase + 10-minute automated attendance window with live WebSocket telemetry.",
    "Demonstrate the Student Portal: Zero-install PWA, sub-second camera scanning, instant verified distance feedback, and <75% debarment threshold tracking.",
    "Explain Master Roster management: Bulk CSV/XSV upload, inline preview, sample template download, and single-student instant enrollment.",
    "Review the full-stack engineering architecture: Next.js 16 App Router, TypeScript, Drizzle ORM, Supabase Realtime WebSockets, and the 11 relational tables.",
    "Highlight the Competitive Benchmark: Compare QAttendance vs traditional paper rolls, static QR apps, and $5,000 biometric scanners.",
    "Summarize key takeaways, future roadmap (multi-campus federation, LMS integration), and open the floor for Q&A."
  ];

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-[#08080C] text-[#F0F0FF] flex flex-col font-sans select-none overflow-hidden relative"
    >
      {/* Top Floating Action Bar */}
      <header className="h-14 px-6 border-b border-white/10 bg-[#0C0D14]/80 backdrop-blur-md flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6E5BFF] to-[#00F2FE] flex items-center justify-center font-bold text-xs text-white shadow-[0_0_15px_rgba(110,91,255,0.4)]">
            GQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">GQ-Attendance</span>
              <span className="text-[10px] bg-[#6E5BFF]/20 text-[#A594FD] px-2 py-0.5 rounded-full border border-[#6E5BFF]/30 font-mono">
                SLIDE DECK
              </span>
            </div>
            <p className="text-[10px] text-[#8A8AA0] hidden sm:block">QR &amp; Geolocation Anti-Proxy System</p>
          </div>
        </div>

        {/* Slide Counter & Quick Nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition text-[#C0C0D8]"
            title="Previous Slide (← / PageUp)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowOverview(true)}
            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#D0D0E8] flex items-center gap-1.5 border border-white/5"
            title="Slide Overview (O)"
          >
            <Grid className="w-3.5 h-3.5 text-[#6E5BFF]" />
            <span>{currentSlide + 1} / {TOTAL_SLIDES}</span>
          </button>

          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1))}
            disabled={currentSlide === TOTAL_SLIDES - 1}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition text-[#C0C0D8]"
            title="Next Slide (→ / Space / PageDown)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Presenter Utilities */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition ${
              isPlaying 
                ? "bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40" 
                : "bg-white/5 text-[#9090A8] hover:bg-white/10 hover:text-white"
            }`}
            title="Toggle Autoplay (8s)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
              showNotes 
                ? "bg-[#6E5BFF]/20 text-[#A594FD] border-[#6E5BFF]/40" 
                : "bg-white/5 text-[#9090A8] border-transparent hover:bg-white/10 hover:text-white"
            }`}
            title="Toggle Speaker Notes (P)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Notes</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#9090A8] hover:text-white transition"
            title="Export / Print Slides as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#9090A8] hover:text-white transition"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <Link
            href="/tutor"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#6E5BFF] to-[#5040DD] text-white text-xs font-medium shadow-[0_0_12px_rgba(110,91,255,0.3)] hover:opacity-95 transition"
          >
            <span>Live App</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Progress Track Bar */}
      <div className="w-full h-1 bg-white/5 relative z-20">
        <div 
          className="h-full bg-gradient-to-r from-[#6E5BFF] via-[#00F2FE] to-[#00F5A0] transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / TOTAL_SLIDES) * 100}%` }}
        />
      </div>

      {/* Main Slide Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative overflow-y-auto">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6E5BFF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00F2FE]/10 rounded-full blur-3xl pointer-events-none" />

        {/* 16:9 Slide Frame */}
        <div className="w-full max-w-6xl aspect-[16/9] min-h-[540px] max-h-[760px] bg-[#0E0F18] border border-[#222436] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 md:p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-500">
          
          {/* ==========================================
              SLIDE 01: HERO & VISION
             ========================================== */}
          {currentSlide === 0 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6E5BFF]/15 border border-[#6E5BFF]/30 text-[#A594FD] text-xs font-semibold uppercase tracking-wider mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-[#00F2FE]" />
                  QR &amp; Geolocation-Based Anti-Proxy System
                </div>
                
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight font-display">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#F0F0FF] to-[#A594FD]">
                    Q-Attendance
                  </span>
                </h1>
                <p className="text-lg md:text-2xl text-[#00F2FE] font-medium max-w-3xl mb-4">
                  QR &amp; Geolocation-Based Anti-Proxy Attendance System
                </p>
                <p className="text-sm md:text-base text-[#9090B0] max-w-2xl leading-relaxed">
                  Engineered with 7-Tier Zero-Trust verification. Connects faculty laptop projectors, 45-minute academic period matrices, and mobile web clients with sub-second verified check-ins.
                </p>
              </div>

              {/* 4 Feature Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                  <div className="text-2xl font-black text-[#00F5A0] font-mono">0%</div>
                  <div className="text-xs font-semibold text-white mt-1">Proxy Success Rate</div>
                  <div className="text-[11px] text-[#8080A0]">7 attack vectors defeated</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                  <div className="text-2xl font-black text-[#00F2FE] font-mono">10s</div>
                  <div className="text-xs font-semibold text-white mt-1">HMAC-SHA256 Rotation</div>
                  <div className="text-[11px] text-[#8080A0]">Dynamic cryptographic tokens</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                  <div className="text-2xl font-black text-[#6E5BFF] font-mono">≤ 50m</div>
                  <div className="text-xs font-semibold text-white mt-1">Haversine Geofence</div>
                  <div className="text-[11px] text-[#8080A0]">Dual-node laptop-to-phone</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                  <div className="text-2xl font-black text-[#FFB800] font-mono">45m</div>
                  <div className="text-xs font-semibold text-white mt-1">Academic Periods</div>
                  <div className="text-[11px] text-[#8080A0]">35m lecture + 10m attendance</div>
                </div>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between text-xs text-[#707090] pt-4 border-t border-white/5">
                <span>SRM Institute of Science & Technology • Department of Computer Science</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">→</kbd> to begin</span>
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 02: THE ATTENDANCE CRISIS
             ========================================== */}
          {currentSlide === 1 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#FF4D6D] uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  The Problem Landscape
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  The Vulnerability of Modern University Classrooms
                </h2>
                <p className="text-sm text-[#9090B0] max-w-3xl">
                  Traditional attendance methods and primitive QR code systems are easily circumvented by modern students across four critical attack vectors.
                </p>
              </div>

              {/* 4 Crisis Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
                <div className="p-4 rounded-2xl bg-[#FF4D6D]/5 border border-[#FF4D6D]/20">
                  <div className="flex items-center gap-2.5 text-[#FF4D6D] font-semibold text-sm mb-2">
                    <Smartphone className="w-4 h-4" />
                    1. WhatsApp & Telegram QR Forwarding
                  </div>
                  <p className="text-xs text-[#A0A0B8] leading-relaxed">
                    A single present student takes a photo of the static projector screen and broadcasts it to group chats. Absent students in hostels or cafes scan and mark attendance within seconds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFB800]/5 border border-[#FFB800]/20">
                  <div className="flex items-center gap-2.5 text-[#FFB800] font-semibold text-sm mb-2">
                    <Users className="w-4 h-4" />
                    2. Buddy Punching & Multi-Account Swapping
                  </div>
                  <p className="text-xs text-[#A0A0B8] leading-relaxed">
                    One physically present student logs out and sequentially logs into 5 different absent friends&apos; accounts on a single smartphone, punching in for the entire friend group.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#00F2FE]/5 border border-[#00F2FE]/20">
                  <div className="flex items-center gap-2.5 text-[#00F2FE] font-semibold text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    3. Mock GPS & Location Spoofing Apps
                  </div>
                  <p className="text-xs text-[#A0A0B8] leading-relaxed">
                    Android developer mock location apps easily fake student GPS coordinates to match hardcoded classroom coordinates, defeating primitive campus boundary checks.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#A594FD]/5 border border-[#A594FD]/20">
                  <div className="flex items-center gap-2.5 text-[#A594FD] font-semibold text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    4. The 20% Instruction Time Tax
                  </div>
                  <p className="text-xs text-[#A0A0B8] leading-relaxed">
                    Calling 60 names manually wastes 10–15 minutes of every 45-minute period (up to 33% of lecture time). Biometric fingerprint scanners create massive hallway choke points.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs text-[#B0B0C8]">
                <span><strong>Impact:</strong> Inaccurate academic records, compromised accreditation compliance, and massive lost teaching hours.</span>
                <span className="text-[#00F2FE] font-medium font-mono">QAttendance Solution →</span>
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 03: ZERO-TRUST PARADIGM
             ========================================== */}
          {currentSlide === 2 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#00F2FE] uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Security Paradigm Shift
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  The Zero-Trust Architecture
                </h2>
                <p className="text-sm text-[#9090B0] max-w-3xl">
                  Applying military-grade zero-trust principles to university attendance: <span className="text-white font-semibold">&ldquo;Never Trust, Always Verify.&rdquo;</span>
                </p>
              </div>

              {/* Comparison Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
                <div className="p-5 rounded-2xl bg-[#FF4D6D]/5 border border-[#FF4D6D]/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FF4D6D]">Traditional Approach</span>
                      <XCircle className="w-4 h-4 text-[#FF4D6D]" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">Static Perimeter Trust</h3>
                    <ul className="space-y-2 text-xs text-[#9090A8]">
                      <li className="flex items-start gap-2">
                        <X className="w-3.5 h-3.5 text-[#FF4D6D] shrink-0 mt-0.5" />
                        <span>Assumes valid credentials = valid physical presence in seat.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="w-3.5 h-3.5 text-[#FF4D6D] shrink-0 mt-0.5" />
                        <span>Static QR code printed or projected for 45 minutes straight.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="w-3.5 h-3.5 text-[#FF4D6D] shrink-0 mt-0.5" />
                        <span>No verification of hardware uniqueness or mock GPS sensors.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#FF4D6D]/20 text-[11px] text-[#FF7088] font-mono">
                    Result: Rampant proxy attendance (15–30% fraud rate).
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#6E5BFF]/10 border border-[#6E5BFF]/30 flex flex-col justify-between shadow-[0_0_20px_rgba(110,91,255,0.15)]">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#A594FD]">QAttendance Zero-Trust</span>
                      <CheckCircle2 className="w-4 h-4 text-[#00F5A0]" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">Continuous Multi-Factor Proof</h3>
                    <ul className="space-y-2 text-xs text-[#D0D0E8]">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#00F5A0] shrink-0 mt-0.5" />
                        <span><strong>Spatial:</strong> Live Haversine distance ≤ 50m from Faculty Laptop host.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#00F5A0] shrink-0 mt-0.5" />
                        <span><strong>Temporal & Crypto:</strong> 10-second HMAC token + Single-use nonce ledger.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#00F5A0] shrink-0 mt-0.5" />
                        <span><strong>Physical Hardware:</strong> Canvas 2D / WebGL fingerprint locked 1:1 to student.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#6E5BFF]/30 text-[11px] text-[#00F5A0] font-mono">
                    Result: 0% proxy breach rate across all evaluated vectors.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#8080A0]">
                <span>Every attendance transaction is cryptographically signed, spatially anchored, and hardware-bound.</span>
                <span className="text-[#6E5BFF] font-semibold">Tier Breakdown Next →</span>
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 04: THE 7-TIER SHIELD (INTERACTIVE)
             ========================================== */}
          {currentSlide === 3 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#00F5A0] uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    Core Innovation
                  </div>
                  <span className="text-[11px] text-[#8080A0] font-mono">Click tiers to inspect layers</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-1">
                  The 7-Tier Zero-Trust Anti-Proxy Shield
                </h2>
                <p className="text-xs text-[#9090B0]">
                  A multi-layered defense in depth where bypassing one tier still leaves six uncompromised barriers.
                </p>
              </div>

              {/* Interactive 7-Tier Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-auto items-center">
                {/* 7 Buttons Left Column */}
                <div className="lg:col-span-6 space-y-1.5">
                  {[
                    { id: 1, name: "Tier 1: 10s Rotating HMAC QR", desc: "Regenerated every 10,000ms with session secret", color: "#6E5BFF" },
                    { id: 2, name: "Tier 2: Host-to-Student GPS Haversine", desc: "Dual-node live spherical distance ≤ 50m", color: "#00F2FE" },
                    { id: 3, name: "Tier 3: Hardware Device Binding", desc: "Canvas 2D + WebGL fingerprint locked 1:1", color: "#00F5A0" },
                    { id: 4, name: "Tier 4: Single-Device Multi-Account Trap", desc: "Instant breach flag on multi-account logins", color: "#FFB800" },
                    { id: 5, name: "Tier 5: Single-Use Nonce Ledger", desc: "Token nonce burned immediately upon check-in", color: "#FF4D6D" },
                    { id: 6, name: "Tier 6: GPS Sensor & Mock Defense", desc: "Accuracy radius and timestamp drift analysis", color: "#A594FD" },
                    { id: 7, name: "Tier 7: Real-Time Projector Telemetry", desc: "Live WebSocket feed with faculty manual override", color: "#38EF7D" }
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setActiveTier(tier.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between border ${
                        activeTier === tier.id 
                          ? "bg-white/10 border-white/30 shadow-[0_0_15px_rgba(110,91,255,0.25)]" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0"
                          style={{ backgroundColor: `${tier.color}30`, color: tier.color, border: `1px solid ${tier.color}60` }}
                        >
                          {tier.id}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-white">{tier.name}</div>
                          <div className="text-[10px] text-[#808098] hidden sm:block">{tier.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTier === tier.id ? "text-white translate-x-0.5" : "text-[#505060]"}`} />
                    </button>
                  ))}
                </div>

                {/* Detailed Tier Inspector Card */}
                <div className="lg:col-span-6 p-5 rounded-2xl bg-[#111220] border border-[#2B2D44] shadow-card flex flex-col justify-between min-h-[260px]">
                  {activeTier === 1 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#6E5BFF]">
                        <QrCode className="w-4 h-4" />
                        TIER 1: 10-SECOND ROTATING HMAC-SHA256
                      </div>
                      <h4 className="text-sm font-semibold text-white">Neutralizes: WhatsApp / Telegram Screenshot Sharing</h4>
                      <p className="text-xs text-[#A0A0B8] leading-relaxed">
                        The faculty projector displays an HMAC-SHA256 token derived from a 256-bit session secret and the current 10-second epoch slice. Even if a student forwards a photo immediately, it expires before the absent recipient can scan it.
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-[#A594FD]">
                        HMAC-SHA256(Secret, SessionID + (Timestamp / 10000))
                      </div>
                    </div>
                  )}

                  {activeTier === 2 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#00F2FE]">
                        <Compass className="w-4 h-4" />
                        TIER 2: DUAL-NODE HAVERSINE GPS GEOFENCE
                      </div>
                      <h4 className="text-sm font-semibold text-white">Neutralizes: Off-Campus & Dormitory Remote Check-Ins</h4>
                      <p className="text-xs text-[#A0A0B8] leading-relaxed">
                        Rather than fixed static room coordinates, QAttendance dynamically computes the live spherical distance in meters between the Faculty Host&apos;s laptop and the student&apos;s phone. Anyone outside the 50m radius is rejected.
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-[#00F2FE]">
                        Haversine(Lat1, Lon1, Lat2, Lon2) ≤ 50.0 meters
                      </div>
                    </div>
                  )}

                  {activeTier === 3 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#00F5A0]">
                        <Fingerprint className="w-4 h-4" />
                        TIER 3: HARDWARE DEVICE BINDING
                      </div>
                      <h4 className="text-sm font-semibold text-white">Neutralizes: Device Borrowing & Account Lending</h4>
                      <p className="text-xs text-[#A0A0B8] leading-relaxed">
                        Extracts a high-entropy hardware signature (Canvas 2D pixel rendering, WebGL vendor, CPU threads, screen color depth). Binds exactly 1 student registration number to 1 physical device.
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-[#00F5A0]">
                        HardwareFingerprint === StudentDeviceBindingRegistry
                      </div>
                    </div>
                  )}

                  {activeTier === 4 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#FFB800]">
                        <Users className="w-4 h-4" />
                        TIER 4: SINGLE-DEVICE MULTI-ACCOUNT TRAP
                      </div>
                      <h4 className="text-sm font-semibold text-white">Neutralizes: Buddy Punching / Multi-Account Swapping</h4>
                      <p className="text-xs text-[#A0A0B8] leading-relaxed">
                        If a student in class attempts to log out and log in with an absent friend&apos;s account, the system identifies identical hardware signatures within the same period and flags both accounts with a Proxy Alert.
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-[#FFB800]">
                        ActiveDevicesInPeriod.has(DeviceID) → PROXY_FLAGGED
                      </div>
                    </div>
                  )}

                  {activeTier === 5 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#FF4D6D]">
                        <Lock className="w-4 h-4" />
                        TIER 5: SINGLE-USE NONCE LEDGER
                      </div>
                      <h4 className="text-sm font-semibold text-white">Neutralizes: Network Replay & Packet Sniffing</h4>
                      <p className="text-xs text-[#A0A0B8] leading-relaxed">
                        Every redeemed QR token hash is checked against an in-memory nonce ledger with automatic TTL expiration. Once consumed, the token is permanently burned and cannot be sent again.
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-[#FF4D6D]">
                        NonceLedger.add(TokenHash) → Burn Immediately
                      </div>
                    </div>
                  )}

                  {activeTier === 6 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#A594FD]">
                        <Radio className="w-4 h-4" />
                        TIER 6: GPS SENSOR INTEGRITY & MOCK DEFENSE
                      </div>
                      <h4 className="text-sm font-semibold text-white">Neutralizes: Fake GPS & Mock Location Apps</h4>
                      <p className="text-xs text-[#A0A0B8] leading-relaxed">
                        Validates the browser Geolocation accuracy radius (accuracy &lt; 30m), timestamp freshness, and coordinate variance to discard synthetic developer mock location feeds.
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-[#A594FD]">
                        coords.accuracy ≤ 30m &amp;&amp; timestampFreshness &lt; 5000ms
                      </div>
                    </div>
                  )}

                  {activeTier === 7 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#38EF7D]">
                        <ShieldCheck className="w-4 h-4" />
                        TIER 7: REAL-TIME PROJECTOR TELEMETRY
                      </div>
                      <h4 className="text-sm font-semibold text-white">Neutralizes: Unnoticed Edge Cases & False Claims</h4>
                      <p className="text-xs text-[#A0A0B8] leading-relaxed">
                        The faculty projector stream updates instantly via Supabase WebSockets. Verified check-ins show exact distance badges (&ldquo;Verified: 4m&rdquo;), while any suspicious attempt alerts the professor for immediate visual verification.
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-[#38EF7D]">
                        Supabase Realtime WebSocket broadcast &rarr; Faculty HUD
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#808098]">
                    <span>Status: <strong className="text-[#00F5A0]">Active & Enforced</strong></span>
                    <span className="font-mono text-[#6E5BFF]">Zero-Trust Pass</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#707090] text-center">
                All 7 tiers execute simultaneously within sub-300ms server action response time.
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 05: CRYPTO TOKEN & QR SIMULATOR
             ========================================== */}
          {currentSlide === 4 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6E5BFF] uppercase tracking-wider mb-2">
                  <Lock className="w-4 h-4" />
                  Cryptographic Mathematics
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  10-Second Rotating HMAC-SHA256 Token Lifecycle
                </h2>
                <p className="text-xs text-[#9090B0]">
                  Mathematical token generation preventing screenshot dissemination and relay attacks.
                </p>
              </div>

              {/* Live Simulator & Math Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-auto items-center">
                {/* Left: Live QR Simulator Widget */}
                <div className="md:col-span-5 p-5 rounded-2xl bg-[#111220] border border-[#2B2D44] flex flex-col items-center text-center shadow-card">
                  <div className="text-xs font-bold text-[#A594FD] uppercase tracking-wider mb-3">
                    Live Token Generator
                  </div>

                  {/* Animated QR Box */}
                  <div className="w-36 h-36 bg-white p-2.5 rounded-2xl shadow-[0_0_25px_rgba(110,91,255,0.3)] flex items-center justify-center relative overflow-hidden mb-3">
                    <QrCode className="w-full h-full text-black" />
                    {/* Pulsing overlay */}
                    <div className="absolute inset-0 bg-[#6E5BFF]/10 animate-pulse pointer-events-none" />
                  </div>

                  {/* Countdown circular indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-3.5 h-3.5 text-[#00F2FE] animate-spin" />
                    <span className="text-xs font-mono text-[#00F2FE]">
                      Rotates in: <strong>{qrCountdown}s</strong>
                    </span>
                  </div>

                  <div className="w-full bg-black/50 p-2 rounded-lg border border-white/10 text-[10px] font-mono text-[#8080A8] truncate">
                    Hash: {qrToken}
                  </div>
                </div>

                {/* Right: Technical Explanation */}
                <div className="md:col-span-7 space-y-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                    <div className="text-xs font-bold text-white mb-1">1. Time Window Slicing</div>
                    <p className="text-xs text-[#9090A8]">
                      Timestamp is divided by 10,000ms: <code className="text-[#00F2FE] font-mono">T = Math.floor(now / 10000)</code>. This discretizes time into synchronized 10-second slots.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                    <div className="text-xs font-bold text-white mb-1">2. HMAC-SHA256 Signing</div>
                    <p className="text-xs text-[#9090A8]">
                      A 256-bit cryptographically secure random session secret signs <code className="text-[#A594FD] font-mono">SessionID:TimeWindow</code>. The signature cannot be forged without the secret.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                    <div className="text-xs font-bold text-white mb-1">3. Latency Tolerance & Nonce Burn</div>
                    <p className="text-xs text-[#9090A8]">
                      Validates window <code className="text-[#00F5A0] font-mono">T</code> and <code className="text-[#00F5A0] font-mono">T-1</code> (20s grace for cell networks), then immediately burns the nonce key in memory.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#707090] text-center">
                Screenshots forwarded via WhatsApp become useless within 10 seconds of capture.
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 06: DUAL-NODE HAVERSINE GPS (INTERACTIVE)
             ========================================== */}
          {currentSlide === 5 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#00F2FE] uppercase tracking-wider mb-2">
                  <Compass className="w-4 h-4" />
                  Spatial Verification
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Dual-Node Haversine GPS Geofencing
                </h2>
                <p className="text-xs text-[#9090B0]">
                  Dynamic geofencing anchored to the Faculty Member&apos;s laptop rather than static campus maps.
                </p>
              </div>

              {/* Interactive Distance Slider Simulator */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-auto items-center">
                {/* Left: Distance Slider Box */}
                <div className="md:col-span-6 p-5 rounded-2xl bg-[#111220] border border-[#2B2D44] shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#A594FD] uppercase tracking-wider">Distance Simulator</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono ${
                      simulatedDistance <= 50 
                        ? "bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40" 
                        : "bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40"
                    }`}>
                      {simulatedDistance <= 50 ? "✓ WITHIN GEOFENCE" : "✗ GEOFENCE REJECTED"}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-[#8080A0] mb-1">
                      <span>Faculty Host (0m)</span>
                      <span className="text-white font-bold font-mono text-sm">{simulatedDistance} meters</span>
                      <span>100m Max</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={simulatedDistance}
                      onChange={(e) => setSimulatedDistance(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6E5BFF]"
                    />
                  </div>

                  {/* Live Haversine Result Badge */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    simulatedDistance <= 50 
                      ? "bg-[#00F5A0]/5 border-[#00F5A0]/30 text-[#D0F0E0]" 
                      : "bg-[#FF4D6D]/5 border-[#FF4D6D]/30 text-[#FFD0D8]"
                  }`}>
                    <div>
                      <div className="font-semibold">Check-In Status:</div>
                      <div className="text-[11px] opacity-80">
                        {simulatedDistance <= 50 
                          ? `Eligible for attendance (${simulatedDistance}m ≤ 50m threshold)` 
                          : `Rejected: Student is ${simulatedDistance - 50}m outside classroom perimeter`}
                      </div>
                    </div>
                    <div className="text-xl font-bold font-mono">
                      {simulatedDistance <= 50 ? "PASS" : "FAIL"}
                    </div>
                  </div>
                </div>

                {/* Right: Mathematical Formula */}
                <div className="md:col-span-6 space-y-3">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <div className="text-xs font-bold text-[#00F2FE]">Haversine Great-Circle Formula</div>
                    <div className="font-mono text-[11px] text-[#A594FD] leading-relaxed">
                      a = sin²(Δφ/2) + cos(φ1) · cos(φ2) · sin²(Δλ/2)<br/>
                      c = 2 · atan2(√a, √(1−a))<br/>
                      Distance = R · c &nbsp; (Earth Radius R = 6,371,000m)
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-[#9090A8] leading-relaxed">
                    <strong className="text-white">Why Dual-Node is superior:</strong> If a class moves to an ad-hoc room, practical lab, or seminar hall, the faculty laptop automatically defines the new coordinate origin. Zero admin re-configuration needed.
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#707090] text-center">
                Eliminates GPS spoofing when combined with Tier 6 sensor accuracy analysis.
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 07: HARDWARE FINGERPRINTING
             ========================================== */}
          {currentSlide === 6 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#00F5A0] uppercase tracking-wider mb-2">
                  <Fingerprint className="w-4 h-4" />
                  Hardware Security
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  High-Entropy Hardware Device Fingerprinting
                </h2>
                <p className="text-xs text-[#9090B0]">
                  Binding 1 Student Account to 1 Physical Smartphone to defeat buddy punching.
                </p>
              </div>

              {/* Hardware Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-auto">
                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#6E5BFF]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Canvas 2D Rendering
                  </div>
                  <p className="text-[11px] text-[#8080A0] leading-relaxed">
                    Draws hidden 2D geometric paths & gradients; extracts base64 pixel data. Variations in GPU shaders and font rasterizers create a unique signature per physical phone.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00F2FE]">
                    <Cpu className="w-3.5 h-3.5" />
                    WebGL GPU Unmasking
                  </div>
                  <p className="text-[11px] text-[#8080A0] leading-relaxed">
                    Queries <code className="text-[#00F2FE] font-mono">UNMASKED_RENDERER_WEBGL</code> and vendor strings directly from the mobile GPU pipeline (Apple A16 / Adreno / Mali).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00F5A0]">
                    <Smartphone className="w-3.5 h-3.5" />
                    Hardware Concurrency
                  </div>
                  <p className="text-[11px] text-[#8080A0] leading-relaxed">
                    Combines CPU core counts, color depth, pixel ratios, touch points, and timezone offset to generate an unalterable device SHA-256 fingerprint.
                  </p>
                </div>
              </div>

              {/* Multi-Account Trap Visual */}
              <div className="p-3.5 rounded-xl bg-[#FFB800]/5 border border-[#FFB800]/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#FFB800] shrink-0" />
                  <span className="text-[#D0C080]">
                    <strong>Single-Device Multi-Account Trap:</strong> Attempting to log into multiple student accounts on the same phone in the same class session automatically flags all involved accounts.
                  </span>
                </div>
                <span className="text-[#FFB800] font-mono font-semibold shrink-0 ml-3">Proxy Trap Active</span>
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 08: FACULTY COMMAND CENTER
             ========================================== */}
          {currentSlide === 7 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#A594FD] uppercase tracking-wider mb-2">
                  <Users className="w-4 h-4" />
                  Educator Experience
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  The Faculty Command Center
                </h2>
                <p className="text-xs text-[#9090B0]">
                  The personal command hub of the individual professor managing multiple courses, electives, and labs.
                </p>
              </div>

              {/* 3 Faculty Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
                <div className="p-4 rounded-2xl bg-[#111220] border border-[#252840] flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-[#6E5BFF]/20 text-[#A594FD] flex items-center justify-center font-bold mb-3">
                      1
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Reusable Course Presets</h3>
                    <p className="text-xs text-[#9090A8] leading-relaxed">
                      Configure <code className="text-[#00F2FE]">DBMS Core</code>, <code className="text-[#00F2FE]">Cloud Elective Batch B</code>, or <code className="text-[#00F2FE]">Lab Group 1</code> once. Launch weekly with 1 click — zero student re-entry.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-[#6E5BFF] font-semibold">1-Click Launch →</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#111220] border border-[#252840] flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-[#00F2FE]/20 text-[#00F2FE] flex items-center justify-center font-bold mb-3">
                      2
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Classroom vs Lab Venues</h3>
                    <p className="text-xs text-[#9090A8] leading-relaxed">
                      3-way venue toggle: Theory Halls, Practical Labs, and Seminar Halls. Campus chips for instant room routing (<code className="text-[#00F5A0]">TP 602</code>, <code className="text-[#00F5A0]">Lab 3</code>, <code className="text-[#00F5A0]">UB 501</code>).
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-[#00F2FE] font-semibold">Adaptive Geotagging →</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#111220] border border-[#252840] flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-[#00F5A0]/20 text-[#00F5A0] flex items-center justify-center font-bold mb-3">
                      3
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Weekly Matrix & PDF Register</h3>
                    <p className="text-xs text-[#9090A8] leading-relaxed">
                      Interactive Monday–Saturday period grid (Periods 1–8). Instant single-click CSV export and print-formatted academic registers for institutional audits.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-[#00F5A0] font-semibold">Instant Audit Reports →</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs text-[#9090A8]">
                <span>Designed for professors teaching 4–6 distinct student batches across different academic blocks.</span>
                <span className="text-white font-mono">Zero administrative friction</span>
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 09: LIVE PROJECTOR & 45-MIN MATRIX
             ========================================== */}
          {currentSlide === 8 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#FFB800] uppercase tracking-wider mb-2">
                  <Clock className="w-4 h-4" />
                  Academic Workflow
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Live Projector Mode & 45-Min Academic Period Structure
                </h2>
                <p className="text-xs text-[#9090B0]">
                  Structured lecture timing that protects instructional delivery and automates check-in.
                </p>
              </div>

              {/* 45-Min Timeline Visual */}
              <div className="space-y-4 my-auto">
                <div className="p-4 rounded-2xl bg-[#111220] border border-[#2B2D44] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white uppercase tracking-wide">45-Minute Period Breakdown</span>
                    <span className="text-[#00F2FE] font-mono">Periods 1 to 8 (8:00 AM – 4:00 PM)</span>
                  </div>

                  {/* Two Phase Progress Bar */}
                  <div className="w-full h-8 rounded-xl bg-black/50 p-1 flex gap-1 border border-white/10">
                    <div className="w-[78%] h-full rounded-lg bg-gradient-to-r from-[#6E5BFF] to-[#5040DD] flex items-center justify-center text-[11px] font-bold text-white">
                      Teaching & Lecture Phase (First 35 Minutes)
                    </div>
                    <div className="w-[22%] h-full rounded-lg bg-gradient-to-r from-[#00F5A0] to-[#00F2FE] flex items-center justify-center text-[11px] font-bold text-black animate-pulse">
                      Live QR (10m)
                    </div>
                  </div>

                  <div className="grid grid-cols-2 text-xs text-[#8080A0] pt-1">
                    <div>✓ Uninterrupted presentation, coding, and theory discussion.</div>
                    <div className="text-right">✓ Automated rotating QR display on projector.</div>
                  </div>
                </div>

                {/* Live Telemetry Ticker Mock */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-ping" />
                    <span className="text-[#C0C0D8]">Live Stream:</span>
                    <span className="font-mono text-[#00F5A0]">RA2412012010001 (CR) • Verified (4m)</span>
                    <span className="text-[#505070]">|</span>
                    <span className="font-mono text-[#00F2FE]">RA2412012010014 • Verified (6m)</span>
                  </div>
                  <span className="text-[#00F5A0] font-mono font-semibold">58 / 60 Present (96.7%)</span>
                </div>
              </div>

              <div className="text-xs text-[#707090] text-center">
                Faculty can fullscreen the projector HUD with a single keystroke.
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 10: STUDENT EXPERIENCE
             ========================================== */}
          {currentSlide === 9 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#00F5A0] uppercase tracking-wider mb-2">
                  <Smartphone className="w-4 h-4" />
                  Student Experience
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Instant Mobile Scanner & Personal Attendance Log
                </h2>
                <p className="text-xs text-[#9090B0]">
                  Zero app downloads required. Runs natively in any mobile browser as an ultra-fast PWA.
                </p>
              </div>

              {/* Student Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-auto">
                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="text-xs font-bold text-[#6E5BFF]">1. Direct REG Auth</div>
                  <p className="text-[11px] text-[#8080A0]">
                    Log in with University Reg No (<code className="text-white">RA2412...</code>) and secure password.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="text-xs font-bold text-[#00F2FE]">2. In-Browser Scanner</div>
                  <p className="text-[11px] text-[#8080A0]">
                    High-speed HTML5 camera scanner with automatic high-accuracy GPS lock in &lt; 1s.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="text-xs font-bold text-[#00F5A0]">3. Instant Feedback</div>
                  <p className="text-[11px] text-[#8080A0]">
                    Live confirmation badge: <strong className="text-[#00F5A0]">&ldquo;Verified: 6m from Host&rdquo;</strong> with zero latency.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="text-xs font-bold text-[#FFB800]">4. &ldquo;My Log&rdquo; Analytics</div>
                  <p className="text-[11px] text-[#8080A0]">
                    Personal attendance dashboard with automatic warnings if percentage drops below 75%.
                  </p>
                </div>
              </div>

              {/* < 75% Debarment Warning Callout */}
              <div className="p-3.5 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 flex items-center justify-between text-xs text-[#FFA0B0]">
                <span>
                  <strong>75% Mandatory Attendance Safeguard:</strong> Students receive real-time notifications when their attendance percentage approaches the debarment threshold.
                </span>
                <span className="font-mono font-bold text-[#FF4D6D]">Automated Audit</span>
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 11: MASTER ROSTER & BULK COHORTS
             ========================================== */}
          {currentSlide === 10 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#A594FD] uppercase tracking-wider mb-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Cohort Ingestion
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Master Roster & Bulk Cohort Management
                </h2>
                <p className="text-xs text-[#9090B0]">
                  Frictionless onboarding of entire university departments and elective groups in seconds.
                </p>
              </div>

              {/* Roster Ingestion Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
                <div className="p-4 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="text-xs font-bold text-[#6E5BFF]">Multi-Format CSV / XSV Parser</div>
                  <p className="text-xs text-[#8080A0] leading-relaxed">
                    Uploads university roster files in <code className="text-white">.csv</code>, <code className="text-white">.xsv</code>, <code className="text-white">.tsv</code>, or <code className="text-white">.txt</code> format with auto-column mapping.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="text-xs font-bold text-[#00F2FE]">Inline Validation Table</div>
                  <p className="text-xs text-[#8080A0] leading-relaxed">
                    Instant preview of parsed students with automatic duplicate Reg No detection and role assignment before committing to database.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#111220] border border-[#222436] space-y-2">
                  <div className="text-xs font-bold text-[#00F5A0]">Single-Student Quick Enroll</div>
                  <p className="text-xs text-[#8080A0] leading-relaxed">
                    Quick modal to add late-admission students or transfer students without re-uploading the entire class CSV.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs text-[#8080A8]">
                <span>Downloadable sample template (<code className="text-[#00F2FE]">Roster_Upload_Template.csv</code>) provided directly in the faculty dashboard.</span>
                <span className="text-[#00F5A0] font-semibold font-mono">Zero Setup Hassle</span>
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 12: TECH STACK & ARCHITECTURE
             ========================================== */}
          {currentSlide === 11 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#00F2FE] uppercase tracking-wider mb-2">
                  <Server className="w-4 h-4" />
                  Engineering Excellence
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Full-Stack Architecture & Database Landscape
                </h2>
                <p className="text-xs text-[#9090B0]">
                  Modern, reactive, and scalable stack built for low latency and high concurrency.
                </p>
              </div>

              {/* Stack Architecture Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto">
                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-1.5">
                  <div className="text-xs font-bold text-white">Next.js 16</div>
                  <div className="text-[10px] text-[#6E5BFF] font-mono">App Router + Turbopack</div>
                  <p className="text-[11px] text-[#8080A0]">React 19 Server Actions &amp; streaming SSR.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-1.5">
                  <div className="text-xs font-bold text-white">Drizzle ORM</div>
                  <div className="text-[10px] text-[#00F2FE] font-mono">PostgreSQL Database</div>
                  <p className="text-[11px] text-[#8080A0]">Type-safe SQL schemas with 11 relational tables.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-1.5">
                  <div className="text-xs font-bold text-white">Supabase Realtime</div>
                  <div className="text-[10px] text-[#00F5A0] font-mono">WebSockets Telemetry</div>
                  <p className="text-[11px] text-[#8080A0]">Sub-50ms live broadcast to faculty projector.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111220] border border-[#222436] space-y-1.5">
                  <div className="text-xs font-bold text-white">Web Push PWA</div>
                  <div className="text-[10px] text-[#FFB800] font-mono">VAPID Service Workers</div>
                  <p className="text-[11px] text-[#8080A0]">Native push notifications on mobile browsers.</p>
                </div>
              </div>

              {/* 11 Relational Tables Summary Bar */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[#A594FD]">
                <span className="text-white font-bold">11 Tables:</span>
                <span className="px-2 py-0.5 rounded bg-white/5">re_users</span>
                <span className="px-2 py-0.5 rounded bg-white/5">re_classes</span>
                <span className="px-2 py-0.5 rounded bg-white/5">re_class_roster</span>
                <span className="px-2 py-0.5 rounded bg-white/5">re_sessions</span>
                <span className="px-2 py-0.5 rounded bg-white/5">re_attendance_records</span>
                <span className="px-2 py-0.5 rounded bg-white/5">re_course_presets</span>
                <span className="px-2 py-0.5 rounded bg-white/5">re_timetable_entries</span>
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 13: COMPETITIVE BENCHMARK
             ========================================== */}
          {currentSlide === 12 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#00F5A0] uppercase tracking-wider mb-2">
                  <Award className="w-4 h-4" />
                  Comparative Analysis
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  Competitive Benchmark & Impact Matrix
                </h2>
                <p className="text-xs text-[#9090B0]">
                  How QAttendance compares against conventional attendance mechanisms.
                </p>
              </div>

              {/* Benchmark Table */}
              <div className="overflow-x-auto my-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#8080A0]">
                      <th className="pb-2 font-semibold">Security / Operational Vector</th>
                      <th className="pb-2 font-semibold">Paper Roll Call</th>
                      <th className="pb-2 font-semibold">Static QR Apps</th>
                      <th className="pb-2 font-semibold">Biometric Scanners</th>
                      <th className="pb-2 font-bold text-[#00F5A0]">QAttendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[#C0C0D8]">
                    <tr>
                      <td className="py-2.5 font-medium text-white">WhatsApp Photo Sharing</td>
                      <td className="py-2.5 text-[#FF4D6D]">N/A</td>
                      <td className="py-2.5 text-[#FF4D6D]">❌ 100% Vulnerable</td>
                      <td className="py-2.5 text-white/40">N/A</td>
                      <td className="py-2.5 font-bold text-[#00F5A0]">✅ 0% (10s HMAC)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-white">Buddy Punching / Multi-Account</td>
                      <td className="py-2.5 text-[#FF4D6D]">❌ High Risk</td>
                      <td className="py-2.5 text-[#FF4D6D]">❌ High Risk</td>
                      <td className="py-2.5 text-[#FFB800]">⚠️ Physical line</td>
                      <td className="py-2.5 font-bold text-[#00F5A0]">✅ Trapped (Hardware Lock)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-white">Fake GPS / Mock Location</td>
                      <td className="py-2.5 text-white/40">N/A</td>
                      <td className="py-2.5 text-[#FF4D6D]">❌ Bypassed easily</td>
                      <td className="py-2.5 text-white/40">N/A</td>
                      <td className="py-2.5 font-bold text-[#00F5A0]">✅ Haversine + Sensor Audit</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-white">Lecture Time Lost per Class</td>
                      <td className="py-2.5 text-[#FF4D6D]">10–15 mins (33%)</td>
                      <td className="py-2.5 text-[#FFB800]">5–8 mins</td>
                      <td className="py-2.5 text-[#FF4D6D]">10–12 mins queue</td>
                      <td className="py-2.5 font-bold text-[#00F5A0]">✅ &lt; 2 mins (Automated)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-white">Hardware Capital Cost</td>
                      <td className="py-2.5 text-white/60">$0</td>
                      <td className="py-2.5 text-white/60">$0</td>
                      <td className="py-2.5 text-[#FF4D6D]">$5,000+ per room</td>
                      <td className="py-2.5 font-bold text-[#00F5A0]">✅ $0 (Zero Hardware)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-[#707090] text-center">
                QAttendance delivers maximum security with zero hardware capital expenditure.
              </div>
            </div>
          )}

          {/* ==========================================
              SLIDE 14: ROADMAP & CONCLUSION
             ========================================== */}
          {currentSlide === 13 && (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6E5BFF] uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  Vision & Deployment
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
                  The Future of Academic Presence
                </h2>
                <p className="text-sm text-[#00F2FE] font-medium">
                  Transforming attendance from an administrative burden into an automated zero-trust advantage.
                </p>
              </div>

              {/* 3 Roadmap Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
                <div className="p-4 rounded-2xl bg-[#111220] border border-[#252840] space-y-2">
                  <div className="text-xs font-bold text-[#6E5BFF]">Multi-Campus Federation</div>
                  <p className="text-xs text-[#8080A8] leading-relaxed">
                    Cross-campus synchronization across SRM Kattankulathur, Ramapuram, Vadapalani, and NCR campuses with unified faculty Single Sign-On (SSO).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#111220] border border-[#252840] space-y-2">
                  <div className="text-xs font-bold text-[#00F2FE]">LTI 1.3 LMS Integration</div>
                  <p className="text-xs text-[#8080A8] leading-relaxed">
                    Direct two-way gradebook and roster synchronization with Canvas LMS, Moodle, and Blackboard Learn.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#111220] border border-[#252840] space-y-2">
                  <div className="text-xs font-bold text-[#00F5A0]">Parent & Dean SMS Gateway</div>
                  <p className="text-xs text-[#8080A8] leading-relaxed">
                    Automated proactive alerts to students and guardians whenever attendance drops below the statutory 75% threshold.
                  </p>
                </div>
              </div>

              {/* Final CTA Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#6E5BFF]/20 via-[#00F2FE]/20 to-[#00F5A0]/20 border border-white/20 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Ready for Live Campus Deployment</div>
                  <div className="text-xs text-[#B0B0D0]">Thank you! We welcome your questions & discussion.</div>
                </div>
                <Link
                  href="/tutor"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6E5BFF] to-[#00F2FE] text-black font-bold text-xs shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:opacity-95 transition flex items-center gap-1.5"
                >
                  <span>Launch Live Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Bottom Progress & Slide Controls Bar inside frame */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-[#606080]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#8080A0]">Slide {currentSlide + 1} of {TOTAL_SLIDES}</span>
              <span>•</span>
              <span className="text-[#8080A0]">QAttendance Presentation Deck</span>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span>Use <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">←</kbd> <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">→</kbd> keys</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">P</kbd> for Speaker Notes</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">F</kbd> for Fullscreen</span>
            </div>
          </div>
        </div>
      </main>

      {/* ==========================================
          SPEAKER NOTES DRAWER (Toggle with 'P')
         ========================================== */}
      {showNotes && (
        <div className="h-44 px-8 py-4 bg-[#0A0B12] border-t border-[#6E5BFF]/30 backdrop-blur-xl flex flex-col justify-between z-30 shrink-0">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-[#A594FD]">
              <BookOpen className="w-4 h-4" />
              <span>SPEAKER NOTES • SLIDE {currentSlide + 1} OF {TOTAL_SLIDES}</span>
            </div>
            <button 
              onClick={() => setShowNotes(false)}
              className="text-xs text-[#8080A0] hover:text-white"
            >
              Close (P)
            </button>
          </div>
          <div className="text-xs md:text-sm text-[#D0D0E8] leading-relaxed my-auto overflow-y-auto">
            {speakerNotes[currentSlide]}
          </div>
          <div className="text-[10px] text-[#606080] pt-1 flex justify-between">
            <span>Tip: Switch slides to view synchronized speaker talking points.</span>
            <span>Keyboard shortcut: Press <kbd className="text-white font-mono">P</kbd> to toggle</span>
          </div>
        </div>
      )}

      {/* ==========================================
          SLIDE GRID OVERVIEW MODAL (Toggle with 'O')
         ========================================== */}
      {showOverview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Grid className="w-4 h-4 text-[#6E5BFF]" />
              <span>Slide Deck Overview (14 Slides)</span>
            </div>
            <button 
              onClick={() => setShowOverview(false)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
            >
              Close (ESC)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 py-6 overflow-y-auto flex-1">
            {[
              "01. Title & Vision",
              "02. The Crisis",
              "03. Zero-Trust",
              "04. 7-Tier Shield",
              "05. 10s HMAC Crypto",
              "06. Haversine GPS",
              "07. Hardware Binding",
              "08. Faculty Hub",
              "09. Projector & 45m",
              "10. Student Portal",
              "11. Master Roster",
              "12. Tech Architecture",
              "13. Benchmark Matrix",
              "14. Roadmap & Close"
            ].map((title, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx);
                  setShowOverview(false);
                }}
                className={`p-3 rounded-xl text-left border flex flex-col justify-between aspect-[16/10] transition-all ${
                  currentSlide === idx 
                    ? "bg-[#6E5BFF]/30 border-[#6E5BFF] shadow-[0_0_15px_rgba(110,91,255,0.4)]" 
                    : "bg-[#111220] border-[#222436] hover:border-white/20"
                }`}
              >
                <span className="text-[10px] font-mono text-[#8080A0]">#{idx + 1}</span>
                <span className="text-xs font-semibold text-white leading-tight">{title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
