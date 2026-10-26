import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muppbarnen",
  description: "Önskelistor till familjens barn, till födelsedagar och jul.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
