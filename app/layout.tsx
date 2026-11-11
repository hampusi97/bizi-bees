import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🌐 REPO-OS™ MISSION CONTROL | 13-Store Fleet Command",
  description: "Executive Multi-Store E-Commerce Command Center & Real-Time Telemetry Dashboard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090D16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090D16] text-[#F8FAFC] antialiased selection:bg-[#10B981] selection:text-[#090D16]">
        {children}
      </body>
    </html>
  );
}
