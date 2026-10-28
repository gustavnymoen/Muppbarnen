// Julkortets bakgrund (MUPP-004-R5): en mörkgrön vinterkväll med en girland med lampor överst,
// stjärnor och snö, och granar och en snöbädd längst ned. Ritad som former i SVG, bara dekoration,
// och ligger bakom kortets innehåll. Färgerna är designens egna (gröna och röda jultoner, barnens färger).
const mix = (token: string, percent: number, base = "var(--color-card)") => `color-mix(in srgb, var(${token}) ${percent}%, ${base})`;

const LIGHTS = [
  { x: 22, y: 16, color: "--color-child-sun" },
  { x: 62, y: 28, color: "--color-christmas-red" },
  { x: 104, y: 29, color: "--color-child-sky" },
  { x: 146, y: 15, color: "--color-child-sun" },
  { x: 190, y: 12, color: "--color-christmas-red" },
  { x: 234, y: 22, color: "--color-child-sky" },
  { x: 276, y: 20, color: "--color-child-sun" },
];
const STARS = [
  { x: 40, y: 96, size: 1 },
  { x: 258, y: 84, size: 1.3 },
  { x: 150, y: 70, size: 0.7 },
  { x: 24, y: 210, size: 0.8 },
  { x: 280, y: 232, size: 0.9 },
];
const SNOW = [
  [70, 120], [120, 160], [210, 130], [250, 180], [90, 250], [190, 290], [30, 330], [270, 330], [140, 220], [60, 400], [235, 410],
];
// Granar: x, höjd (skala), och om den står längst fram
const TREES = [
  { x: 28, scale: 1.25, front: false },
  { x: 120, scale: 1.0, front: false },
  { x: 205, scale: 1.35, front: false },
  { x: 275, scale: 0.95, front: false },
  { x: 72, scale: 1.0, front: true },
  { x: 160, scale: 1.2, front: true },
  { x: 244, scale: 0.9, front: true },
];

export function ChristmasBackdrop() {
  return (
    <svg aria-hidden="true" viewBox="0 0 300 520" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 -z-10 h-full w-full">
      <defs>
        <linearGradient id="jul-natt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: mix("--color-christmas-green", 42) }} />
          <stop offset="1" style={{ stopColor: mix("--color-christmas-green", 16) }} />
        </linearGradient>
        <path id="jul-stjarna" d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" />
        <g id="jul-gran">
          <path d="M0 -62 L20 -30 L9 -30 L28 -4 L-28 -4 L-9 -30 L-20 -30 Z" />
          <rect x="-4" y="-4" width="8" height="10" />
        </g>
      </defs>
      <rect width="300" height="520" fill="url(#jul-natt)" />

      {SNOW.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2" style={{ fill: "var(--color-text)" }} opacity="0.22" />
      ))}
      {STARS.map(({ x, y, size }) => (
        <use key={`${x}-${y}`} href="#jul-stjarna" transform={`translate(${x} ${y}) scale(${size})`} style={{ fill: "var(--color-child-sun)" }} opacity="0.55" />
      ))}

      {/* Girlanden hänger över kortets överkant */}
      <path d="M-10 8 Q 75 46 150 12 T 310 8" fill="none" strokeWidth="3" strokeLinecap="round" style={{ stroke: mix("--color-christmas-green", 85) }} />
      {LIGHTS.map(({ x, y, color }) => (
        <circle key={x} cx={x} cy={y} r="4.5" style={{ fill: `var(${color})` }} />
      ))}

      {/* Granar längst ned: bakre raden mörkare, främre raden ljusare, och en snöbädd framför */}
      {TREES.filter((t) => !t.front).map(({ x, scale }) => (
        <use key={x} href="#jul-gran" transform={`translate(${x} 506) scale(${scale})`} style={{ fill: mix("--color-christmas-green", 30) }} />
      ))}
      {TREES.filter((t) => t.front).map(({ x, scale }) => (
        <use key={x} href="#jul-gran" transform={`translate(${x} 516) scale(${scale})`} style={{ fill: mix("--color-christmas-green", 55) }} />
      ))}
      <path d="M0 500 Q 60 486 130 498 T 300 494 V 520 H 0 Z" style={{ fill: "var(--color-text)" }} opacity="0.14" />
    </svg>
  );
}
