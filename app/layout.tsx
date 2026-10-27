import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

// Typsnitten hämtas vid bygget och serveras från vår egen server
const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-fredoka", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: "Muppbarnen",
  description: "Önskelistor till familjens barn, till födelsedagar och jul.",
};

// Utan viewport-fit=cover ger skärmbrunnens skyddsmarginaler (safe areas) ingenting
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
