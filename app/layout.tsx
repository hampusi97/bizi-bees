import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dropper OS — 15-Store Fleet Command",
  description:
    "Dropper OS master portal: 15 Shopify storefronts, 7 super-bots, 180 winning products, $50K/month pace."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#09090B", color: "#E5E7EB" }}>{children}</body>
    </html>
  );
}
