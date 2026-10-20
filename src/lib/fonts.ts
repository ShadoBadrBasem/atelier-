// Single font-token layer. To use the licensed fonts, drop the files in
// public/fonts/ and replace `display` / `serif` with next/font/local:
//   display -> Boston Angel, serif -> The Seasons.
// next/font self-hosts everything at build time: no runtime requests to Google.
import { Bodoni_Moda, Cormorant_Garamond, Jost, Amiri } from "next/font/google";

export const display = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const sans = Jost({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const arabic = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const fontVars = [display, serif, sans, arabic]
  .map((f) => f.variable)
  .join(" ");
