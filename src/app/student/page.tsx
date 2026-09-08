import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { getStudentAttendanceReportAction } from "@/app/actions/attendance";
import { getTimetableAction } from "@/app/actions/timetable";
import { getAnnouncementsAction } from "@/app/actions/announcements";
import { StudentDashboard } from "@/components/StudentDashboard";

export default async function StudentPage() {
  const user = await getCurrentUserAction();

  // 1. Authenticate check
  if (!user) {
    redirect("/auth/login");
  }

  // 2. Class Membership check
  const studentMembership = user.memberships.find(
    (m) => m.role === "student" || m.role === "cr"
  );
  if (!studentMembership) {
    redirect("/");
  }

  const classId = studentMembership.classId;

  // 3. Pre-load reports, timetable, and announcements on the server
  const reportRes = await getStudentAttendanceReportAction(classId, user.id);
  const timetableRes = await getTimetableAction(classId);
  const announcementsRes = await getAnnouncementsAction(classId);

  const initialReport = (reportRes.success && reportRes.data) ? reportRes.data : null;
  const initialTimetable = (timetableRes.success && timetableRes.data) ? timetableRes.data : [];
  const initialAnnouncements = (announcementsRes.success && announcementsRes.data) ? announcementsRes.data : [];

  return (
    <StudentDashboard
      student={{
        id: user.id,
        email: user.email!,
        name: studentMembership.className, // using name mapping
        className: `${studentMembership.programmeName} — ${studentMembership.className}`,
        classId: studentMembership.classId,
      }}
      initialReport={initialReport}
      initialTimetable={initialTimetable}
      initialAnnouncements={initialAnnouncements}
    />
  );
}
