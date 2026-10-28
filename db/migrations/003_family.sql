-- Föräldrar, barn och önskelistor (MUPP-003). Riktiga namn, födelsedatum och
-- storlekar läggs in på adminsidan och finns bara i databasen, aldrig i Git.
-- Textfälten har samma gränser som kontrollen på servern (lib/form-input.ts).
CREATE TABLE parent (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  is_master_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_master_admin IN (0, 1))
);

CREATE TABLE child (
  id           INTEGER PRIMARY KEY,
  parent_id    INTEGER NOT NULL REFERENCES parent (id),  -- en förälder med barn kan inte tas bort
  name         TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  birthdate    TEXT NOT NULL CHECK (birthdate GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  picture      TEXT NOT NULL DEFAULT '',  -- bildens namn i bildlagret, tomt tills en bild laddats upp
  size_clothes TEXT NOT NULL DEFAULT '' CHECK (length(size_clothes) <= 40),
  size_shoes   TEXT NOT NULL DEFAULT '' CHECK (length(size_shoes) <= 40),
  size_head    TEXT NOT NULL DEFAULT '' CHECK (length(size_head) <= 40),
  size_gloves  TEXT NOT NULL DEFAULT '' CHECK (length(size_gloves) <= 40)
);
CREATE INDEX child_parent ON child (parent_id);

-- En lista per barn och tillfälle; den skapas när första önskningen läggs till
CREATE TABLE wishlist (
  id       INTEGER PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES child (id) ON DELETE CASCADE,
  occasion TEXT NOT NULL CHECK (occasion IN ('birthday', 'christmas')),
  UNIQUE (child_id, occasion)
);

CREATE TABLE wishlist_item (
  id          INTEGER PRIMARY KEY,
  wishlist_id INTEGER NOT NULL REFERENCES wishlist (id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  size        TEXT NOT NULL DEFAULT '' CHECK (length(size) <= 40),
  url         TEXT NOT NULL DEFAULT '' CHECK (length(url) <= 500),
  unlimited   INTEGER NOT NULL DEFAULT 0 CHECK (unlimited IN (0, 1)),  -- 0 = kan paxas en gång
  claimed_by  TEXT,  -- används först av MUPP-005
  claimed_at  TEXT
);
CREATE INDEX wishlist_item_list ON wishlist_item (wishlist_id);
