-- Vem som lagt till en önskning som inte stod i listan (MUPP-077): namnet en besökare skrev när hen lade till presenten.
-- NULL för de önskningar som en förälder lagt till. Namnet står också i claimed_by, så paxningen fungerar som vanligt.
ALTER TABLE wishlist_item ADD COLUMN added_by TEXT;
