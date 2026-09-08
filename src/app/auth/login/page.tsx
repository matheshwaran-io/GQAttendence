"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  studentLoginWithPasswordAction, 
  tutorLoginWithPasswordAction, 
  requestOtpAction, 
  verifyOtpAction, 
  getSeededProgrammesAction 
} from "@/app/actions/auth";
import { 
  GraduationCap, 
  BookOpen, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff,
  ShieldCheck,
  User,
  Mail,
  Key
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Mode: "student" or "tutor"
  const [roleMode, setRoleMode] = useState<"student" | "tutor">("student");
  // Login type: "password" or "otp"
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  // OTP Step: "credentials" or "otp"
  const [otpStep, setOtpStep] = useState<"credentials" | "otp">("credentials");

  // Inputs
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  // States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRoleToggle = (role: "student" | "tutor") => {
    setRoleMode(role);
    setErrorMsg("");
    setSuccessMsg("");
    setOtpStep("credentials");
  };

  // 1. Direct Student & Faculty Password Login
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (roleMode === "student") {
      if (!regNo.trim()) {
        setErrorMsg("Registration Number is required.");
        return;
      }
      if (!password.trim()) {
        setErrorMsg("Password is required.");
        return;
      }

      startTransition(async () => {
        const res = await studentLoginWithPasswordAction(regNo, password);
        if (res.success) {
          setSuccessMsg(res.message || "Authentication verified. Entering portal...");
          setTimeout(() => {
            router.push("/student");
            router.refresh();
          }, 600);
        } else {
          setErrorMsg(res.error || "Invalid registration number or password.");
        }
      });
    } else {
      // Tutor / Faculty Login
      const identifier = email || regNo;
      if (!identifier.trim()) {
        setErrorMsg("Faculty Email or ID is required.");
        return;
      }
      if (!password.trim()) {
        setErrorMsg("Password is required.");
        return;
      }

      startTransition(async () => {
        const res = await tutorLoginWithPasswordAction(identifier, password);
        if (res.success) {
          setSuccessMsg("Faculty authentication verified. Loading dashboard...");
          setTimeout(() => {
            router.push("/tutor");
            router.refresh();
          }, 600);
        } else {
          setErrorMsg(res.error || "Faculty login failed.");
        }
      });
    }
  };

  // 2. Request OTP (Fallback)
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Email is required for OTP verification.");
      return;
    }

    if (roleMode === "student" && !regNo) {
      setErrorMsg("Registration number is required.");
      return;
    }

    startTransition(async () => {
      const res = await requestOtpAction(email, regNo, roleMode === "tutor");
      if (res.success) {
        setSuccessMsg(res.message || "Security code dispatched to your inbox.");
        setOtpStep("otp");
      } else {
        setErrorMsg(res.error || "Failed to request code.");
      }
    });
  };

  // 3. Verify OTP (Fallback)
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!otp || otp.length < 6) {
      setErrorMsg("Please enter the 6-digit OTP.");
      return;
    }

    startTransition(async () => {
      const res = await verifyOtpAction(email, otp);
      if (res.success) {
        setSuccessMsg("Verification confirmed.");
        setTimeout(() => {
          if (roleMode === "tutor") {
            router.push("/tutor");
          } else {
            router.push("/student");
          }
          router.refresh();
        }, 600);
      } else {
        setErrorMsg(res.error || "Invalid security code.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0FF] flex flex-col items-center justify-center p-4 sm:p-6 select-none relative">
      {/* Brand Header */}
      <div className="w-full max-w-[390px] flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#6E5BFF] flex items-center justify-center shadow-[0_0_24px_rgba(110,91,255,0.4)]">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#F0F0FF]">
            GQ-Attendance<span className="text-[#6E5BFF]">.</span>
          </h1>
        </div>
        <p className="text-xs text-[#9090A8] font-normal">
          QR &amp; Geolocation-Based Anti-Proxy System
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[390px] bg-[#111118] border border-[#222230] rounded-2xl p-6 shadow-card flex flex-col gap-6">
        {/* Role Selector Pill */}
        <div className="grid grid-cols-2 bg-[#1A1A24] border border-[#222230] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleRoleToggle("student")}
            className={`py-2 text-xs font-medium rounded-lg transition duration-150 flex items-center justify-center gap-1.5 ${
              roleMode === "student"
                ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
                : "text-[#9090A8] hover:text-[#F0F0FF]"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Student Login
          </button>
          <button
            type="button"
            onClick={() => handleRoleToggle("tutor")}
            className={`py-2 text-xs font-medium rounded-lg transition duration-150 flex items-center justify-center gap-1.5 ${
              roleMode === "tutor"
                ? "bg-[#6E5BFF] text-white shadow-[0_0_16px_rgba(110,91,255,0.3)] font-semibold"
                : "text-[#9090A8] hover:text-[#F0F0FF]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Faculty Portal
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 bg-[#FF4D6A18] border border-[#FF4D6A30] rounded-xl flex items-start gap-2.5 text-xs text-[#FF4D6A]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-[#22C97A18] border border-[#22C97A30] rounded-xl flex items-start gap-2.5 text-xs text-[#22C97A]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {loginMethod === "password" ? (
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
            {roleMode === "student" ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9090A8] font-medium flex items-center justify-between">
                  <span>Registration Number</span>
                  <span className="text-[11px] font-mono text-[#50505E]">RA2412...</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="RA2412012010001"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2.5 px-3.5 text-xs text-[#F0F0FF] placeholder-[#50505E] font-mono tracking-wider focus:outline-none focus:border-[#6E5BFF] focus:ring-2 focus:ring-[#6E5BFF18] transition duration-150"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9090A8] font-medium">
                  Faculty Email / ID
                </label>
                <input
                  type="text"
                  placeholder="tutor@srmist.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2.5 px-3.5 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] focus:ring-2 focus:ring-[#6E5BFF18] transition duration-150"
                  required
                  autoComplete="email"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#9090A8] font-medium flex items-center justify-between">
                <span>Password</span>
                <span className="text-[11px] text-[#50505E] font-mono">Default: srm@123</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] focus:ring-2 focus:ring-[#6E5BFF18] transition duration-150"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#50505E] hover:text-[#9090A8] transition duration-150"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#6E5BFF] hover:bg-[#5C48EE] text-white font-medium py-3 rounded-xl transition duration-150 shadow-[0_0_24px_rgba(110,91,255,0.25)] flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                `Enter ${roleMode === "student" ? "Student" : "Faculty"} Portal`
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={otpStep === "credentials" ? handleRequestOtp : handleVerifyOtp} className="flex flex-col gap-4">
            {otpStep === "credentials" ? (
              <>
                {roleMode === "student" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#9090A8] font-medium">Registration Number</label>
                    <input
                      type="text"
                      placeholder="RA2412012010001"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                      className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2.5 px-3.5 text-xs text-[#F0F0FF] placeholder-[#50505E] font-mono tracking-wider focus:outline-none focus:border-[#6E5BFF] transition duration-150"
                      required
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">SRM Official Email</label>
                  <input
                    type="email"
                    placeholder="student@srmist.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2.5 px-3.5 text-xs text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] transition duration-150"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-[#6E5BFF] hover:bg-[#5C48EE] text-white font-medium py-3 rounded-xl transition duration-150 shadow-[0_0_24px_rgba(110,91,255,0.25)] flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Dispatch Security Code"}
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#9090A8] font-medium">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    className="w-full bg-[#1A1A24] border border-[#2E2E40] rounded-xl py-2.5 px-3.5 text-xs text-center tracking-[0.4em] font-mono text-[#F0F0FF] placeholder-[#50505E] focus:outline-none focus:border-[#6E5BFF] transition duration-150"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-[#6E5BFF] hover:bg-[#5C48EE] text-white font-medium py-3 rounded-xl transition duration-150 shadow-[0_0_24px_rgba(110,91,255,0.25)] flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Authenticate"}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpStep("credentials")}
                  className="text-xs text-[#9090A8] hover:text-[#F0F0FF] text-center mt-1"
                >
                  Edit Registration / Email
                </button>
              </>
            )}
          </form>
        )}

        {/* Switch Login Method */}
        <div className="pt-2 border-t border-[#222230] flex items-center justify-between text-xs text-[#9090A8]">
          <span>Security protocol</span>
          <button
            type="button"
            onClick={() => {
              setLoginMethod(loginMethod === "password" ? "otp" : "password");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-[#6E5BFF] hover:underline font-medium"
          >
            {loginMethod === "password" ? "Use Email OTP" : "Use Password Login"}
          </button>
        </div>
      </div>

      {/* Demo Credentials Quick Fill */}
      <div className="w-full max-w-[390px] mt-6 flex flex-col gap-2">
        <span className="text-[11px] font-mono text-[#50505E] uppercase tracking-wider text-center">
          Test Credentials
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setRoleMode("student");
              setRegNo("RA2412012010001");
              setPassword("srm@123");
            }}
            className="p-2.5 rounded-xl bg-[#111118] border border-[#222230] hover:border-[#2E2E40] text-left flex flex-col gap-0.5 transition duration-150 cursor-pointer"
          >
            <span className="text-xs font-semibold text-[#F0F0FF]">Student (CR)</span>
            <span className="text-[10px] font-mono text-[#9090A8]">RA2412012010001</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleMode("tutor");
              setEmail("tutor@srmist.edu.in");
              setPassword("srm@123");
            }}
            className="p-2.5 rounded-xl bg-[#111118] border border-[#222230] hover:border-[#2E2E40] text-left flex flex-col gap-0.5 transition duration-150 cursor-pointer"
          >
            <span className="text-xs font-semibold text-[#F0F0FF]">Faculty Host</span>
            <span className="text-[10px] font-mono text-[#9090A8]">tutor@srmist.edu.in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
