// Rörelsen när en önskelista öppnas och stängs (MUPP-016, MUPP-022). Bara clip-path (när en vy växer), transform och opacity, så att inget i layouten flyttar sig
// medan det rör sig. Med minskad rörelse görs ingenting alls.
// Web Animations tar inte var(), så kurvan är samma som --ease-out-soft i globals.css.

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const OPEN_MS = 300;
const CLOSE_MS = 300;
// Hur stor del av stängningen kopian är helt synlig innan den börjar tona
const FADE_AFTER = 0.4;

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const radiusOf = (el: Element) => getComputedStyle(el).borderTopLeftRadius;
// Utsnittet av `box` som motsvarar `part`
const inset = (box: DOMRect, part: DOMRect, radius: string) =>
  `inset(${part.top - box.top}px ${box.right - part.right}px ${box.bottom - part.bottom}px ${part.left - box.left}px round ${radius})`;

// Knappen eller rutan som ett barns vy växer ur, uppmätt när den trycks (efteråt finns den inte kvar)
export type Origin = { rect: DOMRect; radius: string };
export const originOf = (el: Element): Origin => ({ rect: el.getBoundingClientRect(), radius: radiusOf(el) });

// Barnets vy växer från knappen till hela kortet
export function growFrom(card: HTMLElement | null, from: Origin) {
  if (!card || calm()) return;
  const full = `inset(0px round ${radiusOf(card)})`;
  card.animate({ clipPath: [inset(card.getBoundingClientRect(), from.rect, from.radius), full] }, { duration: OPEN_MS, easing: EASE });
}

// När listan stängs är det riktiga elementet borta direkt (fokus och läge är som vanligt); det som rör sig är en kopia som
// ligger över sidan en kort stund. Finns bara en åt gången, och en ny öppning eller stängning tar bort den förra.
let ghost: HTMLElement | null = null;

function remove(copy: HTMLElement) {
  copy.remove();
  if (ghost === copy) ghost = null;
}

export function dropGhost() {
  if (ghost) remove(ghost);
}

// Tas innan elementet försvinner
export function makeGhost(el: HTMLElement | null) {
  dropGhost();
  if (!el || calm()) return;
  // Stängs vyn medan den ännu växer ska den riktiga vyn inte fortsätta växa under kopian
  el.getAnimations().filter((a) => !(a instanceof CSSAnimation)).forEach((a) => a.cancel());
  const box = el.getBoundingClientRect();
  const copy = el.cloneNode(true) as HTMLElement;
  // Samma id får inte finnas två gånger, och kopian ska inte gå att nå
  copy.removeAttribute("id");
  copy.querySelectorAll("[id]").forEach((child) => child.removeAttribute("id"));
  copy.inert = true;
  copy.setAttribute("aria-hidden", "true");
  Object.assign(copy.style, { position: "fixed", top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px`, margin: "0", zIndex: "50", pointerEvents: "none", animation: "none" });
  document.body.append(copy);
  copy.scrollTop = el.scrollTop;
  ghost = copy;
}

// Spelar upp kopians rörelse och tar bort kopian när den är slut. Kopian får aldrig bli kvar: den tas också bort om animationen avbryts,
// och efter en säkerhetstid om webbläsaren (iOS) aldrig skickar finish. Rörelsen och tonandet är två animationer: rörelsen mjuk och snabb i början,
// tonandet först när kopian är på väg (MUPP-025). Med en gemensam kurva var kopian nästan osynlig efter 100 ms och rörelsen syntes inte alls på en telefon.
function play(copy: HTMLElement, transform: string) {
  const options = { duration: CLOSE_MS, fill: "forwards" } as const;
  const move = copy.animate([{ transform: "none" }, { transform }], { ...options, easing: EASE });
  copy.animate([{ opacity: 1 }, { opacity: 1, offset: FADE_AFTER }, { opacity: 0 }], { ...options, easing: "linear" });
  // Det är rörelsen som städar: tonandet är lika långt, och säkerhetstiden tar det som blir över
  move.onfinish = move.oncancel = () => remove(copy);
  setTimeout(() => remove(copy), CLOSE_MS + 300);
}

// Barnets vy krymper hel tillbaka till knappen den kom från och tonar bort (mäts nu, så att den hamnar rätt även om sidan har scrollats
// eller bytt storlek). Bara transform och opacity: clip-path ritas om på huvudtråden och hackade på en telefon, och visade bara ett utsnitt.
export function shrinkTo(button: HTMLElement | null) {
  const copy = ghost;
  if (!copy) return;
  if (!button) return remove(copy);
  const [box, to] = [copy.getBoundingClientRect(), button.getBoundingClientRect()];
  copy.style.transformOrigin = "top left";
  play(copy, `translate(${to.left - box.left}px, ${to.top - box.top}px) scale(${to.width / box.width}, ${to.height / box.height})`);
}

// Listan på kortet med ett barn glider ner mot knappen och tonar bort
export function sinkAway() {
  if (ghost) play(ghost, "translateY(1.5rem)");
}
