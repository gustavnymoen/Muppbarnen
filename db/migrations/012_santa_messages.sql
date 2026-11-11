-- Secret Santa: samtalen mellan en givare och hens mottagare (MUPP-043). En rad per meddelande. Ett samtal hör till ett par ur
-- dragningen (giver_id och receiver_id) och ingen annan; from_giver säger vem som skrev, så att samma par har två riktningar.
-- read_at: när den andra sidan öppnade samtalet och såg meddelandet (NULL = oläst). mailed_at: när mejlet om det skickades
-- (MUPP-052 mejl 6 och 7), så att meddelanden inom tio minuter ger ett mejl. Ingen tid visas för någon besökare.
-- Inga främmande nycklar, som ss_draw: lib/santa.ts tar bort raderna när dragningen stoppas eller startas om, och när en
-- grupp tas bort; den årliga rensningen (MUPP-044) tar bort dem med önskelistorna.
CREATE TABLE ss_message (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    INTEGER NOT NULL,
  giver_id    INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  from_giver  INTEGER NOT NULL CHECK (from_giver IN (0, 1)),
  text        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  read_at     INTEGER,
  mailed_at   INTEGER
);
CREATE INDEX ss_message_pair ON ss_message (giver_id, receiver_id);
CREATE INDEX ss_message_event ON ss_message (event_id);
