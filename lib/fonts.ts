import { Homemade_Apple, Manrope, Permanent_Marker } from "next/font/google";

export const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  weight: "400",
  subsets: ["latin"],
});

export const homemadeApple = Homemade_Apple({
  variable: "--font-homemade-apple",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
