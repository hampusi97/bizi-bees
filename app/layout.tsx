import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bizi Bees OS-X Fleet Command | 15-Store Autonomous Engine",
  description: "Multi-Store E-Commerce Operating System and Autonomous Fleet Engine",
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
