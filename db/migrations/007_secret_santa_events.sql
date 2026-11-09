-- Secret Santa: grupper (events) som vilken förälder som helst skapar (MUPP-048). Tidigare "familjer" som bara
-- huvudadministratören hade, med personer som delades mellan familjerna. Nu har varje grupp en ägare, och varje
-- medlem hör till en enda grupp och bär sina egna uppgifter. En person i flera grupper är en medlem i varje.
-- Telefon och e-post är personuppgifter och läses bara av gruppens administratör, aldrig av besökarsidorna.
--
-- Tabellerna byggs om i stället för att ändras (kolumner som ingår i UNIQUE och främmande nycklar går inte att
-- ta bort), utan att byta namn: först kopieras raderna, sedan tas de gamla tabellerna bort och de nya skapas.
-- Medlemmarnas id behålls, så önskelistorna (ss_wish) och partnerna följer med.
CREATE TABLE tmp_event AS
SELECT
  f.id AS id,
  COALESCE((SELECT id FROM parent WHERE is_master_admin = 1 ORDER BY id LIMIT 1), (SELECT MIN(id) FROM parent)) AS owner_id,
  -- Gruppnamn ska vara unika (MUPP-048-R2): en dubblett får sitt id efter namnet
  CASE
    WHEN f.id = (SELECT MIN(g.id) FROM ss_family g WHERE lower(trim(g.name)) = lower(trim(f.name))) THEN COALESCE(NULLIF(trim(f.name), ''), 'Grupp ' || f.id)
    ELSE substr(trim(f.name), 1, 50) || ' (' || f.id || ')'
  END AS name
FROM ss_family f;

CREATE TABLE tmp_member AS
SELECT m.id AS id, m.family_id AS event_id, p.name AS name, p.phone AS phone, p.email AS email, m.partner_member_id AS partner_member_id
FROM ss_member m JOIN ss_person p ON p.id = m.person_id;

CREATE TABLE tmp_wish AS SELECT * FROM ss_wish;

DROP TABLE ss_wish;
DROP TABLE ss_member;
DROP TABLE ss_person;
DROP TABLE ss_family;

CREATE TABLE ss_event (
  id       INTEGER PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES parent (id),  -- en förälder som äger en grupp kan inte tas bort
  name     TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60)
);
CREATE UNIQUE INDEX ss_event_name ON ss_event (lower(trim(name)));
CREATE INDEX ss_event_owner ON ss_event (owner_id);

-- Telefonen är unik inom gruppen: den blir inloggningen (MUPP-039). Att e-posten är unik inom gruppen
-- kontrolleras i lib/santa.ts (en gammal grupp kan ha samma adress två gånger).
CREATE TABLE ss_member (
  id                INTEGER PRIMARY KEY,
  event_id          INTEGER NOT NULL REFERENCES ss_event (id) ON DELETE CASCADE,
  name              TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  phone             TEXT NOT NULL CHECK (phone GLOB '07[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
  email             TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  partner_member_id INTEGER REFERENCES ss_member (id) ON DELETE SET NULL,
  UNIQUE (event_id, phone)
);

-- Önskelistan (MUPP-040): en lista per medlem, alltså en per person och grupp
CREATE TABLE ss_wish (
  id          INTEGER PRIMARY KEY,
  member_id   INTEGER NOT NULL REFERENCES ss_member (id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 60),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 100),
  size        TEXT NOT NULL DEFAULT '' CHECK (length(size) <= 40),
  url         TEXT NOT NULL DEFAULT '' CHECK (length(url) <= 500)
);
CREATE INDEX ss_wish_member ON ss_wish (member_id);

INSERT INTO ss_event (id, owner_id, name) SELECT id, owner_id, name FROM tmp_event;
INSERT INTO ss_member (id, event_id, name, phone, email, partner_member_id) SELECT id, event_id, name, phone, email, partner_member_id FROM tmp_member;
INSERT INTO ss_wish (id, member_id, title, description, size, url) SELECT id, member_id, title, description, size, url FROM tmp_wish;

DROP TABLE tmp_wish;
DROP TABLE tmp_member;
DROP TABLE tmp_event;
