-- Secret Santa: önskelistan (MUPP-040). En lista per medlemskap (ss_member), alltså en per person och
-- familj, och ingen delning mellan familjer. Önskningarna tas bort med medlemskapet. Ingen pax och ingen
-- "obegränsad": bara den som lottningen ger personen får läsa listan (MUPP-042).
CREATE TABLE ss_wish (
  id          INTEGER PRIMARY KEY,
  member_id   INTEGER NOT NULL REFERENCES ss_member (id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 60),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 100),
  size        TEXT NOT NULL DEFAULT '' CHECK (length(size) <= 40),
  url         TEXT NOT NULL DEFAULT '' CHECK (length(url) <= 500)
);
CREATE INDEX ss_wish_member ON ss_wish (member_id);
