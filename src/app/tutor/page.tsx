import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { getClassRoomsAction, getTimetableAction } from "@/app/actions/timetable";
import { getAnnouncementsAction } from "@/app/actions/announcements";
import { getClassAttendanceReportAction } from "@/app/actions/attendance";
import { TutorDashboard } from "@/components/TutorDashboard";

export default async function TutorPage() {
  const user = await getCurrentUserAction();

  // 1. Authenticate check
  if (!user) {
    redirect("/auth/login");
  }

  // 2. Role check (Tutor or CR)
  const tutorMembership = user.memberships.find(
    (m) => m.role === "tutor" || m.role === "cr"
  );
  if (!tutorMembership) {
    redirect("/");
  }

  // 3. Pre-load classrooms
  const roomsRes = await getClassRoomsAction();
  const initialRooms = (roomsRes.success && roomsRes.data) ? roomsRes.data : [];

  // Pre-load class specific data for their primary class membership
  const classId = tutorMembership.classId;
  const reportRes = await getClassAttendanceReportAction(classId);
  const timetableRes = await getTimetableAction(classId);
  const announcementsRes = await getAnnouncementsAction(classId);

  const initialReport = (reportRes.success && reportRes.data) ? reportRes.data : { totalSessions: 0, studentStats: [] };
  const initialTimetable = (timetableRes.success && timetableRes.data) ? timetableRes.data : [];
  const initialAnnouncements = (announcementsRes.success && announcementsRes.data) ? announcementsRes.data : [];

  return (
    <TutorDashboard
      tutor={{
        id: user.id,
        email: user.email!,
        role: tutorMembership.role,
        classId: tutorMembership.classId,
        className: `${tutorMembership.programmeName} — ${tutorMembership.className}`,
      }}
      initialRooms={initialRooms}
      initialReport={initialReport}
      initialTimetable={initialTimetable}
      initialAnnouncements={initialAnnouncements}
    />
  );
}
