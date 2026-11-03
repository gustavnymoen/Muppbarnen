"use client";

import { useEffect } from "react";

// Håller reda på om det senaste var en pekare eller en tangent: data-pointer på <html> göms ringen i globals.css.
// Lyssnarna sitter på document i fångstfasen, så dialogernas stopp av händelser (Dialog) påverkar dem inte.
// Assistenttekniker som trycker utan tangent eller pekare räknas som pekare: en känd gräns.
export function InputModality() {
  useEffect(() => {
    const root = document.documentElement;
    const pointer = () => root.setAttribute("data-pointer", "");
    const key = () => root.removeAttribute("data-pointer");
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", key, true);
    };
  }, []);
  return null;
}
