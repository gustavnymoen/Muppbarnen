import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { SITE_NAME } from "./components/SiteHeader";
import { InputModality } from "./components/InputModality";
import { Toaster } from "./components/Toaster";
import "./globals.css";

// Typsnitten hämtas vid bygget och serveras från vår egen server
const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-fredoka", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-nunito", display: "swap" });

// Namnet kommer från SITE_NAME på ett enda ställe; sidorna anger bara sin egen del av titeln (MUPP-046)
const DESCRIPTION = "Familjens önskelistor och Secret Santa.";
export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  openGraph: { title: SITE_NAME, siteName: SITE_NAME, description: DESCRIPTION, locale: "sv_SE" },
  appleWebApp: { title: SITE_NAME },
};

// Utan viewport-fit=cover ger skärmbrunnens skyddsmarginaler (safe areas) ingenting
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <InputModality />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
