-- Försök att logga in med sajtlösenordet, per IP-adress, för att begränsa
-- gissning (MUPP-009). Varje förfrågan kan köras i en ny funktion på Vercel,
-- så räkningen måste ligga i databasen. Gamla rader städas bort vid nya försök.
CREATE TABLE login_attempts (
  id           INTEGER PRIMARY KEY,
  ip           TEXT NOT NULL,
  attempted_at INTEGER NOT NULL  -- sekunder sedan 1970
);
CREATE INDEX login_attempts_ip_time ON login_attempts (ip, attempted_at);
