import type { Metadata } from "next";

// Adminsidorna ska inte hamna i sökmotorer (huvudet X-Robots-Tag sätts i next.config.ts)
export const metadata: Metadata = { title: "Admin | Muppbarnens önskelistor", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
