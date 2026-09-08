"use server";

import { db } from "@/db";
import { announcements, classes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUserAction } from "./auth";
import { notifyClassAction } from "./timetable";

// 1. Fetch announcements for a class (sorted latest first)
export async function getAnnouncementsAction(classId: string) {
  try {
    const list = await db
      .select()
      .from(announcements)
      .where(eq(announcements.classId, classId))
      .orderBy(desc(announcements.createdAt));

    return { success: true, data: list };
  } catch (error) {
    console.error("getAnnouncementsAction error:", error);
    return { success: false, error: "Failed to load announcements." };
  }
}

// 2. Post a new announcement (Tutor/CR only)
export async function createAnnouncementAction(
  classId: string,
  title: string,
  content: string
) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized." };

    // Verify role
    const membership = user.memberships.find((m) => m.classId === classId);
    if (!membership || (membership.role !== "tutor" && membership.role !== "cr")) {
      return { success: false, error: "Only Tutors and CRs can post announcements." };
    }

    const newAnnouncement = await db
      .insert(announcements)
      .values({
        classId,
        title: title.trim(),
        content: content.trim(),
        createdBy: user.id,
      })
      .returning();

    // Fetch class details for notifications
    const cls = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });
    const className = cls ? cls.name : "Class";

    // Send push notification to all students in the class
    await notifyClassAction(
      classId,
      `New Announcement: ${title}`,
      `A new announcement has been posted in ${className}`
    );

    return { success: true, data: newAnnouncement[0] };
  } catch (error: any) {
    console.error("createAnnouncementAction error:", error);
    return { success: false, error: "Failed to post announcement." };
  }
}
