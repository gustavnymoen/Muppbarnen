-- Secret Santa: beloppet för presenterna i en grupp (MUPP-074), hela kronor. NULL = inget belopp.
ALTER TABLE ss_event ADD COLUMN amount INTEGER CHECK (amount IS NULL OR amount > 0);
