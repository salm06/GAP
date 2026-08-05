import type { Metadata, Viewport } from "next";
import { Montserrat, Spline_Sans, Caveat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { RegistraSW } from "@/components/comune/RegistraSW";

const spline = Spline_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-spline",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-montserrat",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-caveat",
});
// Font "More Sugar" (self-hosted) per la frase guida per chi conduce.
// Due pesi: Thin (100) usato per la frase guida, Regular (400) di scorta.
const moreSugar = localFont({
  src: [
    { path: "./fonts/MoreSugar-Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/MoreSugar-Regular.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-moresugar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GAP Player",
  description: "Conduci le attività didattiche GAP dal telefono, passo dopo passo.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GAP Player" },
};

export const viewport: Viewport = {
  themeColor: "#ECECE7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`${spline.variable} ${montserrat.variable} ${caveat.variable} ${moreSugar.variable}`}
    >
      <body>
        {/* Sfondo: fondo pieno + trama a dots animata (stile sito) */}
        <div className="backdrop" aria-hidden />
        <div className="grain" aria-hidden />
        <RegistraSW />
        {children}
      </body>
    </html>
  );
}
