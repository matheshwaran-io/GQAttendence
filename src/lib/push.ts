import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@srmist.edu.in";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
} else {
  console.warn("Web Push VAPID keys are missing. Push notifications will not send.");
}

/**
 * Dispatches a push notification payload to a student's registered browser service worker.
 * Returns { success: false, expired: true } if the subscription has expired or been revoked.
 */
export async function sendPushNotification(subscription: any, payload: string) {
  if (!publicKey || !privateKey) {
    return { success: false, error: "VAPID keys not configured." };
  }

  try {
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to send push notification:", error);
    
    // Status 404 or 410 indicates the subscription is expired or has been revoked
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, expired: true };
    }
    
    return { success: false, expired: false, error: error.message || String(error) };
  }
}
