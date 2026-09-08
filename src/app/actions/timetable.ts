"use server";

import { db } from "@/db";
import { timetableEntries, rooms, classMemberships, pushSubscriptions, classes } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUserAction } from "./auth";
import { sendPushNotification } from "@/lib/push";

// 1. Fetch Timetable Entries (pre-joined with rooms)
export async function getTimetableAction(classId: string) {
  try {
    const list = await db
      .select({
        id: timetableEntries.id,
        subjectName: timetableEntries.subjectName,
        dayOfWeek: timetableEntries.dayOfWeek,
        startTime: timetableEntries.startTime,
        endTime: timetableEntries.endTime,
        roomId: timetableEntries.roomId,
        roomName: rooms.name,
        latitude: rooms.latitude,
        longitude: rooms.longitude,
      })
      .from(timetableEntries)
      .leftJoin(rooms, eq(timetableEntries.roomId, rooms.id))
      .where(eq(timetableEntries.classId, classId));

    return { success: true, data: list };
  } catch (error) {
    console.error("getTimetableAction error:", error);
    return { success: false, error: "Failed to load timetable." };
  }
}

// 2. Helper: Send Push Notification to all students in a class
export async function notifyClassAction(classId: string, title: string, body: string) {
  try {
    // 1. Fetch all student memberships in the class
    const members = await db
      .select({ userId: classMemberships.userId })
      .from(classMemberships)
      .where(and(eq(classMemberships.classId, classId), eq(classMemberships.role, "student")));

    const studentIds = members.map((m) => m.userId);
    if (studentIds.length === 0) return { success: true };

    // 2. Fetch push subscriptions for these students
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(inArray(pushSubscriptions.userId, studentIds));

    if (subs.length === 0) return { success: true };

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      data: {
        url: "/student",
      },
    });

    // 3. Dispatch web push notifications
    const sendPromises = subs.map(async (s) => {
      const res = await sendPushNotification(s.subscription, payload);
      if (res.expired) {
        // Delete expired subscription to prevent database bloat
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id));
      }
    });

    await Promise.allSettled(sendPromises);
    return { success: true };
  } catch (error) {
    console.error("notifyClassAction error:", error);
    return { success: false, error: "Failed to dispatch push notifications." };
  }
}

// 3. Create Timetable Entry (Tutor/CR only)
export async function createTimetableEntryAction(
  classId: string,
  subjectName: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  roomId?: string,
  customRoomName?: string,
  facultyName?: string,
  periodNumber?: number
) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized." };

    const membership = user.memberships.find((m) => m.classId === classId);
    if (!membership || (membership.role !== "tutor" && membership.role !== "cr")) {
      return { success: false, error: "Only Tutors and CRs can manage the timetable." };
    }

    let resolvedRoomId = roomId || null;

    // If custom room or lab name provided, find or create
    if (customRoomName && customRoomName.trim()) {
      const roomRes = await getOrCreateRoomAction(customRoomName.trim());
      if (roomRes.success && roomRes.data) {
        resolvedRoomId = roomRes.data.id;
      }
    }

    const newEntry = await db
      .insert(timetableEntries)
      .values({
        classId,
        subjectName: subjectName.trim(),
        facultyName: facultyName?.trim() || null,
        periodNumber: periodNumber || null,
        dayOfWeek,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        roomId: resolvedRoomId,
      })
      .returning();

    // Fetch class name for notification
    const cls = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });
    const className = cls ? cls.name : "Class";

    // Trigger push notification to class
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[dayOfWeek];
    await notifyClassAction(
      classId,
      `Timetable Added: ${className}`,
      `New class: ${subjectName} is scheduled on ${dayName} at ${startTime}`
    );

    return { success: true, data: newEntry[0] };
  } catch (error: any) {
    console.error("createTimetableEntryAction error:", error);
    return { success: false, error: "Failed to add timetable entry." };
  }
}

