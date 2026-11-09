"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Esc går tillbaka dit Tillbaka-knappen går; en öppen meny har redan förbrukat sin egen Esc (MUPP-047-R1, MUPP-048-R8)
export function EscBack({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) router.push(href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, href]);
  return null;
}
