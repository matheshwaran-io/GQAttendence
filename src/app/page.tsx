import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";

export default async function HomePage() {
  const user = await getCurrentUserAction();

  // 1. If not authenticated, send to login
  if (!user) {
    redirect("/auth/login");
  }

  // 2. Redirect based on membership roles
  if (user.memberships && user.memberships.length > 0) {
    const primaryMembership = user.memberships[0];
    const role = primaryMembership.role;

    if (role === "tutor" || role === "cr") {
      redirect("/tutor");
    } else {
      redirect("/student");
    }
  }

  // 3. Fallback: Authenticated but membership not finalized
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0A0A0F]">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[#111118] border border-[#222230] shadow-card flex flex-col gap-5">
        <h2 className="text-xl font-bold font-display text-[#F0F0FF]">Setup Incomplete</h2>
        <p className="text-[#9090A8] text-xs leading-relaxed">
          Your account is authenticated, but not yet linked to any class cohort. Please contact your Tutor or CR to check the class roster.
        </p>
        <a
          href="/auth/login"
          className="w-full inline-block bg-[#6E5BFF] hover:bg-[#5C48EE] text-white font-medium py-3 px-6 rounded-xl transition text-xs shadow-[0_0_24px_rgba(110,91,255,0.25)]"
        >
          Return to Login
        </a>
      </div>
    </div>
  );
}
