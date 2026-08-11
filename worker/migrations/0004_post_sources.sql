-- Quellenangaben für Blogartikel: eigenes Feld (statt Zweckentfremdung von
-- excerpt/content), damit Quellen im Admin-Panel getrennt vom Artikeltext
-- gepflegt und auf der Artikelseite als eigener "Quellen"-Block ausgegeben
-- werden können. Gleiches Prinzip wie bei content_raw/content_html: das
-- Textfeld zeigt immer sources_raw, sources_html wird bei jedem Speichern
-- serverseitig daraus gerendert (siehe src/lib/markdown.js).

ALTER TABLE posts ADD COLUMN sources_raw TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN sources_html TEXT NOT NULL DEFAULT '';
