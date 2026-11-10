-- Secret Santa: den årliga rensningen (MUPP-044). En enda rad: året då rensningen senast gjordes. Rensningen körs varje dag
-- men bara en gång per år (den första dagen på eller efter 24 januari), annars skulle den ta bort nästa års önskelistor.
-- Året står också i inloggningskakan, så en kaka från före rensningen slutar gälla. Raden börjar på innevarande år:
-- sajten rensas första gången nästa 24 januari, inte direkt när detta körs.
CREATE TABLE IF NOT EXISTS ss_cleanup (
  id   INTEGER PRIMARY KEY CHECK (id = 1),
  year INTEGER NOT NULL
);
INSERT OR IGNORE INTO ss_cleanup (id, year) VALUES (1, CAST(strftime('%Y', 'now') AS INTEGER));
-- IF NOT EXISTS och OR IGNORE: filen hette först 010 och hann köras mot previewdatabasen.
