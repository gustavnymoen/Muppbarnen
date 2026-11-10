-- Secret Santa: ändrade önskelistor (MUPP-042). list_changed_at: sedan när deltagarens lista har ändrats utan att givaren fått
-- veta det (millisekunder, NULL = inget väntar). list_mailed_at: när givaren senast fick mejlet, så att det går högst ett i timmen.
ALTER TABLE ss_member ADD COLUMN list_changed_at INTEGER;
ALTER TABLE ss_member ADD COLUMN list_mailed_at INTEGER;
