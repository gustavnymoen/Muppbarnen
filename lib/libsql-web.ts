// Bara på Vercel (next.config.ts): webbklienten i stället för den inbyggda, så att den
// 8–10 MB stora inbyggda motorn inte följer med i funktionerna (TECH-016). Ett alias rakt till
// paketet fungerar inte, för att det är ett externt serverpaket; därför en fil här.
export * from "@libsql/client/web";
