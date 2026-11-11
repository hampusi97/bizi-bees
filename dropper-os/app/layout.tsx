import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dropper OS — Autonomous Multi-Store Fleet Command Center",
  description: "Institutional-Grade E-Commerce Operating System & Fleet Manager",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-titanium-950 text-titanium-100 min-h-screen antialiased selection:bg-cyber-emerald/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
