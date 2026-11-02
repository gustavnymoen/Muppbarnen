// Adressen till ett barns bild (MUPP-024). Filnamnet är nytt varje gång bilden byts, så en kort summa av det är versionen:
// webbläsaren sparar bilden för alltid under en adress och hämtar en ny först när adressen ändras. Summan avslöjar inte filnamnet.
// shortcut: 32 bitar, så två olika filnamn kan i teorin få samma version; byt till en riktig hash om det någonsin spelar roll.
export const pictureVersion = (file: string) => [...file].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7).toString(36);

export const pictureUrl = (id: number, file: string) => (file ? `/bilder/${id}?v=${pictureVersion(file)}` : undefined);
