import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@fontsource-variable/plus-jakarta-sans";
import { brand } from "@/lib/brand";
import "./globals.css";
import "./landing-expansion.css";
import "./community-islands.css";
import "./rewards-preview.css";
import "./landing-refinements.css";

const outfit = localFont({
  src: "../../public/fonts/outfit-variable.ttf",
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: brand.title,
  description: brand.description,
  robots: { index: false, follow: false },
  icons: { icon: "/brand/open-loop-ink.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
