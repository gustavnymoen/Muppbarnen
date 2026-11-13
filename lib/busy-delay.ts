// Spinnern på en upptagen knapp visas först efter en liten stund (MUPP-072-R2), så att en snabb åtgärd inte blinkar.
// Ren logik utan React, för att kunna testas med en falsk klocka.
export const SPINNER_DELAY_MS = 300;

export function delayedFlag(onChange: (shown: boolean) => void, delay = SPINNER_DELAY_MS) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    set(busy: boolean) {
      clearTimeout(timer);
      if (busy) timer = setTimeout(() => onChange(true), delay);
      else onChange(false);
    },
  };
}
