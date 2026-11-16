-- Familjer (MUPP-073): en förälder hör till en eller flera familjer, en Secret Santa-grupp till exakt en.
-- Beskrivningen visas för besökarna när de väljer familj (MUPP-080).
CREATE TABLE family (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 30)
);
CREATE UNIQUE INDEX family_name ON family (lower(trim(name)));

CREATE TABLE parent_family (
  parent_id INTEGER NOT NULL REFERENCES parent (id) ON DELETE CASCADE,
  family_id INTEGER NOT NULL REFERENCES family (id),
  PRIMARY KEY (parent_id, family_id)
);
CREATE INDEX parent_family_family ON parent_family (family_id);

-- NULL tills en rad får sin familj: den fylls i av triggern nedan, och koden kontrollerar valet
ALTER TABLE ss_event ADD COLUMN family_id INTEGER REFERENCES family (id);

-- En standardfamilj med alla föräldrar och grupper, så att inget saknar familj och sajten ser ut som förut.
-- Huvudadministratören döper om och delar upp den på adminsidan.
INSERT INTO family (name, description) VALUES ('Familj', '');
INSERT INTO parent_family (parent_id, family_id) SELECT id, (SELECT MIN(id) FROM family) FROM parent;
UPDATE ss_event SET family_id = (SELECT MIN(id) FROM family);

-- En ny förälder eller grupp som läggs in utan familj (till exempel av ett test eller ett skript) får den första familjen
CREATE TRIGGER parent_default_family AFTER INSERT ON parent
BEGIN
  INSERT INTO parent_family (parent_id, family_id) SELECT NEW.id, id FROM family ORDER BY id LIMIT 1;
END;
CREATE TRIGGER ss_event_default_family AFTER INSERT ON ss_event WHEN NEW.family_id IS NULL
BEGIN
  UPDATE ss_event SET family_id = (SELECT MIN(id) FROM family) WHERE id = NEW.id;
END;