// 4. Update Timetable Entry (Tutor/CR only)
export async function updateTimetableEntryAction(
  id: string,
  subjectName: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  roomId?: string
) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized." };

    // Fetch existing entry
    const entry = await db.query.timetableEntries.findFirst({
      where: eq(timetableEntries.id, id),
    });
    if (!entry) return { success: false, error: "Timetable entry not found." };

    // Verify role in class
    const membership = user.memberships.find((m) => m.classId === entry.classId);
    if (!membership || (membership.role !== "tutor" && membership.role !== "cr")) {
      return { success: false, error: "Unauthorized." };
    }

    const updated = await db
      .update(timetableEntries)
      .set({
        subjectName: subjectName.trim(),
        dayOfWeek,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        roomId: roomId || null,
      })
      .where(eq(timetableEntries.id, id))
      .returning();

    // Fetch class details
    const cls = await db.query.classes.findFirst({
      where: eq(classes.id, entry.classId),
    });
    const className = cls ? cls.name : "Class";

    // Trigger push notification to class
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[dayOfWeek];
    await notifyClassAction(
      entry.classId,
      `Timetable Updated: ${className}`,
      `${subjectName} has been rescheduled to ${dayName} at ${startTime}`
    );

    return { success: true, data: updated[0] };
  } catch (error: any) {
    console.error("updateTimetableEntryAction error:", error);
    return { success: false, error: "Failed to update timetable entry." };
  }
}

// 5. Delete Timetable Entry (Tutor/CR only)
export async function deleteTimetableEntryAction(id: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized." };

    // Fetch existing entry
    const entry = await db.query.timetableEntries.findFirst({
      where: eq(timetableEntries.id, id),
    });
    if (!entry) return { success: false, error: "Timetable entry not found." };

    // Verify role in class
    const membership = user.memberships.find((m) => m.classId === entry.classId);
    if (!membership || (membership.role !== "tutor" && membership.role !== "cr")) {
      return { success: false, error: "Unauthorized." };
    }

    await db.delete(timetableEntries).where(eq(timetableEntries.id, id));

    // Fetch class details
    const cls = await db.query.classes.findFirst({
      where: eq(classes.id, entry.classId),
    });
    const className = cls ? cls.name : "Class";

    // Trigger push notification to class
    await notifyClassAction(
      entry.classId,
      `Timetable Changed: ${className}`,
      `A session (${entry.subjectName}) has been cancelled or removed from the timetable.`
    );

    return { success: true };
  } catch (error: any) {
    console.error("deleteTimetableEntryAction error:", error);
    return { success: false, error: "Failed to delete timetable entry." };
  }
}

// 6. Fetch Seeded Rooms (for dropdown select)
export async function getClassRoomsAction() {
  try {
    const list = await db.select().from(rooms);
    return { success: true, data: list };
  } catch (error) {
    console.error("getClassRoomsAction error:", error);
    return { success: false, error: "Failed to load classrooms." };
  }
}

// 7. Get or Create Room / Lab by Name
export async function getOrCreateRoomAction(
  roomName: string,
  venueType: "classroom" | "lab" | "seminar_hall" = "classroom"
) {
  try {
    const cleanName = roomName.trim();
    if (!cleanName) return { success: false, error: "Room name is required." };

    try {
      const existing = await db.query.rooms.findFirst({
        where: eq(rooms.name, cleanName),
      });
      if (existing) return { success: true, data: existing };

      // Query any existing department or create with default
      const allRooms = await db.select().from(rooms).limit(1);
      const deptId = allRooms.length > 0 ? allRooms[0].departmentId : "00000000-0000-0000-0000-000000000001";

      const inserted = await db
        .insert(rooms)
        .values({
          departmentId: deptId,
          name: cleanName,
          latitude: 12.8231,
          longitude: 80.0441,
        })
        .returning();

      return { success: true, data: inserted[0] };
    } catch (dbErr) {
      console.warn("DB room query fallback:", dbErr);
      return {
        success: true,
        data: {
          id: "room_" + cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          name: cleanName,
          latitude: 12.8231,
          longitude: 80.0441,
        },
      };
    }
  } catch (error: any) {
    console.error("getOrCreateRoomAction error:", error);
    return { success: false, error: "Failed to resolve room/lab." };
  }
}

