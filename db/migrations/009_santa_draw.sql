-- Secret Santa: dragningen (MUPP-041). En rad per givare och år: vem som ska handla åt vem. Raderna är både årets dragning
-- (som MUPP-042 läser) och historiken som "inte förra årets"-regeln läser nästa år. Inga främmande nycklar: historiken ska
-- finnas kvar när en deltagare tas bort eller gruppen rensas (MUPP-044); lib/santa.ts städar raderna när en deltagare eller
-- en grupp tas bort, och när dragningen stoppas.
CREATE TABLE ss_draw (
  event_id    INTEGER NOT NULL,
  year        INTEGER NOT NULL,
  giver_id    INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL CHECK (receiver_id <> giver_id),
  PRIMARY KEY (event_id, year, giver_id),
  UNIQUE (event_id, year, receiver_id)
);
