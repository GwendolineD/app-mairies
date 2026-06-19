import type { Metadata, Viewport } from "next";
import { Manrope, Permanent_Marker } from "next/font/google";
import { PWA_ICON_VERSION } from "@/lib/constants/pwa-icons";
import { THEME_COLORS } from "@/lib/constants/theme";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tous Voisins",
    template: "%s | Tous Voisins",
  },
  description: "Découvrir, Partager, S'entraider — la vie de votre commune",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    icon: [
      {
        url: `/favicon-16x16.png?v=${PWA_ICON_VERSION}`,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tous Voisins",
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
      className={`${manrope.variable} ${permanentMarker.variable} h-full font-sans antialiased`}
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
