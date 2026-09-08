"use client";

import { useEffect, useState } from "react";
import { subscribePushAction } from "@/app/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PWARegistration({ userId }: { userId?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered successfully:", reg.scope);
          // If a user is signed in, automatically configure/update Web Push notifications
          if (userId) {
            setupPushSubscription(reg);
          }
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }

    // 2. Capture Install Prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [userId]);

  const setupPushSubscription = async (registration: ServiceWorkerRegistration) => {
    try {
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        console.warn("VAPID public key is not configured. Web Push skipped.");
        return;
      }

      // Query/request notification permissions
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        console.log("Notification permission was denied.");
        return;
      }

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(publicVapidKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      // Convert native browser PushSubscription DOM object to plain JSON object for Next.js Server Action
      const subJson = subscription.toJSON
        ? subscription.toJSON()
        : JSON.parse(JSON.stringify(subscription));

      const result = await subscribePushAction(subJson);
      if (result.success) {
        console.log("Web Push notification subscription registered successfully!");
      }
    } catch (error) {
      console.error("Failed to setup push subscription:", error);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 z-50 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"></path>
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm">Install GQ-Attendance</h4>
          <p className="text-xs text-slate-400">Add to your home screen for instant sub-second QR check-in.</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setIsInstallable(false)} className="text-xs text-slate-400 px-3 py-1.5 hover:text-white transition">Later</button>
        <button onClick={handleInstallClick} className="bg-indigo-600 hover:bg-indigo-700 text-xs px-4 py-1.5 rounded-xl font-medium transition shadow-md shadow-indigo-600/30">Install Now</button>
      </div>
    </div>
  );
}
