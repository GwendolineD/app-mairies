import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { THEME_COLORS } from "@/lib/constants/theme";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vie Locale",
    template: "%s | Vie Locale",
  },
  description: "Découvrir, Partager, S'entraider — la vie de votre commune",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vie Locale",
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLORS.purple,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} h-full font-sans antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-text"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
