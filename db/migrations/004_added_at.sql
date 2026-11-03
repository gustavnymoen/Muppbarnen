-- Dagen då en önskning lades till (MUPP-031), ÅÅÅÅ-MM-DD i svensk tid. Den avgör vilket tillfälle
-- önskningen hör till och när den arkiveras. Servern sätter den vid varje ny önskning; en ny
-- kolumn kan inte ha dagens datum som standardvärde, därför den tomma texten här.
-- Önskningar som redan finns räknas som tillagda den dag migreringen körs (date('now') är UTC:
-- körs den mellan midnatt och 01/02 svensk tid blir det dagen före, vilket bara spelar roll den dag en månad efter tar slut).
ALTER TABLE wishlist_item ADD COLUMN added_at TEXT NOT NULL DEFAULT '';
UPDATE wishlist_item SET added_at = date('now');
