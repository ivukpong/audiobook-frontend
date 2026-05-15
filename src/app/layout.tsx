import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import PWAInstallBanner from "@/components/ui/PWAInstallBanner";
import DevServiceWorkerCleanup from "@/components/ui/DevServiceWorkerCleanup";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1D9E75",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Audora — Audiobooks",
  description: "Premium audiobooks. Buy in Naira, stream anywhere.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Audora",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "Audora — Audiobooks",
    description:
      "Buy audiobooks in Naira or stream on Spotify, Apple Books and more.",
    siteName: "Audora",
  },
  icons: {
    icon: [
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/icon-192x192.png", color: "#1D9E75" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Audora" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Audora" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1D9E75" />
        <meta
          name="msapplication-TileImage"
          content="/icons/icon-144x144.png"
        />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/icons/icon-192x192.png"
        />
      </head>
      <body
        className={`${poppins.variable} font-poppins bg-gray-50 text-gray-900 min-h-screen`}
      >
        <DevServiceWorkerCleanup />
        <Toaster position="top-right" />
        {children}
        <PWAInstallBanner />
      </body>
    </html>
  );
}
