import type { Metadata, Viewport } from "next";
import {
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bizi Bees OS-X Fleet Command | 17-Store Autonomous Engine",
  description:
    "Multi-Store E-Commerce Operating System, 17 Live DTC Storefronts, 90 Categorized Products, and Google Workspace Command Hub.",
  keywords: [
    "Bizi Bees",
    "Luma Clinical",
    "Ember & Oak",
    "Multi-Store DTC Fleet",
    "Autonomous E-Commerce OS",
    "Shopify OS 2.0 Fleet",
    "Utah 24h Fulfillment",
  ],
  authors: [{ name: "Bizi Bees Conglomerate" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Bizi Bees OS-X Fleet Command | 17-Store Autonomous Engine",
    description:
      "Unified Autonomous Shopify Fleet Command • 17 Live DTC Storefronts • 90 Categorized SKUs • Google Workspace Sync.",
    siteName: "Bizi Bees OS-X Fleet Command",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bizi Bees OS-X Fleet Command | 17-Store Autonomous Engine",
    description:
      "Unified Autonomous Shopify Fleet Command • 17 Live DTC Storefronts • 90 Categorized SKUs • Google Workspace Sync.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090D16",
};

const fleetSchemaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Bizi Bees Conglomerate & RepoOS Fleet",
      description:
        "15-Brand Direct-to-Consumer E-Commerce Fleet with 24-Hour Salt Lake City, Utah Fulfillment.",
      foundingLocation: {
        "@type": "Place",
        name: "Salt Lake City, UT",
      },
      numberOfEmployees: 45,
    },
    {
      "@type": "WebApplication",
      name: "Bizi Bees OS-X Fleet Command",
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      description:
        "Autonomous 15-Store E-Commerce Telemetry, Storefront Synthesizer, and Google Workspace Command Hub.",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${jakarta.variable} ${jetbrains.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(fleetSchemaJsonLd) }}
        />
      </head>
      <body className="bg-[#090D16] text-[#F8FAFC] font-sans antialiased selection:bg-[#10B981] selection:text-[#090D16]">
        {children}
      </body>
    </html>
  );
}
