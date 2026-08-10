import type { Metadata, Viewport } from "next";
import { Orbitron, Exo_2 } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NEXUS — Browser Gaming Platform",
    template: "%s | NEXUS",
  },
  description:
    "Play instantly. Compete. Ascend. Premium browser gaming with achievements, leaderboards, and cross-device progress.",
  applicationName: "NEXUS",
  keywords: ["browser games", "gaming platform", "arcade", "leaderboard", "achievements"],
  authors: [{ name: "NEXUS" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "NEXUS" },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    type: "website",
    siteName: "NEXUS",
    title: "NEXUS — Browser Gaming Platform",
    description: "Play instantly. Compete. Ascend.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXUS — Browser Gaming Platform",
    description: "Play instantly. Compete. Ascend.",
  },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${exo2.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body bg-grid noise-overlay">
        <Providers>
          <AppShell>{children}</AppShell>
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
