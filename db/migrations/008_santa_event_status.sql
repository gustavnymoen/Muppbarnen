-- Secret Santa: gruppens status (MUPP-051). Varje grupp är inaktiv till administratören aktiverar den (förbereder);
-- dragningen (MUPP-041) gör den sedan startad. Befintliga grupper blir inaktiva.
ALTER TABLE ss_event ADD COLUMN status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'preparing', 'started'));
