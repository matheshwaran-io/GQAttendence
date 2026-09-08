import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getCurrentUserAction } from "@/app/actions/auth";
import { PWARegistration } from "@/components/PWARegistration";

export const metadata: Metadata = {
  title: "GQ-Attendance — QR & Geolocation-Based Anti-Proxy Attendance System",
  description: "Enterprise Zero-Trust Smart Campus Attendance Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GQ-Attendance",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUserAction();

  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-[#F0F0FF] font-sans antialiased selection:bg-[#6E5BFF]/30 selection:text-white">
        <main className="flex-1 flex flex-col">{children}</main>
        <PWARegistration userId={currentUser?.id} />
      </body>
    </html>
  );
}
