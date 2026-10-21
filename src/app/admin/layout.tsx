import type { Metadata, Viewport } from "next";
import { fontVars } from "@/lib/fonts";
import "../globals.css";
import "./admin.css";

export const metadata: Metadata = {
  title: "The Atelier",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { viewportFit: "cover", themeColor: "#480903" };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body className="atelier font-sans">{children}</body>
    </html>
  );
}
