-- Spärr efter felaktiga lösenord och gräns för skrivande anrop, per IP-adress
-- (TECH-005). Varje förfrågan kan köras i en ny funktion på Vercel, så
-- räkningen måste ligga i databasen. Gamla rader städas bort vid nya anrop.
-- Försöken ligger kvar i login_attempts (001): en rad per försök som ännu inte
-- visat sig vara rätt lösenord.
CREATE TABLE login_blocks (
  ip            TEXT PRIMARY KEY,
  blocked_until INTEGER NOT NULL  -- sekunder sedan 1970
);

CREATE TABLE write_requests (
  id           INTEGER PRIMARY KEY,
  ip           TEXT NOT NULL,
  requested_at INTEGER NOT NULL  -- sekunder sedan 1970
);
CREATE INDEX write_requests_ip_time ON write_requests (ip, requested_at);
