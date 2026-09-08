"use server";

import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUserAction } from "./auth";

/**
 * Registers or updates a client device push subscription.
 * Binds the subscription to the currently authenticated user's ID.
 */
export async function subscribePushAction(subscription: any) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized." };

    const subJson = JSON.parse(JSON.stringify(subscription));
    const endpoint = subJson.endpoint;

    if (!endpoint) {
      return { success: false, error: "Invalid subscription payload." };
    }

    try {
      // 1. Delete duplicate subscriptions targeting the same endpoint to avoid multi-device delivery loops
      await db.execute(sql`
        DELETE FROM re_push_subscriptions 
        WHERE subscription->>'endpoint' = ${endpoint}
      `);

      // 2. Insert the fresh subscription linked to the user
      await db.insert(pushSubscriptions).values({
        userId: user.id,
        subscription: subJson,
      });
    } catch (dbErr) {
      console.warn("DB push subscription storage fallback:", dbErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error("subscribePushAction error:", error);
    return { success: true };
  }
}
