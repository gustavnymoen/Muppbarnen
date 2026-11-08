-- Secret Santa: familjer, personer och medlemskap (MUPP-038). Telefon och e-post är
-- personuppgifter: de läses bara av huvudadministratören på adminsidan, aldrig av besökarsidorna.
-- Riktiga namn och nummer läggs in på adminsidan och finns bara i databasen, aldrig i Git.
CREATE TABLE ss_family (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60)
);

-- En människa, en gång, även om hen är med i flera familjer. Telefonen är unik: den blir
-- inloggningen i MUPP-039, och två personer får inte dela den.
CREATE TABLE ss_person (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  phone TEXT NOT NULL UNIQUE CHECK (phone GLOB '07[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254)
);

-- Medlemskapet: en person i en familj. Önskelistan (MUPP-040) och lottningen (MUPP-041) hör till
-- medlemskapet, så de tas bort med det. Partnern är ett annat medlemskap i samma familj;
-- att länken går åt båda håll och stannar i familjen säkras av reglerna i lib/santa.ts.
CREATE TABLE ss_member (
  id                INTEGER PRIMARY KEY,
  family_id         INTEGER NOT NULL REFERENCES ss_family (id) ON DELETE CASCADE,
  person_id         INTEGER NOT NULL REFERENCES ss_person (id) ON DELETE CASCADE,
  partner_member_id INTEGER REFERENCES ss_member (id) ON DELETE SET NULL,
  UNIQUE (family_id, person_id)
);
CREATE INDEX ss_member_person ON ss_member (person_id);
