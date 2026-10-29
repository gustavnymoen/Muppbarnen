"use client";

import { useLayoutEffect, useRef } from "react";

const MIN_SIZE = 12; // px: mindre än så blir ett namn svårläst; ryms det inte ens då kapas det med "…"

// Ett namn som alltid står på en rad (MUPP-013-R3): texten krymper en pixel i taget tills den ryms.
// Hela namnet finns kvar i texten, så skärmläsaren hör det även när det kapas.
export function FitName({ children, className = "" }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current!;
    const fit = () => {
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth && size > MIN_SIZE) el.style.fontSize = `${--size}px`;
    };
    fit();
    // Bredden ändras när skärmen vrids eller teckensnittet laddats klart
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    let mounted = true;
    document.fonts.ready.then(() => mounted && fit());
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [children]);

  return (
    <span ref={ref} className={`block max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}
